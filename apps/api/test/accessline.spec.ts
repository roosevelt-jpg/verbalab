import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { signTwilioRequest } from '../src/voice/twilio-signature';
import { AccessLineAdapters } from '../src/accessline/accessline.adapters';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_al_${name}_${Date.now()}_${Math.random()}`,
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

describe('AccessLine', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let token: string;
  let orgId: string;
  let workspaceId: string;

  beforeAll(async () => {
    delete process.env.ACCESSLINE_DISABLED;
    process.env.ACCESSLINE_ALLOW_TEST_ACTORS = '1';
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_PHONE_NUMBER;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const org = await seedOrg(prisma, `al_${Date.now()}`);
    orgId = org.id;
    workspaceId = org.workspaces[0]!.id;
    const userId = org.memberships[0]!.userId;
    const key = await apiKeys.create({
      organizationId: orgId,
      workspaceId,
      userId,
      name: 'accessline-test',
    });
    token = key.secret;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({
    Authorization: `Bearer ${token}`,
    'X-AccessLine-Actor-Id': 'actor-accessline-1',
    'X-Lugemi-Organization-Id': orgId,
    'X-Lugemi-Workspace-Id': workspaceId,
  });

  it('catalog and capabilities are honest about telephony', async () => {
    const cat = await request(app.getHttpServer()).get('/v1/accessline/catalog').set(auth());
    expect(cat.status).toBe(200);
    expect(cat.body.id).toBe('accessline');
    expect(cat.body.telephony.configured).toBe(false);
    expect(cat.body.deferred).toContain('payment_collection');

    const caps = await request(app.getHttpServer()).get('/v1/accessline/capabilities').set(auth());
    expect(caps.status).toBe(200);
    expect(caps.body.workflow).toContain('registered_customer_auth');
  });

  it('runs simulator delivery-status journey with OTP auth (caller ID is not enough)', async () => {
    const lineRes = await request(app.getHttpServer())
      .post('/v1/accessline/lines')
      .set(auth())
      .send({
        name: 'Pilot logistics KE',
        inboundNumber: `sim:+2547${String(Date.now()).slice(-8)}`,
        enabledLanguages: ['sw-KE', 'en'],
        registeredContacts: [
          { phoneE164: '+254700000111', customerScope: 'cust_ke_demo_1', simulateOtpHint: '246810' },
        ],
      });
    expect(lineRes.status).toBe(201);
    expect(lineRes.body.honesty).toMatch(/Simulated/);
    expect(lineRes.body.registeredContacts[0].phoneMasked).toContain('0111');

    const start = await request(app.getHttpServer())
      .post('/v1/accessline/simulate/start')
      .set(auth())
      .send({ lineId: lineRes.body.id, callerId: '+254700000111' });
    expect(start.status).toBe(201);
    expect(start.body.state).toBe('language_selection');
    expect(start.body.mode).toBe('simulator');
    const callId = start.body.id as string;

    const lang = await request(app.getHttpServer())
      .post(`/v1/accessline/simulate/${callId}/dtmf`)
      .set(auth())
      .send({ digits: '1' });
    expect(lang.status).toBe(200);
    expect(lang.body.selectedVariety).toBe('sw-KE');
    expect(lang.body.state).toBe('unauthenticated');

    // Asking delivery status must enter authenticating — not skip via caller ID / reference.
    const intent = await request(app.getHttpServer())
      .post(`/v1/accessline/simulate/${callId}/speech`)
      .set(auth())
      .send({ text: 'Ningependa kujua hali ya delivery' });
    expect(intent.status).toBe(200);
    expect(intent.body.state).toBe('authenticating');
    expect(intent.body.simulator?.otpCode).toBe('246810');

    // Wrong OTP
    const bad = await request(app.getHttpServer())
      .post(`/v1/accessline/simulate/${callId}/dtmf`)
      .set(auth())
      .send({ digits: '000000' });
    expect(bad.status).toBe(200);
    expect(bad.body.authenticated).toBe(false);

    const ok = await request(app.getHttpServer())
      .post(`/v1/accessline/simulate/${callId}/dtmf`)
      .set(auth())
      .send({ digits: '246810' });
    expect(ok.status).toBe(200);
    expect(ok.body.authenticated).toBe(true);
    expect(ok.body.authState).toBe('verified');

    // Leading zeros preserved
    const lookup = await request(app.getHttpServer())
      .post(`/v1/accessline/simulate/${callId}/dtmf`)
      .set(auth())
      .send({ digits: '00123456' });
    expect(lookup.status).toBe(200);
    expect(lookup.body.delivery?.orderReference).toBe('00123456');
    expect(lookup.body.delivery?.status).toBe('out_for_delivery');
    expect(lookup.body.delivery?.estimatedDelivery).toBeNull();
    expect(lookup.body.prompt).toMatch(/Hakuna ETA|out for delivery|iko njiani/i);

    // Turns must not contain raw OTP
    const turnsText = (lookup.body.turns as { transcript: string }[])
      .map((t) => t.transcript)
      .join('\n');
    expect(turnsText).not.toContain('246810');

    const summary = await request(app.getHttpServer())
      .get(`/v1/accessline/calls/${callId}/summary`)
      .set(auth());
    expect(summary.status).toBe(200);
    expect(summary.body.authLevel).toBe('verified');
    expect(summary.body.orderReference).toBe('00123456');

    const hangup = await request(app.getHttpServer())
      .post(`/v1/accessline/simulate/${callId}/hangup`)
      .set(auth());
    expect(hangup.status).toBe(200);
    expect(hangup.body.state).toBe('ended');

    // Stale turns after hangup rejected
    const stale = await request(app.getHttpServer())
      .post(`/v1/accessline/simulate/${callId}/speech`)
      .set(auth())
      .send({ text: 'hello' });
    expect(stale.status).toBe(409);
  });

  it('rejects forged Twilio callbacks and unconfigured provider', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/accessline/twilio/inbound')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('CallSid=CA123&To=%2B254700000001');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('provider_not_configured');
  });

  it('rejects invalid Twilio signature when token present but incomplete config', async () => {
    process.env.TWILIO_AUTH_TOKEN = 'test_twilio_token';
    process.env.TWILIO_ACCOUNT_SID = 'ACtest';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';
    process.env.TWILIO_WEBHOOK_BASE_URL = 'https://api.example.com';

    const url = 'https://api.example.com/v1/accessline/twilio/inbound';
    const params = { CallSid: 'CA999', To: '+254700000001' };
    const body = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const bad = await request(app.getHttpServer())
      .post('/v1/accessline/twilio/inbound')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-Twilio-Signature', 'invalid')
      .send(body);
    expect(bad.status).toBe(401);

    const signature = signTwilioRequest('test_twilio_token', url, params);
    const ok = await request(app.getHttpServer())
      .post('/v1/accessline/twilio/inbound')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-Twilio-Signature', signature)
      .send(body);
    // Number not mapped → TwiML saying not configured (200), not forged accept of arbitrary tenant
    expect(ok.status).toBe(200);
    expect(ok.text).toContain('not configured');

    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_PHONE_NUMBER;
    delete process.env.TWILIO_WEBHOOK_BASE_URL;
  });

  it('delivery lookup isolates customers and preserves leading zeros', () => {
    const adapters = new AccessLineAdapters();
    const a = adapters.lookupDelivery({
      customerScope: 'cust_ke_demo_1',
      orderReference: '00123456',
      freshnessMinutes: 60,
      now: new Date('2026-10-11T08:10:00.000Z'),
    });
    expect(a.status).toBe('out_for_delivery');
    expect(a.orderReference).toBe('00123456');
    expect(a.estimatedDelivery).toBeNull();

    const cross = adapters.lookupDelivery({
      customerScope: 'cust_ke_demo_2',
      orderReference: '00123456',
      freshnessMinutes: 60,
    });
    expect(cross.status).toBe('not_found');
    expect(cross.resultState).toBe('inaccessible');
  });

  it('deduplicates handoff idempotency keys', async () => {
    const lineRes = await request(app.getHttpServer())
      .post('/v1/accessline/lines')
      .set(auth())
      .send({
        name: 'Handoff line',
        inboundNumber: `sim:+2547${String(Date.now()).slice(-7)}9`,
      });
    const start = await request(app.getHttpServer())
      .post('/v1/accessline/simulate/start')
      .set(auth())
      .send({ lineId: lineRes.body.id });
    const callId = start.body.id as string;
    await request(app.getHttpServer())
      .post(`/v1/accessline/simulate/${callId}/dtmf`)
      .set(auth())
      .send({ digits: '2' });

    const key = `handoff:${callId}:test`;
    const a = await request(app.getHttpServer())
      .post(`/v1/accessline/calls/${callId}/handoff`)
      .set(auth())
      .send({ reason: 'caller_requested', idempotencyKey: key });
    expect([200, 201]).toContain(a.status);
    expect(a.body.handoff?.status).toBe('accepted');

    const b = await request(app.getHttpServer())
      .post(`/v1/accessline/calls/${callId}/handoff`)
      .set(auth())
      .send({ reason: 'caller_requested', idempotencyKey: key });
    expect(b.body.deduplicated).toBe(true);
  });
});
