import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { assertMeetingTransition, assertItemTransition } from '../src/meetingbridge/meetingbridge.state-machine';
import { contentHash } from '../src/meetingbridge/meetingbridge.hash';
import { meetingbridgeCatalog } from '../src/meetingbridge/meetingbridge.catalog';

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
              clerkUserId: `clerk_mb_${name}_${Date.now()}_${Math.random()}`,
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

describe('MeetingBridge domain units', () => {
  it('rejects illegal meeting transitions', () => {
    expect(() => assertMeetingTransition('minutes_issued', 'live')).toThrow();
    expect(() => assertMeetingTransition('scheduled', 'lobby')).not.toThrow();
  });

  it('rejects illegal item transitions', () => {
    expect(() => assertItemTransition('confirmed', 'declined')).toThrow();
    expect(() => assertItemTransition('proposed', 'reviewing')).not.toThrow();
  });

  it('hashes identical payloads the same way', () => {
    const payload = { a: 1, b: 'x' };
    expect(contentHash(payload)).toBe(contentHash(payload));
    expect(contentHash('dispatch-50')).toBe(contentHash('dispatch-50'));
  });

  it('catalog discloses media and silence policy honestly', () => {
    const catalog = meetingbridgeCatalog();
    expect(catalog.featureFlag).toBe('meetingBridge');
    expect(catalog.approvalPolicyDefault.silenceIsNotConsent).toBe(true);
    expect(['phrase_upload', 'webrtc_mesh', 'webrtc_sfu']).toContain(catalog.media.mode);
    expect(catalog.corridors.some((c) => c.id === 'en-ak')).toBe(true);
    expect(catalog.ghanaVoices.length).toBeGreaterThan(5);
    expect(catalog.integrations.taskSync.allowlistedDestinations).toContain('slack');
  });
});

describe('MeetingBridge API', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevFixture = process.env.MEETINGBRIDGE_ALLOW_FIXTURE_MT;
  const prevActors = process.env.MEETINGBRIDGE_ALLOW_TEST_ACTORS;
  const prevOpen = process.env.MEETINGBRIDGE_OPEN;

  beforeAll(async () => {
    process.env.MEETINGBRIDGE_ALLOW_FIXTURE_MT = '1';
    process.env.MEETINGBRIDGE_ALLOW_TEST_ACTORS = '1';
    process.env.MEETINGBRIDGE_OPEN = '1';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const gateway = app.get(GatewayService);
    gateway.setProviderForTests({
      name: 'fixture_mt',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture_mt',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    if (prevFixture === undefined) delete process.env.MEETINGBRIDGE_ALLOW_FIXTURE_MT;
    else process.env.MEETINGBRIDGE_ALLOW_FIXTURE_MT = prevFixture;
    if (prevActors === undefined) delete process.env.MEETINGBRIDGE_ALLOW_TEST_ACTORS;
    else process.env.MEETINGBRIDGE_ALLOW_TEST_ACTORS = prevActors;
    if (prevOpen === undefined) delete process.env.MEETINGBRIDGE_OPEN;
    else process.env.MEETINGBRIDGE_OPEN = prevOpen;
    await app.close();
  });

  it('runs dual confirmation, blocks silence-as-consent, invalidates on correction, issues minutes', async () => {
    const org = await seedOrg(prisma, 'meetingbridge');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'meetingbridge-test',
    });

    const organizer = 'organizer-user-1';
    const participant = 'participant-user-1';

    const created = await request(app.getHttpServer())
      .post('/v1/meetingbridge/meetings')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        title: 'Supplier coordination',
        agenda: 'Confirm dispatch quantities',
        corridor: 'en-ak',
        speakingLanguage: 'en',
        listeningLanguage: 'ak',
        timeZone: 'Africa/Accra',
        isDemo: true,
      })
      .expect(201);

    const meetingId = created.body.meeting.id as string;
    expect(created.body.meeting.state).toBe('scheduled');

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/lobby`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    const invite = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/invites`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({})
      .expect(201);
    expect(invite.body.joinPath).toContain('/meetingbridge/join/');

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/join`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .send({
        token: invite.body.token,
        speakingLanguage: 'ak',
        listeningLanguage: 'en',
        listeningMode: 'captions_only',
        consents: [
          { purpose: 'processing', decision: 'granted' },
          { purpose: 'recording', decision: 'denied' },
          { purpose: 'training', decision: 'denied' },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/start`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    const utterance = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/utterances`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        text: 'We will dispatch 50 bags of rice by 2026-10-16',
        language: 'en',
        targetLanguages: ['ak'],
      })
      .expect(201);

    const utteranceId = utterance.body.utterance.id as string;
    const sourceRevisionId = utterance.body.revision.id as string;
    expect(
      (utterance.body.translations as Array<{ targetLanguage: string; text: string }>).some(
        (t) => t.targetLanguage === 'ak' && t.text.includes('50 bags'),
      ),
    ).toBe(true);

    const proposed = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/items`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        kind: 'action',
        wording: 'Dispatch 50 bags of rice',
        ownerParticipantIds: [participant],
        requiredApproverIds: [organizer, participant],
        dueDate: '2026-10-16',
        sourceRevisionIds: [sourceRevisionId],
      })
      .expect(201);

    const itemId = proposed.body.proposedItemId as string;
    expect(proposed.body.items.find((i: { id: string }) => i.id === itemId).state).toBe('reviewing');

    // Silence / mere presence must not confirm.
    const silent = await request(app.getHttpServer())
      .get(`/v1/meetingbridge/meetings/${meetingId}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .expect(200);
    expect(silent.body.items.find((i: { id: string }) => i.id === itemId).state).toBe('reviewing');
    expect(silent.body.items.find((i: { id: string }) => i.id === itemId).revision.confirmations).toHaveLength(
      0,
    );

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/items/${itemId}/confirmations`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        meetingId,
        action: 'confirm',
        idempotencyKey: `org-confirm-${itemId}`,
      })
      .expect(201);

    const partial = await request(app.getHttpServer())
      .get(`/v1/meetingbridge/meetings/${meetingId}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(200);
    expect(partial.body.items.find((i: { id: string }) => i.id === itemId).state).toBe(
      'partially_confirmed',
    );

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/items/${itemId}/confirmations`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .send({
        meetingId,
        action: 'confirm',
        idempotencyKey: `part-confirm-${itemId}`,
      })
      .expect(201);

    const confirmed = await request(app.getHttpServer())
      .get(`/v1/meetingbridge/meetings/${meetingId}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .expect(200);
    expect(confirmed.body.items.find((i: { id: string }) => i.id === itemId).state).toBe('confirmed');

    // Source correction marks dependent item stale / superseded path.
    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/utterance-corrections`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        utteranceId,
        text: 'We will dispatch 15 bags of rice by 2026-10-16',
        reason: 'Quantity misheard',
      })
      .expect(201);

    const afterCorrection = await request(app.getHttpServer())
      .get(`/v1/meetingbridge/meetings/${meetingId}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(200);
    const correctedItem = afterCorrection.body.items.find((i: { id: string }) => i.id === itemId);
    expect(correctedItem.state).toBe('superseded');
    expect(correctedItem.revision).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/close`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    const minutes = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/minutes`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);
    expect(minutes.body.minutes.id).toBeTruthy();

    const exported = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/minutes/${minutes.body.minutes.id}/exports`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        meetingId,
        format: 'markdown',
        idempotencyKey: `export-${minutes.body.minutes.id}`,
      })
      .expect(201);
    expect(typeof exported.body.body).toBe('string');
    expect(exported.body.body.length).toBeGreaterThan(20);

    // Cross-tenant / unauthorized actor cannot read.
    const other = await seedOrg(prisma, 'meetingbridge_other');
    const otherKey = await apiKeys.create({
      organizationId: other.id,
      workspaceId: other.workspaces[0]!.id,
      userId: other.memberships[0]!.userId,
      name: 'meetingbridge-other',
    });
    await request(app.getHttpServer())
      .get(`/v1/meetingbridge/meetings/${meetingId}`)
      .set('Authorization', `Bearer ${otherKey.secret}`)
      .set('X-MeetingBridge-Actor-Id', 'outsider')
      .expect(404);
  });

  it('rejects unsupported corridors honestly', async () => {
    const org = await seedOrg(prisma, 'meetingbridge_bad_corridor');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'meetingbridge-bad',
    });
    await request(app.getHttpServer())
      .post('/v1/meetingbridge/meetings')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', 'org-1')
      .send({ title: 'Nope', corridor: 'xx-yy' })
      .expect(400);
  });

  it('amends items, syncs confirmed tasks, and hands off to DealBridge/VoiceBridge', async () => {
    process.env.DEALBRIDGE_OPEN = '1';
    process.env.VOICEBRIDGE_OPEN = '1';
    const org = await seedOrg(prisma, 'meetingbridge_handoff');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'meetingbridge-handoff',
    });
    const organizer = 'org-handoff';
    const participant = 'part-handoff';

    const created = await request(app.getHttpServer())
      .post('/v1/meetingbridge/meetings')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        title: 'Handoff meeting',
        corridor: 'en-fr',
        speakingLanguage: 'en',
        listeningLanguage: 'fr',
        timeZone: 'Africa/Accra',
      })
      .expect(201);
    const meetingId = created.body.meeting.id as string;

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/lobby`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    const invite = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/invites`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/join`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .send({
        token: invite.body.token,
        speakingLanguage: 'fr',
        listeningLanguage: 'en',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/start`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    const proposed = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/items`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        kind: 'action',
        wording: 'Dispatch 50 bags',
        ownerParticipantIds: [participant],
        requiredApproverIds: [organizer, participant],
        dueDate: '2026-10-20',
      })
      .expect(201);
    const itemId = proposed.body.proposedItemId as string;
    const rev = proposed.body.items.find((i: { id: string }) => i.id === itemId).revision
      .revisionNumber as number;

    const amended = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/items/${itemId}/revisions`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        meetingId,
        expectedRevision: rev,
        wording: 'Dispatch 50 bags of rice',
        dueDate: '2026-10-21',
      })
      .expect(201);
    expect(amended.body.items.find((i: { id: string }) => i.id === itemId).state).toBe('reviewing');
    expect(
      amended.body.items.find((i: { id: string }) => i.id === itemId).revision.revisionNumber,
    ).toBe(rev + 1);

    for (const actor of [organizer, participant]) {
      await request(app.getHttpServer())
        .post(`/v1/meetingbridge/items/${itemId}/confirmations`)
        .set('Authorization', `Bearer ${key.secret}`)
        .set('X-MeetingBridge-Actor-Id', actor)
        .send({
          meetingId,
          action: 'confirm',
          idempotencyKey: `handoff-confirm-${actor}-${itemId}`,
        })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/close`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/minutes`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/items/${itemId}/sync`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({ meetingId, destination: 'notion', idempotencyKey: 'bad-dest' })
      .expect(422);

    const synced = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/items/${itemId}/sync`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({ meetingId, destination: 'private_download', idempotencyKey: `sync-${itemId}` })
      .expect(201);
    expect(synced.body.sync.body).toContain('Dispatch 50 bags');

    const deal = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/handoff/dealbridge`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);
    expect(deal.body.dealbridgePath).toContain('/dealbridge/sessions/');

    const voice = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/handoff/voicebridge`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);
    expect(voice.body.voicebridgePath).toContain('/voicebridge/threads/');
  });

  it('wires media mesh, lobby mic-check, inbox, diagnostics, integrations, and broadcast', async () => {
    process.env.MEETINGBRIDGE_ALLOW_FIXTURE_INTEGRATIONS = '1';
    process.env.MEETINGBRIDGE_ALLOW_FIXTURE_TTS = '1';
    process.env.MEETINGBRIDGE_MESH = '1';
    delete process.env.MEETINGBRIDGE_MEDIA_URL;

    const org = await seedOrg(prisma, 'meetingbridge_media');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'meetingbridge-media',
    });
    const organizer = 'org-media';
    const participant = 'part-media';

    const created = await request(app.getHttpServer())
      .post('/v1/meetingbridge/meetings')
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        title: 'Media meeting',
        corridor: 'en-ak',
        speakingLanguage: 'en',
        listeningLanguage: 'ak',
      })
      .expect(201);
    const meetingId = created.body.meeting.id as string;
    expect(created.body.meeting.mediaMode).toBe('webrtc_mesh');

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/lobby`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    const mic = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/lobby/mic-check`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({ deviceLabel: 'test-mic', levelPeak: 0.2, muted: false })
      .expect(201);
    expect(mic.body.ok).toBe(true);
    expect(mic.body.mediaToken?.token).toMatch(/^mbmedia\./);

    const invite = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/invites`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/join`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .send({
        token: invite.body.token,
        speakingLanguage: 'ak',
        listeningLanguage: 'en',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/start`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    const tokenA = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/media/token`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);
    expect(tokenA.body.mode).toBe('webrtc_mesh');
    expect(tokenA.body.iceServers?.length).toBeGreaterThan(0);

    const tokenB = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/media/token`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/media/signal`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        token: tokenA.body.token,
        toUserId: participant,
        kind: 'offer',
        payload: { sdp: 'v=0' },
      })
      .expect(201);

    const pulled = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/media/signals/pull`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .send({ token: tokenB.body.token })
      .expect(201);
    expect(pulled.body.messages.some((m: { kind: string }) => m.kind === 'offer')).toBe(true);

    const proposed = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/items`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        kind: 'action',
        wording: 'Confirm warehouse slot',
        ownerParticipantIds: [participant],
        requiredApproverIds: [organizer, participant],
        dueDate: '2026-10-22',
      })
      .expect(201);
    const itemId = proposed.body.proposedItemId as string;

    const inbox = await request(app.getHttpServer())
      .get(`/v1/meetingbridge/meetings/${meetingId}/inbox`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .expect(200);
    expect(inbox.body.pendingCount).toBeGreaterThanOrEqual(1);
    expect(inbox.body.items.some((i: { id: string }) => i.id === itemId)).toBe(true);

    const diagnostics = await request(app.getHttpServer())
      .get(`/v1/meetingbridge/meetings/${meetingId}/diagnostics`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(200);
    expect(diagnostics.body.media.mode).toBe('webrtc_mesh');
    expect(diagnostics.body.ghanaVoices.some((v: { code: string }) => v.code === 'ak')).toBe(true);
    expect(diagnostics.body.integrations.slack.available).toBe(true);

    await request(app.getHttpServer())
      .get(`/v1/meetingbridge/meetings/${meetingId}/diagnostics`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', participant)
      .expect(403);

    for (const actor of [organizer, participant]) {
      await request(app.getHttpServer())
        .post(`/v1/meetingbridge/items/${itemId}/confirmations`)
        .set('Authorization', `Bearer ${key.secret}`)
        .set('X-MeetingBridge-Actor-Id', actor)
        .send({
          meetingId,
          action: 'confirm',
          idempotencyKey: `media-confirm-${actor}-${itemId}`,
        })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/close`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/minutes`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .expect(201);

    const slackSync = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/items/${itemId}/sync`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        meetingId,
        destination: 'slack',
        target: '#ops',
        idempotencyKey: `slack-${itemId}`,
      })
      .expect(201);
    expect(slackSync.body.external?.fixture).toBe(true);

    const calendarSync = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/items/${itemId}/sync`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({
        meetingId,
        destination: 'calendar',
        idempotencyKey: `cal-${itemId}`,
      })
      .expect(201);
    expect(String(calendarSync.body.sync.body)).toContain('BEGIN:VCALENDAR');

    const zoom = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/conferencing`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({ provider: 'zoom' })
      .expect(201);
    expect(zoom.body.status).toBe('fixture_joined');

    const broadcast = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/conferencing`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({ provider: 'broadcast' })
      .expect(201);
    expect(broadcast.body.broadcastPath).toContain('/meetingbridge/broadcast/');

    const publicCaps = await request(app.getHttpServer())
      .get(`/v1/meetingbridge/public/broadcast/${broadcast.body.externalId}`)
      .expect(200);
    expect(publicCaps.body.title).toBe('Media meeting');

    const tts = await request(app.getHttpServer())
      .post(`/v1/meetingbridge/meetings/${meetingId}/tts`)
      .set('Authorization', `Bearer ${key.secret}`)
      .set('X-MeetingBridge-Actor-Id', organizer)
      .send({ text: 'Yɛda wo ase', language: 'ak' })
      .expect(201);
    expect(tts.body.voice).toBe('own:ak-gh-female');
    expect(tts.body.audioBase64 || tts.body.status === 'unsupported').toBeTruthy();
  });
});
