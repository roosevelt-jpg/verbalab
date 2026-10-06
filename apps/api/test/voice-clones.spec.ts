import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BillingService } from '../src/billing/billing.service';
import { VoiceClonesService } from '../src/voice-clones/voice-clones.service';
import { FixtureVoiceCloneAdapter } from '../src/voice-clones/elevenlabs-voice-clone.adapter';
import { AudioService } from '../src/audio/audio.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_vc_${name}_${Date.now()}_${Math.random()}`,
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

describe('Voice cloning (VL-064)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let clones: VoiceClonesService;
  let audio: AudioService;

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
    audio = app.get(AudioService);
    clones.setFixtureForTests(new FixtureVoiceCloneAdapter());
  });

  afterAll(async () => {
    clones.setFixtureForTests(null);
    await app.close();
  });

  it('rejects create without consent attestation', async () => {
    const org = await seedOrg(prisma, `vcnoconsent_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: org.id, plan: 'pro' });
    await expect(
      clones.create({
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        userId: org.memberships[0].userId,
        role: 'owner',
        name: 'Ada',
        consentAttested: false,
        consentNotes: 'Speaker signed release form RF-1',
        files: [
          {
            buffer: Buffer.from('fake-wav'),
            originalname: 'sample.wav',
            mimetype: 'audio/wav',
            size: 8,
          } as Express.Multer.File,
        ],
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });
  });

  it('rejects free plan', async () => {
    const org = await seedOrg(prisma, `vcfree_${Date.now()}`);
    await expect(
      clones.create({
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        userId: org.memberships[0].userId,
        role: 'owner',
        name: 'Ada',
        consentAttested: true,
        consentNotes: 'Speaker signed release form RF-1',
        files: [
          {
            buffer: Buffer.from('fake-wav'),
            originalname: 'sample.wav',
            mimetype: 'audio/wav',
            size: 8,
          } as Express.Multer.File,
        ],
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });

  it('creates pending clone, abuse-reviews to approved, synthesizes with watermark', async () => {
    const org = await seedOrg(prisma, `vcpro_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: org.id, plan: 'pro' });
    const workspaceId = org.workspaces[0].id;
    const userId = org.memberships[0].userId;

    const created = await clones.create({
      organizationId: org.id,
      workspaceId,
      userId,
      role: 'owner',
      name: 'Consented Speaker',
      consentAttested: true,
      consentNotes: 'Signed talent release on file TR-42',
      files: [
        {
          buffer: Buffer.from('RIFF....WAVE'),
          originalname: 'consent-sample.wav',
          mimetype: 'audio/wav',
          size: 12,
        } as Express.Multer.File,
      ],
    });
    expect(created.status).toBe('pending_review');
    expect(created.watermarkRequired).toBe(true);
    expect(created.usable).toBe(false);

    await expect(
      audio.speak({
        text: 'Hello',
        voice: created.voice,
        organizationId: org.id,
        workspaceId,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    const approved = await clones.review({
      organizationId: org.id,
      workspaceId,
      userId,
      role: 'owner',
      id: created.id,
      decision: 'approved',
      reviewNotes: 'Consent verified',
    });
    expect(approved.status).toBe('approved');
    expect(approved.providerVoiceId).toMatch(/^fixture_voice_/);
    expect(approved.usable).toBe(true);

    const spoken = await audio.speak({
      text: 'Habari',
      voice: approved.voice,
      organizationId: org.id,
      workspaceId,
      userId,
    });
    expect(spoken.provider).toBe('fixture_elevenlabs');
    expect(spoken.watermarkApplied).toBe(true);
    expect(spoken.audio.toString('utf8')).toContain('FIXTURE_CLONE');

    const disabled = await clones.disable({
      organizationId: org.id,
      workspaceId,
      userId,
      role: 'owner',
      id: created.id,
      reason: 'Abuse report',
    });
    expect(disabled.status).toBe('disabled');
  });
});
