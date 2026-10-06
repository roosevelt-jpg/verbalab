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
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { encodeWavPcm16 } from '../src/audio-intelligence/audio-dsp';
import { applyEnhancementProfile } from '../src/voice-enhancement/enhancement-profiles';

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
              clerkUserId: `clerk_ve_${name}_${Date.now()}_${Math.random()}`,
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

function toneWav(freq = 440, seconds = 0.5): Buffer {
  const sampleRate = 8000;
  const n = Math.floor(sampleRate * seconds);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    samples[i] =
      i < n / 2 ? Math.sin(2 * Math.PI * freq * t) * 0.4 : 0.002 * Math.sin(2 * Math.PI * 60 * t);
  }
  return encodeWavPcm16(samples, sampleRate);
}

describe('Voice Enhancement Platform (VL-175)', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Voice Enhancement honesty (not Krisp / Adobe Enhance)', () => {
    const doc = join(root, 'docs/VOICE_ENHANCEMENT.md');
    const adr = join(root, 'docs/adr/0086-voice-enhancement.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/is \*\*not\*\* Krisp/i);
    expect(text).toContain('Echo Cancellation');
  });

  it('applies microphone_cleanup profile via DSP chain', () => {
    const wav = toneWav();
    const result = applyEnhancementProfile(wav, 'microphone_cleanup');
    expect(result.profile.id).toBe('microphone_cleanup');
    expect(result.stepsApplied).toContain('enhance_strong');
    expect(result.wav.length).toBeGreaterThan(44);
    expect(result.note).toMatch(/not spectral ML/i);
  });

  it('exposes engine with spectralMlDenoise=false and echo deferred', async () => {
    const engine = await request(app.getHttpServer()).get('/v1/voice-enhancement/engine').expect(200);
    expect(engine.body.product).toBe('Lugemi Voice Enhancement');
    expect(engine.body.honesty.spectralMlDenoise).toBe(false);
    expect(engine.body.honesty.liveAec).toBe(false);
    const echoCap = engine.body.capabilities.find((c: { id: string }) => c.id === 'echo-cancellation');
    expect(echoCap.status).toBe('deferred');

    const profiles = await request(app.getHttpServer()).get('/v1/voice-enhancement/profiles').expect(200);
    const ids = profiles.body.profiles.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'noise_removal',
        'microphone_cleanup',
        'podcast_cleanup',
        'broadcast',
        'meeting_cleanup',
        'voice_restoration',
        'upscale',
      ]),
    );

    const echo = await request(app.getHttpServer()).get('/v1/voice-enhancement/echo').expect(200);
    expect(echo.body.available).toBe(false);
    expect(echo.body.status).toBe('deferred');
  });

  it('enhances with profile and returns wav base64', async () => {
    const org = await seedOrg(prisma, 've');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 've-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/voice-enhancement/enhance')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('profile', 'meeting_cleanup')
      .attach('file', toneWav(), 'tone.wav')
      .expect(200);

    expect(res.body.profile).toBe('meeting_cleanup');
    expect(res.body.format).toBe('wav');
    expect(res.body.audioBase64).toBeTruthy();
    expect(res.body.stepsApplied).toEqual(expect.arrayContaining(['enhance', 'isolate']));
  });

  it('exposes voiceEnhancementEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ voiceEnhancementEngine { product spectralMlDenoise liveAec capabilities { id status } } voiceEnhancementProfiles { id name } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.voiceEnhancementEngine.spectralMlDenoise).toBe(false);
    expect(res.body.data.voiceEnhancementEngine.liveAec).toBe(false);
    expect(res.body.data.voiceEnhancementProfiles.length).toBeGreaterThanOrEqual(6);
  });
});
