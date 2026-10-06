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
import {
  analyzeAudioBuffer,
  encodeWavPcm16,
  enhanceAudio,
} from '../src/audio-intelligence/audio-dsp';

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
              clerkUserId: `clerk_aud_${name}_${Date.now()}_${Math.random()}`,
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

/** PCM16 tone + silence so analyze/enhance have measurable energy. */
function toneWav(freq = 440, seconds = 0.5): Buffer {
  const sampleRate = 8000;
  const n = Math.floor(sampleRate * seconds);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    // First half tone, second half quiet
    samples[i] = i < n / 2 ? Math.sin(2 * Math.PI * freq * t) * 0.4 : 0.002 * Math.sin(2 * Math.PI * 60 * t);
  }
  return encodeWavPcm16(samples, sampleRate);
}

describe('Audio Intelligence (VL-155)', () => {
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

  it('documents Audio Intelligence honesty', () => {
    const doc = join(root, 'docs/AUDIO_INTELLIGENCE.md');
    const adr = join(root, 'docs/adr/0074-audio-intelligence.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/deferred/i);
    expect(text).toContain('Echo Cancellation');
    expect(text).not.toMatch(/Krisp.*shipped/i);
  });

  it('exposes audio engine with echo deferred', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audio-intelligence/engine').expect(200);
    expect(res.body.product).toContain('Audio');
    const echo = res.body.capabilities.find((c: { id: string }) => c.id === 'echo-cancellation');
    expect(echo.status).toBe('deferred');
    expect(res.body.capabilities.some((c: { id: string }) => c.id === 'noise-detection')).toBe(true);
  });

  it('returns deferred echo status', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audio-intelligence/echo').expect(200);
    expect(res.body.available).toBe(false);
    expect(res.body.status).toBe('deferred');
  });

  it('analyzes and enhances audio', async () => {
    const org = await seedOrg(prisma, 'aud');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'aud-key',
    });
    const wav = toneWav();

    const analyze = await request(app.getHttpServer())
      .post('/v1/audio-intelligence/analyze')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', wav, 'tone.wav')
      .expect(200);

    expect(analyze.body.metrics.durationSeconds).toBeGreaterThan(0.2);
    expect(analyze.body.silence.regions.length).toBeGreaterThanOrEqual(0);
    expect(typeof analyze.body.noise.estimatedSnrDb).toBe('number');

    const enhance = await request(app.getHttpServer())
      .post('/v1/audio-intelligence/enhance')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', wav, 'tone.wav')
      .expect(200);

    expect(enhance.body.format).toBe('wav');
    expect(enhance.body.audioBase64.length).toBeGreaterThan(40);

    const silence = await request(app.getHttpServer())
      .post('/v1/audio-intelligence/silence')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', wav, 'tone.wav')
      .expect(200);
    expect(silence.body.silenceRatio).toBeGreaterThanOrEqual(0);

    const analytics = await request(app.getHttpServer())
      .get('/v1/audio-intelligence/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.total).toBeGreaterThanOrEqual(3);
  });

  it('streams SSE analyze events', async () => {
    const org = await seedOrg(prisma, 'stream');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'stream-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/audio-intelligence/analyze/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', toneWav(), 'tone.wav')
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: start');
    expect(res.text).toContain('event: done');
  });

  it('exposes audioEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ audioEngine { product capabilities { id status } } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.audioEngine.product).toContain('Audio');
  });

  it('runs DSP helpers on PCM', () => {
    const wav = toneWav(880, 0.3);
    const analysis = analyzeAudioBuffer(wav);
    expect(analysis.sampleCount).toBeGreaterThan(100);
    const enhanced = enhanceAudio(wav);
    expect(enhanced.wav.length).toBeGreaterThan(44);
  });
});
