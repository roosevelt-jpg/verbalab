import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import {
  runCriticalInformationChecks,
  runAudioIntegrityChecks,
} from '../src/language-assurance/assurance.checks';
import { languageAssuranceCatalog } from '../src/language-assurance/assurance.catalog';
import { hashText } from '../src/language-assurance/assurance.hash';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      plan: 'pro',
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_la_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'ak' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Language Assurance units', () => {
  it('flags quantity and negation mismatches with evidence', () => {
    const findings = runCriticalInformationChecks(
      'Dispatch 15 bags. Do not ship early.',
      'Dispatch 50 bags. Ship early.',
    );
    expect(findings.some((f) => f.category === 'quantity_mismatch')).toBe(true);
    expect(findings.some((f) => f.category === 'negation_mismatch')).toBe(true);
  });

  it('treats equivalent number formats as matching', () => {
    const findings = runCriticalInformationChecks('Ship 1,500 units for 100.0 GHS', 'Ship 1500 units for 100 GHS');
    expect(findings.filter((f) => f.category === 'quantity_mismatch')).toHaveLength(0);
    expect(findings.filter((f) => f.category === 'currency_mismatch')).toHaveLength(0);
  });

  it('rejects provider error payloads and corrupt audio', () => {
    const err = runAudioIntegrityChecks({
      audioBase64: Buffer.from('{"error":"upstream failed"}').toString('base64'),
      audioMimeType: 'audio/wav',
      requireAudio: true,
    });
    expect(err.ok).toBe(false);
    expect(err.findings.some((f) => f.reasonCode === 'PROVIDER_ERROR_AS_AUDIO')).toBe(true);

    const tiny = runAudioIntegrityChecks({
      audioBase64: Buffer.from('RIFF').toString('base64'),
      requireAudio: true,
    });
    expect(tiny.ok).toBe(false);
  });

  it('catalog discloses honesty and feature flag', () => {
    const catalog = languageAssuranceCatalog();
    expect(catalog.featureFlag).toBe('languageAssurance');
    expect(catalog.honesty.length).toBeGreaterThan(2);
    expect(catalog.corridors.some((c) => c.id === 'en-ak')).toBe(true);
  });
});

describe('Language Assurance API', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    process.env.LANGUAGE_ASSURANCE_OPEN = '1';
    process.env.LANGUAGE_ASSURANCE_ALLOW_TEST_ACTORS = '1';
    process.env.LANGUAGE_ASSURANCE_ALLOW_FIXTURE_ASR = '1';
    process.env.LANGUAGE_ASSURANCE_SPOKEN_ASR = '0';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks critical mismatches, assigns independent review, and pins release evidence', async () => {
    const org = await seedOrg(prisma, 'language_assurance');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'assurance-test',
    });
    const producer = 'producer-1';
    const reviewer = 'reviewer-1';

    const created = await request(app.getHttpServer())
      .post('/v1/language-assurance/runs')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', producer)
      .send({
        product: 'voice_studio',
        contentCategory: 'business_announcement',
        corridor: 'en-ak',
        sourceText: 'Send 15 boxes of rice. Do not cancel.',
        targetText: 'Send 15 boxes of rice. Do not cancel.',
        task: 'preview',
        policyVersion: 'preview_unreviewed_v1',
        idempotencyKey: `ok-${Date.now()}`,
      })
      .expect(201);
    expect(created.body.run.disposition).toBe('eligible_under_policy');

    const bad = await request(app.getHttpServer())
      .post('/v1/language-assurance/runs')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', producer)
      .send({
        product: 'voice_studio',
        contentCategory: 'business_announcement',
        corridor: 'en-ak',
        sourceText: 'Send 15 boxes. Do not cancel.',
        targetText: 'Send 50 boxes. Please cancel.',
        task: 'preview',
        policyVersion: 'preview_unreviewed_v1',
        idempotencyKey: `bad-${Date.now()}`,
      })
      .expect(201);
    expect(bad.body.run.disposition).toBe('needs_clarification');
    expect(bad.body.findings.some((f: { category: string }) => f.category === 'quantity_mismatch')).toBe(
      true,
    );

    // Business policy with native review for matching text
    const reviewRun = await request(app.getHttpServer())
      .post('/v1/language-assurance/runs')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', producer)
      .send({
        product: 'voice_studio',
        contentCategory: 'business_announcement',
        corridor: 'en-ak',
        sourceText: 'Meeting at 10:00 for 100 GHS.',
        targetText: 'Meeting at 10:00 for 100 GHS.',
        task: 'business_batch_audio',
        policyVersion: 'business_audio_v1',
        idempotencyKey: `biz-${Date.now()}`,
        assignReviewerUserId: reviewer,
      })
      .expect(201);
    // Spoken ASR unavailable → indeterminate OR human_review if spoken skipped logic
    expect(['human_review_required', 'indeterminate']).toContain(reviewRun.body.run.disposition);

    const runId = reviewRun.body.run.id as string;
    const sourceHash = reviewRun.body.bundle.sourceTextHash as string;
    const targetHash = reviewRun.body.bundle.targetTextHash as string;

    // Producer cannot self-assign under independent review
    await request(app.getHttpServer())
      .post(`/v1/language-assurance/runs/${runId}/assignments`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', producer)
      .send({ reviewerUserId: producer })
      .expect(403);

    let assignmentId = reviewRun.body.assignments?.[0]?.id as string | undefined;
    if (!assignmentId) {
      const assigned = await request(app.getHttpServer())
        .post(`/v1/language-assurance/runs/${runId}/assignments`)
        .set('Authorization', `Bearer ${key.secret}`)
        .set('X-LanguageAssurance-Actor-Id', producer)
        .send({ reviewerUserId: reviewer })
        .expect(201);
      assignmentId = assigned.body.assignment.id as string;
    }

    // Stale hash rejects review
    await request(app.getHttpServer())
      .post(`/v1/language-assurance/reviews/${assignmentId}/submit`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', reviewer)
      .send({
        judgment: 'approve',
        sourceTextHash: hashText('different'),
        targetTextHash: targetHash,
      })
      .expect(409);

    // If disposition is indeterminate due to spoken ASR, release should fail — use preview eligible path for release
    const eligible = await request(app.getHttpServer())
      .post('/v1/language-assurance/runs')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', producer)
      .send({
        product: 'generic',
        contentCategory: 'preview',
        corridor: 'en-ak',
        sourceText: 'Confirm 20 bags for 50 GHS on 2026-11-01.',
        targetText: 'Confirm 20 bags for 50 GHS on 2026-11-01.',
        task: 'preview',
        policyVersion: 'preview_unreviewed_v1',
        idempotencyKey: `release-${Date.now()}`,
      })
      .expect(201);
    expect(eligible.body.run.disposition).toBe('eligible_under_policy');

    const release = await request(app.getHttpServer())
      .post(`/v1/language-assurance/runs/${eligible.body.run.id}/release-evidence`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', producer)
      .send({ reason: 'pilot export' })
      .expect(201);
    expect(release.body.release.evidenceHash).toBeTruthy();

    // Idempotent release
    await request(app.getHttpServer())
      .post(`/v1/language-assurance/runs/${eligible.body.run.id}/release-evidence`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', producer)
      .send({})
      .expect(201);

    // Approve the business assignment when hashes match (even if overall disposition indeterminate)
    await request(app.getHttpServer())
      .post(`/v1/language-assurance/reviews/${assignmentId}/submit`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', reviewer)
      .send({
        judgment: 'approve',
        sourceTextHash: sourceHash,
        targetTextHash: targetHash,
        meaningOk: true,
      })
      .expect(201);

    const report = await request(app.getHttpServer())
      .get(`/v1/language-assurance/runs/${eligible.body.run.id}/report`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', producer)
      .expect(200);
    expect(report.body.reportHash).toBeTruthy();

    // Cross-tenant denied
    const other = await seedOrg(prisma, 'language_assurance_other');
    const otherKey = await apiKeys.create({
      organizationId: other.id,
      workspaceId: other.workspaces[0]!.id,
      userId: other.memberships[0]!.userId,
      name: 'assurance-other',
    });
    await request(app.getHttpServer())
      .get(`/v1/language-assurance/runs/${eligible.body.run.id}`)
      .set('Authorization', `Bearer ${otherKey.secret}`)
      .set('X-LanguageAssurance-Actor-Id', 'outsider')
      .expect(404);
  });

  it('voice studio integration rejects mismatched audio hashes', async () => {
    const org = await seedOrg(prisma, 'language_assurance_studio');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'assurance-studio',
    });
    await request(app.getHttpServer())
      .post('/v1/language-assurance/integrations/voice-studio')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-LanguageAssurance-Actor-Id', 'studio-user')
      .send({
        sourceText: 'Hello',
        targetText: 'Hello',
        audioBase64: Buffer.from('not-real-audio-bytes-long-enough!!').toString('base64'),
        audioSha256: 'deadbeef',
        idempotencyKey: `studio-${Date.now()}`,
      })
      .expect(400);
  });
});
