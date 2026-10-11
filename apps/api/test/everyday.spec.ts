import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { createHash } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import {
  answerQuestionFromSource,
  assessCaptureQuality,
  buildBlocksFromText,
  replyCommitmentFindings,
  validateEvidenceBlockIds,
} from '../src/everyday/everyday.checks';
import { everydayCatalog } from '../src/everyday/everyday.catalog';
import { hashText } from '../src/everyday/everyday.hash';

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
              clerkUserId: `clerk_ed_${name}_${Date.now()}_${Math.random()}`,
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

describe('Everyday units', () => {
  it('requests recapture for blurred captures instead of guessing', () => {
    const report = assessCaptureQuality({
      buffer: Buffer.from('School notice [BLURRED] deadline'),
      mimeType: 'text/plain',
      originalName: 'blur-notice.txt',
    });
    expect(report.requireRecapture).toBe(true);
    expect(report.findings.some((f) => f.code === 'blur_or_obscured')).toBe(true);
  });

  it('keeps table-like labels and rejects invented evidence ids', () => {
    const blocks = buildBlocksFromText(
      'Amount due | GHS 150\n\nDue date | 2026-10-20\n\nReference: REF-00042',
    );
    expect(blocks.some((b) => b.kind === 'table_cell' || /Amount due/i.test(b.text))).toBe(true);
    const bad = validateEvidenceBlockIds(blocks, ['block_999']);
    expect(bad.ok).toBe(false);
  });

  it('does not invent deadlines when text is unreadable', () => {
    const blocks = buildBlocksFromText('Please pay by [OBSCURED] unreadable date.');
    const ans = answerQuestionFromSource({
      question: 'By when?',
      blocks,
      missingPages: false,
    });
    expect(ans.answerability).toBe('unreadable');
    expect(ans.claims).toHaveLength(0);
  });

  it('blocks unauthorized reply commitments', () => {
    const findings = replyCommitmentFindings(
      'Please confirm I received the notice.',
      'I agree to pay GHS 500 by wire transfer on 2026-11-01.',
    );
    expect(findings.some((f) => f.code === 'unauthorized_payment_commitment')).toBe(true);
  });

  it('catalog discloses honesty without MVP stubs', () => {
    const catalog = everydayCatalog();
    expect(catalog.featureFlag).toBe('everyday');
    expect(catalog.modes.length).toBe(3);
    expect(catalog.corridors.length).toBeGreaterThanOrEqual(4);
    expect(catalog.limits.automaticSending).toBe(false);
    expect(JSON.stringify(catalog).toLowerCase()).not.toContain('todo');
  });
});

describe('Everyday API', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    process.env.EVERYDAY_OPEN = '1';
    process.env.EVERYDAY_ALLOW_TEST_ACTORS = '1';
    process.env.EVERYDAY_ALLOW_FIXTURE_OCR = '1';
    process.env.EVERYDAY_ALLOW_FIXTURE_MT = '1';
    process.env.EVERYDAY_ALLOW_FIXTURE_TTS = '1';

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

  it('runs capture → OCR → translate → explain → Q&A → reply approval → delete', async () => {
    const org = await seedOrg(prisma, 'everyday');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'everyday-test',
    });
    const actor = 'everyday-user-1';
    const auth = {
      Authorization: `Bearer ${key.secret}`,
      'X-Everyday-Actor-Id': actor,
    };

    const created = await request(app.getHttpServer())
      .post('/v1/everyday/sessions')
      .set(auth)
      .send({ mode: 'read_this_to_me', corridor: 'en-ak' })
      .expect(201);
    const sessionId = created.body.session.id as string;

    const notice = [
      'School notice',
      'Please attend the parents meeting by 2026-10-20.',
      'Amount due: GHS 150.',
      'Reference: REF-00042.',
      'Do not ignore this letter.',
    ].join('\n\n');
    const upload = await request(app.getHttpServer())
      .post(`/v1/everyday/sessions/${sessionId}/uploads`)
      .set(auth)
      .send({
        filename: 'school-notice.txt',
        mimeType: 'text/plain',
        contentBase64: Buffer.from(notice, 'utf8').toString('base64'),
      })
      .expect(201);
    expect(upload.body.source?.id).toBeTruthy();
    const sourceId = upload.body.source.id as string;
    const documentId = upload.body.document.id as string;

    const blur = await request(app.getHttpServer())
      .post(`/v1/everyday/sessions/${sessionId}/uploads`)
      .set(auth)
      .send({
        filename: 'blur-deadline.txt',
        mimeType: 'text/plain',
        contentBase64: Buffer.from('Deadline [BLURRED]', 'utf8').toString('base64'),
      })
      .expect(201);
    expect(blur.body.document.status).toBe('recapture_required');

    const translated = await request(app.getHttpServer())
      .post(`/v1/everyday/sources/${sourceId}/translations`)
      .set(auth)
      .send({})
      .expect(201);
    expect(translated.body.translation.faithfulText).toContain('REF-00042');
    expect(translated.body.translation.faithfulText).toMatch(/150/);

    const explained = await request(app.getHttpServer())
      .post(`/v1/everyday/sources/${sourceId}/explanations`)
      .set(auth)
      .send({ translationRevisionId: translated.body.translation.id })
      .expect(201);
    expect(explained.body.explanation.adviceDisclaimer).toMatch(/not medical/i);

    const qa = await request(app.getHttpServer())
      .post(`/v1/everyday/sources/${sourceId}/questions`)
      .set(auth)
      .send({ question: 'By when?' })
      .expect(201);
    expect(qa.body.answer.answerability).toBe('supported');
    expect(qa.body.answer.evidence.length).toBeGreaterThan(0);

    const audio = await request(app.getHttpServer())
      .post('/v1/everyday/audio')
      .set(auth)
      .send({ kind: 'translation', translationRevisionId: translated.body.translation.id })
      .expect(201);
    expect(audio.body.audio.hasBytes).toBe(true);

    await request(app.getHttpServer())
      .post(`/v1/everyday/documents/${documentId}/source-revisions`)
      .set(auth)
      .send({
        fullText: notice + '\n\nUpdated line.',
        expectedSourceRevisionId: sourceId,
      })
      .expect(201);

    // Stale source cannot translate
    await request(app.getHttpServer())
      .post(`/v1/everyday/sources/${sourceId}/translations`)
      .set(auth)
      .send({})
      .expect(409);

    const reply = await request(app.getHttpServer())
      .post(`/v1/everyday/sessions/${sessionId}/replies`)
      .set(auth)
      .send({ userSourceText: 'I will attend on the date shown. Thank you.' })
      .expect(201);

    const badReply = await request(app.getHttpServer())
      .post(`/v1/everyday/sessions/${sessionId}/replies`)
      .set(auth)
      .send({ userSourceText: 'Please confirm receipt.' })
      .expect(201);
    // Force a reply with invented commitment via direct approve attempt after mutating — use critical findings path
    expect(
      replyCommitmentFindings(
        'Please confirm receipt.',
        'I agree to pay GHS 900 by wire transfer.',
      ).length,
    ).toBeGreaterThan(0);

    const sourceHash = hashText(reply.body.reply.userSourceText);
    const targetHash = hashText(reply.body.reply.targetText);
    await request(app.getHttpServer())
      .post(`/v1/everyday/replies/${reply.body.reply.id}/approvals`)
      .set(auth)
      .send({
        action: 'approve_copy',
        sourcePresentationHash: sourceHash,
        targetPresentationHash: targetHash,
      })
      .expect(201);

    // Wrong hash fails
    await request(app.getHttpServer())
      .post(`/v1/everyday/replies/${badReply.body.reply.id}/approvals`)
      .set(auth)
      .send({
        action: 'approve_copy',
        sourcePresentationHash: createHash('sha256').update('nope').digest('hex'),
        targetPresentationHash: targetHash,
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/v1/everyday/sessions/${sessionId}/terms`)
      .set(auth)
      .send({ selectedSpan: 'Amount due', sourceRevisionId: upload.body.source.id })
      .expect(409); // source was corrected — old id inactive

    const sessionAfter = await request(app.getHttpServer())
      .get(`/v1/everyday/sessions/${sessionId}`)
      .set(auth)
      .expect(200);
    const readyDoc = (sessionAfter.body.documents as Array<{
      status: string;
      sourceRevisions: Array<{ id: string }>;
    }>).find((d) => d.sourceRevisions?.length);
    expect(readyDoc).toBeTruthy();
    const activeSourceId = readyDoc!.sourceRevisions[0]!.id;
    await request(app.getHttpServer())
      .post(`/v1/everyday/sessions/${sessionId}/terms`)
      .set(auth)
      .send({ selectedSpan: 'Amount due', sourceRevisionId: activeSourceId, scope: 'document' })
      .expect(201);

    // Cross-tenant isolation
    const org2 = await seedOrg(prisma, 'everyday_other');
    const key2 = await apiKeys.create({
      organizationId: org2.id,
      workspaceId: org2.workspaces[0]!.id,
      userId: org2.memberships[0]!.userId,
      name: 'everyday-other',
    });
    await request(app.getHttpServer())
      .get(`/v1/everyday/sessions/${sessionId}`)
      .set({
        Authorization: `Bearer ${key2.secret}`,
        'X-Everyday-Actor-Id': 'outsider',
      })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/v1/everyday/sessions/${sessionId}`)
      .set(auth)
      .expect(200);

    await request(app.getHttpServer()).get(`/v1/everyday/sessions/${sessionId}`).set(auth).expect(404);

    // Sensitive category requires acknowledgement
    await request(app.getHttpServer())
      .post('/v1/everyday/sessions')
      .set(auth)
      .send({ mode: 'read_this_to_me', documentCategory: 'medical' })
      .expect(400);
  });
});
