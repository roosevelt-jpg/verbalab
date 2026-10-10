import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { assertMessageTransition } from '../src/voicebridge/voicebridge.state-machine';
import { contentHash } from '../src/voicebridge/voicebridge.hash';
import { VoiceBridgeAdapters } from '../src/voicebridge/voicebridge.adapters';

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
              clerkUserId: `clerk_vb_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'fr' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('VoiceBridge domain units', () => {
  it('rejects illegal message transitions', () => {
    expect(() => assertMessageTransition('published', 'awaiting_review')).toThrow();
    expect(() => assertMessageTransition('awaiting_review', 'published')).not.toThrow();
  });

  it('hashes content stably', () => {
    expect(contentHash('50 bags')).toBe(contentHash('50 bags'));
    expect(contentHash('50 bags')).not.toBe(contentHash('15 bags'));
  });

  it('blocks spoken delivery on quantity mismatch', () => {
    const adapters = new VoiceBridgeAdapters({} as never, {} as never);
    const result = adapters.verifyCriticalTerms('50 bags of rice', '15 sacs de riz');
    expect(result.status).toBe('needs_clarification');
    expect(result.issues.some((i) => i.kind === 'quantity_mismatch')).toBe(true);
  });
});

describe('VoiceBridge HTTP', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKey: string;
  let organizationId: string;
  let workspaceId: string;

  beforeAll(async () => {
    process.env.VOICEBRIDGE_OPEN = '1';
    process.env.VOICEBRIDGE_ALLOW_TEST_ACTORS = '1';
    process.env.VOICEBRIDGE_ALLOW_FIXTURE_ASR = '1';
    process.env.VOICEBRIDGE_ALLOW_FIXTURE_MT = '1';
    process.env.VOICEBRIDGE_ALLOW_FIXTURE_TTS = '1';
    process.env.DEALBRIDGE_OPEN = '1';
    process.env.DEALBRIDGE_ALLOW_TEST_ACTORS = '1';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    const keys = app.get(ApiKeysService);
    const org = await seedOrg(prisma, `vb_${Date.now()}`);
    organizationId = org.id;
    workspaceId = org.workspaces[0]!.id;
    const created = await keys.create({
      organizationId,
      workspaceId,
      userId: org.memberships[0]!.userId,
      name: 'vb-test',
      environment: 'test',
    });
    apiKey = created.secret;
  });

  afterAll(async () => {
    await app?.close();
  });

  function auth(actor: string) {
    return {
      Authorization: `Bearer ${apiKey}`,
      'X-VoiceBridge-Actor-Id': actor,
      'X-Lugemi-Organization-Id': organizationId,
      'X-Lugemi-Workspace-Id': workspaceId,
    };
  }

  it('publishes one source revision into two language variants and propagates corrections', async () => {
    const create = await request(app.getHttpServer())
      .post('/v1/voicebridge/threads')
      .set(auth('vb-author'))
      .send({ title: 'Rice corridor', language: 'en', category: 'wholesale_rice' })
      .expect(201);

    const threadId = create.body.thread.id as string;

    const invite = await request(app.getHttpServer())
      .post(`/v1/voicebridge/threads/${threadId}/invites`)
      .set(auth('vb-author'))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/voicebridge/threads/${threadId}/join`)
      .set(auth('vb-fr'))
      .send({
        token: invite.body.token,
        language: 'fr',
        consents: [
          { purpose: 'processing', decision: 'granted' },
          { purpose: 'recording', decision: 'granted' },
          { purpose: 'training', decision: 'denied' },
        ],
      })
      .expect(201);

    // Third member also French — should share one variant group
    const invite2 = await request(app.getHttpServer())
      .post(`/v1/voicebridge/threads/${threadId}/invites`)
      .set(auth('vb-author'))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/voicebridge/threads/${threadId}/join`)
      .set(auth('vb-fr-2'))
      .send({
        token: invite2.body.token,
        language: 'fr',
        consents: [{ purpose: 'processing', decision: 'granted' }],
      })
      .expect(201);

    const draft = await request(app.getHttpServer())
      .post(`/v1/voicebridge/threads/${threadId}/messages`)
      .set(auth('vb-author'))
      .send({ text: 'We can deliver 50 bags of rice at GHS 320 per bag' })
      .expect(201);

    expect(draft.body.requiresSenderReview).toBe(true);

    const published = await request(app.getHttpServer())
      .post(`/v1/voicebridge/messages/${draft.body.messageId}/publish`)
      .set(auth('vb-author'))
      .send({
        expectedDraftRevisionId: draft.body.draftRevision.id,
        reviewedTranscript: 'We can deliver 50 bags of rice at GHS 320 per bag',
      })
      .expect(201);

    const msg = published.body.messages.find((m: { id: string }) => m.id === draft.body.messageId);
    expect(msg.activeRevisionId).toBeTruthy();
    const revisionId = msg.activeRevisionId as string;

    const variants = await prisma.voiceLanguageVariant.findMany({
      where: { sourceRevisionId: revisionId },
    });
    // en (author) + fr (two members, one group) => 2 variants
    expect(variants.length).toBe(2);
    expect(new Set(variants.map((v) => v.targetLanguage))).toEqual(new Set(['en', 'fr']));

    const stale = await request(app.getHttpServer())
      .post(`/v1/voicebridge/messages/${draft.body.messageId}/corrections`)
      .set(auth('vb-author'))
      .send({
        expectedActiveRevisionId: 'not-the-active-id',
        reviewedTranscript: 'We can deliver 15 bags of rice at GHS 320 per bag',
      });
    expect(stale.status).toBe(409);

    const corrected = await request(app.getHttpServer())
      .post(`/v1/voicebridge/messages/${draft.body.messageId}/corrections`)
      .set(auth('vb-author'))
      .send({
        expectedActiveRevisionId: revisionId,
        reviewedTranscript: 'We can deliver 15 bags of rice at GHS 320 per bag',
        correctionReason: 'quantity_fix',
      })
      .expect(201);

    const correctedMsg = corrected.body.messages.find((m: { id: string }) => m.id === draft.body.messageId);
    expect(correctedMsg.activeRevisionId).not.toBe(revisionId);
    expect(correctedMsg.activeRevision.supersedesId).toBe(revisionId);

    const old = await prisma.voiceSourceRevision.findUniqueOrThrow({ where: { id: revisionId } });
    expect(old.status).toBe('superseded');

    // Old worker finishing cannot become current — job for old revision marked stale if re-run
    const frView = await request(app.getHttpServer())
      .get(`/v1/voicebridge/threads/${threadId}`)
      .set(auth('vb-fr'))
      .expect(200);
    const frMsg = frView.body.messages.find((m: { id: string }) => m.id === draft.body.messageId);
    expect(frMsg.activeRevision.reviewedTranscript).toContain('15 bags');
    expect(frMsg.myVariant.targetLanguage).toBe('fr');

    const activeId = correctedMsg.activeRevisionId as string;
    const handoff = await request(app.getHttpServer())
      .post(`/v1/voicebridge/threads/${threadId}/deal-drafts`)
      .set(auth('vb-author'))
      .send({
        selectedRevisionIds: [activeId],
        partyAUserId: 'vb-author',
        partyBUserId: 'vb-fr',
        category: 'wholesale_rice',
      })
      .expect(201);
    expect(handoff.body.dealSessionId).toBeTruthy();
    expect(handoff.body.note).toMatch(/draft/i);
  });
});
