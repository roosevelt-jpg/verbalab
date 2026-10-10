import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { access, mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GovernanceService } from '../src/governance/governance.service';
import { QualityService } from '../src/quality/quality.service';
import { TmService } from '../src/tm/tm.service';
import { LocalStorageService } from '../src/documents/local-storage.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { ApiException } from '../src/common/errors/api-exception';

async function seedOrg(prisma: PrismaService, name: string, role: MembershipRole = MembershipRole.owner) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role,
          user: {
            create: {
              clerkUserId: `clerk_gov_${name}_${Date.now()}_${Math.random()}`,
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

describe('Data governance', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let governance: GovernanceService;
  let quality: QualityService;
  let tm: TmService;
  let storage: LocalStorageService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'lugemi-gov-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    governance = app.get(GovernanceService);
    quality = app.get(QualityService);
    tm = app.get(TmService);
    storage = app.get(LocalStorageService);
  });

  afterAll(async () => {
    await app.close();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('updates data settings for the org', async () => {
    const org = await seedOrg(prisma, 'govSettings');
    const updated = await governance.updateSettings({
      organizationId: org.id,
      userId: org.memberships[0]!.userId,
      role: 'owner',
      retentionDays: 90,
      persistSourceText: false,
      allowVendorTraining: false,
    });
    expect(updated.retentionDays).toBe(90);
    expect(updated.persistSourceText).toBe(false);
    expect(updated.allowVendorTraining).toBe(false);

    const got = await governance.getSettings(org.id);
    expect(got).toMatchObject(updated);
  });

  it('rejects settings updates from members', async () => {
    const org = await seedOrg(prisma, 'govMember', MembershipRole.member);
    await expect(
      governance.updateSettings({
        organizationId: org.id,
        userId: org.memberships[0]!.userId,
        role: 'member',
        retentionDays: 30,
      }),
    ).rejects.toBeInstanceOf(ApiException);
  });

  it('exports only the requesting org workspace data', async () => {
    const orgA = await seedOrg(prisma, 'govExportA');
    const orgB = await seedOrg(prisma, 'govExportB');

    await prisma.glossaryTerm.create({
      data: {
        organizationId: orgA.id,
        workspaceId: orgA.workspaces[0]!.id,
        sourceLang: 'en',
        targetLang: 'sw',
        sourceTerm: 'hello',
        targetTerm: 'habari',
      },
    });
    await prisma.glossaryTerm.create({
      data: {
        organizationId: orgB.id,
        workspaceId: orgB.workspaces[0]!.id,
        sourceLang: 'en',
        targetLang: 'sw',
        sourceTerm: 'secret',
        targetTerm: 'siri',
      },
    });

    const exported = await governance.exportWorkspace({
      organizationId: orgA.id,
      workspaceId: orgA.workspaces[0]!.id,
      userId: orgA.memberships[0]!.userId,
      role: 'admin',
    });

    expect(exported.organization.id).toBe(orgA.id);
    expect(exported.glossaryTerms).toHaveLength(1);
    expect(exported.glossaryTerms[0]!.sourceTerm).toBe('hello');
    expect(exported.glossaryTerms.some((t) => t.sourceTerm === 'secret')).toBe(false);
  });

  it('deletes org with cascade and removes storage files; leaves other orgs', async () => {
    const orgA = await seedOrg(prisma, 'govDeleteA');
    const orgB = await seedOrg(prisma, 'govDeleteB');

    const key = `${orgA.id}/gov-file.txt`;
    await storage.writeBuffer(key, Buffer.from('confidential'));
    await prisma.document.create({
      data: {
        organizationId: orgA.id,
        workspaceId: orgA.workspaces[0]!.id,
        filename: 'gov-file.txt',
        mimeType: 'text/plain',
        sizeBytes: 12,
        storageKey: key,
        kind: 'source',
      },
    });

    await governance.deleteOrganization({
      organizationId: orgA.id,
      userId: orgA.memberships[0]!.userId,
      role: 'owner',
      confirmName: 'govDeleteA',
    });

    expect(await prisma.organization.findUnique({ where: { id: orgA.id } })).toBeNull();
    expect(await prisma.organization.findUnique({ where: { id: orgB.id } })).not.toBeNull();
    await expect(access(join(storageDir, key))).rejects.toThrow();
  });

  it('rejects org delete from non-owners and mismatched confirmName', async () => {
    const org = await seedOrg(prisma, 'govDeleteGuard');
    await expect(
      governance.deleteOrganization({
        organizationId: org.id,
        userId: org.memberships[0]!.userId,
        role: 'admin',
        confirmName: 'govDeleteGuard',
      }),
    ).rejects.toBeInstanceOf(ApiException);

    await expect(
      governance.deleteOrganization({
        organizationId: org.id,
        userId: org.memberships[0]!.userId,
        role: 'owner',
        confirmName: 'wrong-name',
      }),
    ).rejects.toBeInstanceOf(ApiException);
  });

  it('redacts review text and blocks TM when persistSourceText is false', async () => {
    const org = await seedOrg(prisma, 'govPersist');
    await governance.updateSettings({
      organizationId: org.id,
      userId: org.memberships[0]!.userId,
      role: 'owner',
      persistSourceText: false,
    });

    const review = await quality.recordFromTranslate({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      sourceLang: 'en',
      targetLang: 'sw',
      sourceText: 'secret source',
      targetText: 'secret target',
      provider: 'fixture',
    });

    const row = await prisma.translationReview.findUniqueOrThrow({ where: { id: review.reviewId } });
    expect(row.sourceText).toBe('[redacted]');
    expect(row.targetText).toBe('[redacted]');

    await expect(
      tm.upsertApproved({
        organizationId: org.id,
        workspaceId: org.workspaces[0]!.id,
        userId: org.memberships[0]!.userId,
        sourceLang: 'en',
        targetLang: 'sw',
        sourceText: 'nope',
        targetText: 'la',
      }),
    ).rejects.toBeInstanceOf(ApiException);
  });
});
