import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { applySoftProsody } from '../src/emotion-voice/emotion-profiles';

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
              clerkUserId: `clerk_ev_${name}_${Date.now()}_${Math.random()}`,
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

describe('Emotion Voice Engine', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setTtsProviderForTests({
      name: 'fixture',
      listVoices() {
        return [
          {
            id: 'nova',
            name: 'Nova',
            gender: 'female',
            languages: ['en'],
            provider: 'fixture',
          },
          {
            id: 'onyx',
            name: 'Onyx',
            gender: 'male',
            languages: ['en'],
            provider: 'fixture',
          },
        ];
      },
      async synthesize(input) {
        return {
          audio: Buffer.from(`AUDIO:${input.voice}:${input.text}`),
          mimeType: 'audio/mpeg',
          format: 'mp3',
          voice: input.voice,
          characters: [...input.text].length,
          provider: 'fixture',
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Emotion Voice as synthesis (not detection / trained TTS)', () => {
    const doc = join(root, 'docs/EMOTION_VOICE.md');
    const adr = join(root, 'docs/adr/0084-emotion-voice.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('synthesis');
    expect(text).toContain('');
    expect(text).toMatch(/is \*\*not\*\* a trained expressive TTS/i);
  });

  it('soft prosody never injects spoken stage directions', () => {
    const out = applySoftProsody('Hello there.', 'bright');
    expect(out.toLowerCase()).not.toContain('say');
    expect(out.toLowerCase()).not.toContain('happily');
    expect(out.endsWith('!')).toBe(true);
  });

  it('exposes engine + profiles with honest trainedExpressiveModel=false', async () => {
    const engine = await request(app.getHttpServer()).get('/v1/emotion-voice/engine').expect(200);
    expect(engine.body.product).toBe('Lugemi Emotion Voice');
    expect(engine.body.architecture.trainedExpressiveModel).toBe(false);
    expect(engine.body.related.speechEmotionDetection).toContain('EMOTION_INTELLIGENCE');

    const synth = engine.body.capabilities.find((c: { id: string }) => c.id === 'emotion-synthesis');
    expect(synth.status).toBe('shipped');

    const profiles = await request(app.getHttpServer()).get('/v1/emotion-voice/profiles').expect(200);
    const ids = profiles.body.profiles.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'happy',
        'sad',
        'angry',
        'fear',
        'excited',
        'professional',
        'calm',
        'urgent',
        'empathetic',
        'medical',
        'legal',
        'sales',
        'customer_support',
      ]),
    );
  });

  it('synthesizes with emotion profile and preferred voice', async () => {
    const org = await seedOrg(prisma, 'ev');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ev-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/emotion-voice/synthesize')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hello there.', emotion: 'happy' })
      .expect(200);

    expect(res.headers['x-lugemi-emotion']).toBe('happy');
    expect(res.headers['x-lugemi-voice']).toBe('nova');
    expect(res.headers['x-lugemi-emotion-mode']).toBe('soft_prosody_voice_pick');
    expect(Buffer.from(res.body).toString('utf8')).toContain('AUDIO:nova:');
  });

  it('exposes emotionVoiceEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ emotionVoiceEngine { product trainedExpressiveModel capabilities { id status } } emotionVoiceProfiles { id preferredVoice } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.emotionVoiceEngine.trainedExpressiveModel).toBe(false);
    expect(res.body.data.emotionVoiceProfiles.length).toBeGreaterThanOrEqual(13);
  });
});
