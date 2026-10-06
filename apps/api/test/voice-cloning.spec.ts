import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BillingService } from '../src/billing/billing.service';
import { VoiceClonesService } from '../src/voice-clones/voice-clones.service';
import { FixtureVoiceCloneAdapter } from '../src/voice-clones/vendor-voice-clone.adapter';
import { VoiceCloningService } from '../src/voice-cloning/voice-cloning.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_vcl_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

function sample(n: number): Express.Multer.File[] {
  return Array.from({ length: n }, (_, i) => ({
    buffer: Buffer.from(`fake-wav-${i}`),
    originalname: `sample-${i}.wav`,
    mimetype: 'audio/wav',
    size: 12,
  })) as Express.Multer.File[];
}

describe('Voice Cloning Platform (VL-172)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let clones: VoiceClonesService;
  let cloning: VoiceCloningService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    clones = app.get(VoiceClonesService);
    cloning = app.get(VoiceCloningService);
    clones.setFixtureForTests(new FixtureVoiceCloneAdapter());
  });

  afterAll(async () => {
    clones.setFixtureForTests(null);
    await app.close();
  });

  it('documents cloning trust gates (consent + watermark, no ToS-only)', () => {
    const doc = join(root, 'docs/VOICE_CLONING.md');
    const adr = join(root, 'docs/adr/0083-voice-cloning-platform.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Consent');
    expect(text).toContain('Watermark');
    expect(text).toContain('ownership');
    expect(text).toMatch(/not\*\* Resemble|is \*\*not\*\* Resemble/i);
  });

  it('exposes engine + consent policy with honest professional status', async () => {
    const engine = await request(app.getHttpServer()).get('/v1/voice-cloning/engine').expect(200);
    expect(engine.body.product).toBe('Lugemi Voice Cloning');
    expect(engine.body.trust.consentRequired).toBe(true);
    expect(engine.body.trust.watermarkRequired).toBe(true);
    expect(engine.body.architecture.primaryRegion).toBe('af-south-1');

    const instant = engine.body.capabilities.find((c: { id: string }) => c.id === 'instant-cloning');
    expect(instant.status).toBe('shipped');
    const pro = engine.body.capabilities.find((c: { id: string }) => c.id === 'professional-cloning');
    expect(pro.status).toBe('partial');

    const policy = await request(app.getHttpServer())
      .get('/v1/voice-cloning/consent/policy')
      .expect(200);
    expect(policy.body.required.consentAttested).toBe(true);
    expect(policy.body.professionalMode.minSamples).toBe(3);
    expect(policy.body.forbidden.some((f: string) => /ToS/i.test(f))).toBe(true);
  });

  it('enrolls instant clone and updates ownership/license/permissions/verify', async () => {
    const org = await seedOrg(prisma, `vcl_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: org.id, plan: 'pro' });

    const created = await cloning.enroll({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      role: 'owner',
      name: 'Ada Instant',
      consentAttested: true,
      consentNotes: 'Speaker signed release form RF-ADA-1',
      files: sample(1),
      cloneMode: 'instant',
      licenseType: 'internal',
    });

    expect(created.cloneMode).toBe('instant');
    expect(created.consentAttested).toBe(true);
    expect(created.watermarkRequired).toBe(true);
    expect(created.status).toBe('pending_review');

    const owned = await cloning.updateOwnership({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      role: 'owner',
      id: created.id,
      ownershipAttested: true,
      ownershipNotes: 'Org owns exclusive rights per RF-ADA-1',
    });
    expect(owned.ownershipAttested).toBe(true);

    const licensed = await cloning.updateLicense({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      role: 'owner',
      id: created.id,
      licenseType: 'commercial',
      licenseNotes: 'Internal commercial use only',
    });
    expect(licensed.licenseType).toBe('commercial');

    const perms = await cloning.updatePermissions({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      role: 'owner',
      id: created.id,
      permissions: { canShare: true, canExport: false },
    });
    expect(perms.permissions.canShare).toBe(true);

    const verified = await cloning.verifyEnrollment({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      role: 'owner',
      id: created.id,
    });
    expect(verified.enrollmentVerified).toBe(true);

    const analytics = await cloning.analytics(org.id, org.workspaces[0].id);
    expect(analytics.total).toBeGreaterThanOrEqual(1);
    expect(analytics.consentAttested).toBeGreaterThanOrEqual(1);
  });

  it('requires ownership + 3 samples for professional enroll', async () => {
    const org = await seedOrg(prisma, `vclpro_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: org.id, plan: 'pro' });

    await expect(
      cloning.enroll({
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        userId: org.memberships[0].userId,
        role: 'owner',
        name: 'Pro Voice',
        consentAttested: true,
        consentNotes: 'Speaker signed release form RF-PRO-1',
        files: sample(2),
        cloneMode: 'professional',
        ownershipAttested: true,
        ownershipNotes: 'Org owns rights',
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });

    const ok = await cloning.enroll({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      role: 'owner',
      name: 'Pro Voice',
      consentAttested: true,
      consentNotes: 'Speaker signed release form RF-PRO-1',
      files: sample(3),
      cloneMode: 'professional',
      ownershipAttested: true,
      ownershipNotes: 'Org owns exclusive rights per RF-PRO-1',
      licenseType: 'restricted',
    });
    expect(ok.cloneMode).toBe('professional');
    expect(ok.ownershipAttested).toBe(true);
    expect(ok.sampleCount).toBe(3);
  });

  it('exposes voiceCloningEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ voiceCloningEngine { product consentRequired watermarkRequired capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.voiceCloningEngine.consentRequired).toBe(true);
    expect(res.body.data.voiceCloningEngine.watermarkRequired).toBe(true);
    expect(
      res.body.data.voiceCloningEngine.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'professional-cloning' && c.status === 'partial',
      ),
    ).toBe(true);
  });
});
