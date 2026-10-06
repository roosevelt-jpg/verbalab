import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { TwilioTelephonyService } from '../src/voice/twilio.telephony';
import { signTwilioRequest } from '../src/voice/twilio-signature';
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
              clerkUserId: `clerk_voice_${name}_${Date.now()}_${Math.random()}`,
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

describe('Voice agents (VL-084)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let twilio: TwilioTelephonyService;

  beforeAll(async () => {
    delete process.env.VOICE_AGENT_DISABLED;
    process.env.TWILIO_AUTH_TOKEN = 'test_twilio_token';
    process.env.TWILIO_WEBHOOK_BASE_URL = 'https://api.example.com';
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
    twilio = app.get(TwilioTelephonyService);

    const gateway = app.get(GatewayService);
    gateway.setSttProviderForTests({
      name: 'fixture_stt',
      async transcribe() {
        return {
          text: 'What is Lugemi?',
          language: 'en',
          durationSeconds: 1.5,
          provider: 'fixture_stt',
          latencyMs: 1,
        };
      },
    });
    gateway.setChatProviderForTests({
      name: 'fixture_chat',
      async complete() {
        return {
          message: {
            role: 'assistant',
            content: 'Lugemi is an enterprise language API for translate, speech, and chat.',
          },
          model: 'fixture',
          provider: 'fixture_chat',
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
          latencyMs: 1,
        };
      },
    });
    gateway.setTtsProviderForTests({
      name: 'fixture_tts',
      listVoices() {
        return [{ id: 'alloy', name: 'Alloy', gender: 'neutral', languages: ['en'], provider: 'fixture_tts' }];
      },
      async synthesize(input) {
        return {
          audio: Buffer.from('fake-audio'),
          mimeType: 'audio/mpeg',
          format: input.format ?? 'mp3',
          voice: input.voice,
          characters: [...input.text].length,
          provider: 'fixture_tts',
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('simulates a text FAQ turn with STT/LLM/TTS fixtures', async () => {
    const org = await seedOrg(prisma, `voice_sim_${Date.now()}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'voice',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/voice/simulate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'How do I get an API key?' })
      .expect(200);

    expect(res.body.userText).toBe('How do I get an API key?');
    expect(res.body.replyText).toContain('Lugemi');
    expect(res.body.audioBase64).toBeTruthy();
    expect(res.body.providers.chat).toBe('fixture_chat');
    expect(res.body.providers.tts).toBe('fixture_tts');
    expect(res.body.providers.stt).toBeNull();

    await request(app.getHttpServer()).get(`/v1/voice/audio/${res.body.audioId}`).expect(200);
  });

  it('rejects invalid Twilio signatures and serves signed inbound TwiML', async () => {
    const url = 'https://api.example.com/v1/voice/twilio/inbound';
    const body = 'CallSid=CA1&From=%2B15551234567&To=%2B15557654321';
    const params = {
      CallSid: 'CA1',
      From: '+15551234567',
      To: '+15557654321',
    };

    await request(app.getHttpServer())
      .post('/v1/voice/twilio/inbound')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-Twilio-Signature', 'invalid')
      .send(body)
      .expect(401);

    const signature = signTwilioRequest('test_twilio_token', url, params);
    const ok = await request(app.getHttpServer())
      .post('/v1/voice/twilio/inbound')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-Twilio-Signature', signature)
      .send(body)
      .expect(200);

    expect(ok.headers['content-type']).toMatch(/xml/);
    expect(ok.text).toContain('<Record');
    expect(ok.text).toContain('/v1/voice/twilio/turn');
  });

  it('returns 503 for outbound when Twilio account is not configured', () => {
    twilio.setClientForTests(null);
    expect(() =>
      twilio.createOutboundCall({
        to: '+15551234567',
        url: 'https://api.example.com/v1/voice/twilio/inbound',
      }),
    ).toThrow(/Twilio is not configured/);
  });
});
