import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { intervalsOverlap, selectMatch, assertGeneralDomain } from '../src/relay/relay.checks';
import { relayCatalog } from '../src/relay/relay.catalog';

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
              clerkUserId: `clerk_relay_${name}_${Date.now()}_${Math.random()}`,
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

describe('Relay units', () => {
  it('rejects medical/legal domains', () => {
    expect(assertGeneralDomain('medical').ok).toBe(false);
    expect(assertGeneralDomain('general_business').ok).toBe(true);
  });

  it('detects overlapping intervals with buffer', () => {
    const a0 = new Date('2026-10-11T10:00:00Z');
    const a1 = new Date('2026-10-11T10:30:00Z');
    const b0 = new Date('2026-10-11T10:32:00Z');
    const b1 = new Date('2026-10-11T11:00:00Z');
    expect(intervalsOverlap(a0, a1, b0, b1, 5)).toBe(true);
    expect(intervalsOverlap(a0, a1, b0, b1, 0)).toBe(false);
  });

  it('matches deterministically without inventing supply', () => {
    const start = new Date('2026-10-11T12:00:00Z');
    const end = new Date('2026-10-11T12:30:00Z');
    const chosen = selectMatch({
      sourceLanguage: 'ak',
      targetLanguage: 'en',
      category: 'general_business',
      windowStart: start,
      windowEnd: end,
      candidates: [
        {
          interpreterId: 'b',
          slotId: 's2',
          supplyKind: 'demo_staffed',
          status: 'approved',
          domains: ['general_business'],
          languagePairs: [{ source: 'ak', target: 'en' }],
          startAt: new Date('2026-10-11T11:00:00Z'),
          endAt: new Date('2026-10-11T14:00:00Z'),
          state: 'open',
        },
        {
          interpreterId: 'a',
          slotId: 's1',
          supplyKind: 'demo_staffed',
          status: 'approved',
          domains: ['general_business'],
          languagePairs: [{ source: 'ak', target: 'en' }],
          startAt: new Date('2026-10-11T11:00:00Z'),
          endAt: new Date('2026-10-11T14:00:00Z'),
          state: 'open',
        },
      ],
    });
    expect(chosen?.interpreterId).toBe('a');
  });

  it('catalog has no MVP/TODO stubs', () => {
    const catalog = relayCatalog();
    expect(catalog.featureFlag).toBe('relay');
    expect(catalog.delivery.instantStaffing).toBe(false);
    expect(catalog.payments.processorIntegrated).toBe(false);
    expect(JSON.stringify(catalog).toLowerCase()).not.toContain('todo');
    expect(JSON.stringify(catalog).toLowerCase()).not.toContain('mvp');
  });
});

describe('Relay API', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    process.env.RELAY_OPEN = '1';
    process.env.RELAY_ALLOW_TEST_ACTORS = '1';
    process.env.RELAY_ALLOW_DEMO_INTERPRETERS = '1';

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

  it('runs request → offer → quote → pay → context → join → complete without double-book', async () => {
    const org = await seedOrg(prisma, 'relay');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'relay-test',
    });
    const actor = 'relay-user-1';
    const auth = {
      Authorization: `Bearer ${key.secret}`,
      'X-Relay-Actor-Id': actor,
    };

    const catalog = await request(app.getHttpServer())
      .get('/v1/relay/catalog')
      .set(auth)
      .expect(200);
    expect(catalog.body.name).toMatch(/Relay/i);
    expect(catalog.body.delivery.telephoneBridging).toBe(false);

    await request(app.getHttpServer())
      .post('/v1/relay/requests')
      .set(auth)
      .send({
        corridorId: 'ak-en-business',
        category: 'medical',
        preferredStartAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
        durationMinutes: 30,
        idempotencyKey: 'medical-blocked',
      })
      .expect(422);

    const preferredStartAt = new Date(Date.now() + 3 * 3600_000);
    preferredStartAt.setMinutes(0, 0, 0);

    const created = await request(app.getHttpServer())
      .post('/v1/relay/requests')
      .set(auth)
      .send({
        corridorId: 'ak-en-business',
        category: 'general_business',
        preferredStartAt: preferredStartAt.toISOString(),
        preferredTimezone: 'Africa/Accra',
        durationMinutes: 30,
        idempotencyKey: 'relay-flow-1',
      })
      .expect(201);

    expect(created.body.request.status).not.toBe('unmatched');
    expect(created.body.offer?.id).toBeTruthy();
    expect(created.body.quote?.id).toBeTruthy();
    const requestId = created.body.request.id as string;
    const offerId = created.body.offer.id as string;
    const quoteId = created.body.quote.id as string;

    const dup = await request(app.getHttpServer())
      .post('/v1/relay/requests')
      .set(auth)
      .send({
        corridorId: 'ak-en-business',
        preferredStartAt: preferredStartAt.toISOString(),
        durationMinutes: 30,
        idempotencyKey: 'relay-flow-1',
      })
      .expect(201);
    expect(dup.body.reused).toBe(true);

    await request(app.getHttpServer())
      .post(`/v1/relay/offers/${offerId}/accept`)
      .set(auth)
      .expect(200);

    const booked = await request(app.getHttpServer())
      .post(`/v1/relay/requests/${requestId}/quotes/${quoteId}/accept`)
      .set(auth)
      .expect(201);
    const bookingId = booked.body.booking.id as string;
    expect(booked.body.booking.status).toBe('awaiting_payment');

    // Concurrent second booking same window must fail double-book
    const created2 = await request(app.getHttpServer())
      .post('/v1/relay/requests')
      .set(auth)
      .send({
        corridorId: 'ak-en-business',
        preferredStartAt: preferredStartAt.toISOString(),
        durationMinutes: 30,
        idempotencyKey: 'relay-flow-2',
      })
      .expect(201);
    if (created2.body.offer?.id && created2.body.quote?.id) {
      await request(app.getHttpServer())
        .post(`/v1/relay/offers/${created2.body.offer.id}/accept`)
        .set(auth);
      await request(app.getHttpServer())
        .post(
          `/v1/relay/requests/${created2.body.request.id}/quotes/${created2.body.quote.id}/accept`,
        )
        .set(auth)
        .expect(409);
    }

    await request(app.getHttpServer())
      .post(`/v1/relay/bookings/${bookingId}/payments/mark-paid`)
      .set(auth)
      .send({ idempotencyKey: 'pay-1' })
      .expect(200);
    const payDup = await request(app.getHttpServer())
      .post(`/v1/relay/bookings/${bookingId}/payments/mark-paid`)
      .set(auth)
      .send({ idempotencyKey: 'pay-1' })
      .expect(200);
    expect(payDup.body.reused === true || payDup.body.payment?.state === 'marked_paid').toBe(true);

    const grant = await request(app.getHttpServer())
      .post(`/v1/relay/bookings/${bookingId}/context-grants`)
      .set(auth)
      .send({
        purpose: 'session_interpretation',
        evidence: [{ kind: 'summary', text: 'Ask for delivery date only.' }],
        originProduct: 'everyday',
      })
      .expect(201);
    expect(grant.body.grant.id).toBeTruthy();

    const correction = await request(app.getHttpServer())
      .post(`/v1/relay/bookings/${bookingId}/corrections`)
      .set(auth)
      .send({
        suggestion: 'Delivery date is Friday',
        grantId: grant.body.grant.id,
        trainingRightsGranted: false,
      })
      .expect(201);
    expect(correction.body.correction.id).toBeTruthy();

    const afterCorrection = await request(app.getHttpServer())
      .get(`/v1/relay/bookings/${bookingId}`)
      .set(auth)
      .expect(200);
    const staleGrant = afterCorrection.body.booking.contextGrants.find(
      (g: { id: string }) => g.id === grant.body.grant.id,
    );
    expect(staleGrant?.stale).toBe(true);

    const joined = await request(app.getHttpServer())
      .post(`/v1/relay/bookings/${bookingId}/join`)
      .set(auth)
      .send({ recordingOptIn: false })
      .expect(200);
    expect(joined.body.media.token).toBeTruthy();
    expect(joined.body.authority.canConfirmBusinessTerms).toBe(false);

    await request(app.getHttpServer())
      .post(`/v1/relay/bookings/${bookingId}/extensions`)
      .set(auth)
      .send({ additionalMinutes: 15 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/relay/bookings/${bookingId}/complete`)
      .set(auth)
      .send({ connectedSeconds: 900 })
      .expect(200);

    const done = await request(app.getHttpServer())
      .get(`/v1/relay/bookings/${bookingId}`)
      .set(auth)
      .expect(200);
    expect(done.body.booking.status).toBe('completed');
    expect(done.body.booking.usage.length).toBeGreaterThan(0);
    expect(done.body.booking.extensionApprovedMinutes).toBeGreaterThanOrEqual(15);

    await request(app.getHttpServer())
      .post(`/v1/relay/bookings/${bookingId}/disputes`)
      .set(auth)
      .send({ issue: 'Meaning clarification incomplete' })
      .expect(201);

    const ops = await request(app.getHttpServer())
      .get('/v1/relay/ops/overview')
      .set(auth)
      .expect(200);
    expect(ops.body.overview.approvedInterpreters).toBeGreaterThanOrEqual(1);
  });
});
