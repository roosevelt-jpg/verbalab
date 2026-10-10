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
import {
  computeVoiceFingerprint,
  cosineSimilarity,
  diarizeSegmentsByGaps,
} from '../src/speaker-intelligence/fingerprint';

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
              clerkUserId: `clerk_spk_${name}_${Date.now()}_${Math.random()}`,
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

function toneWav(freq: number, seconds = 0.4): Buffer {
  const sampleRate = 8000;
  const n = Math.floor(sampleRate * seconds);
  const dataSize = n;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * freq * t);
    buffer[44 + i] = Math.max(0, Math.min(255, Math.floor(128 + sample * 60)));
  }
  return buffer;
}

describe('Speaker Intelligence', () => {
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

    app.get(GatewayService).setSttProviderForTests({
      name: 'fixture',
      async transcribe() {
        return {
          text: 'hello there how are you today',
          language: 'en',
          durationSeconds: 5,
          provider: 'fixture',
          latencyMs: 1,
          confidence: 0.9,
          segments: [
            { id: 0, start: 0, end: 1.2, text: 'hello there', confidence: 0.9 },
            { id: 1, start: 2.5, end: 5, text: 'how are you today', confidence: 0.88 },
          ],
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Speaker Intelligence honesty', () => {
    const doc = join(root, 'docs/SPEAKER_INTELLIGENCE.md');
    const adr = join(root, 'docs/adr/0071-speaker-intelligence.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Diarization');
    expect(text).toContain('Fingerprint');
    expect(text).not.toMatch(/NIST.*shipped/i);
  });

  it('exposes speaker engine catalog', async () => {
    const res = await request(app.getHttpServer()).get('/v1/speakers/engine').expect(200);
    expect(res.body.product).toContain('Speaker');
    const ids = res.body.capabilities.map((c: { id: string }) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'profiles',
        'fingerprints',
        'verification',
        'identification',
        'diarization',
        'history',
      ]),
    );
  });

  it('creates profile, enrolls, verifies, and identifies', async () => {
    const org = await seedOrg(prisma, 'spk');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'spk-key',
    });

    const created = await request(app.getHttpServer())
      .post('/v1/speakers/profiles')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ displayName: 'Alice' })
      .expect(201);

    const wav = toneWav(440);
    await request(app.getHttpServer())
      .post(`/v1/speakers/profiles/${created.body.id}/enroll`)
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', wav, 'alice.wav')
      .expect(200);

    const verify = await request(app.getHttpServer())
      .post('/v1/speakers/verify')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('profileId', created.body.id)
      .attach('file', wav, 'alice.wav')
      .expect(200);

    expect(verify.body.match).toBe(true);
    expect(verify.body.score).toBeGreaterThan(0.9);

    const identify = await request(app.getHttpServer())
      .post('/v1/speakers/identify')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', wav, 'probe.wav')
      .expect(200);

    expect(identify.body.match).toBe(true);
    expect(identify.body.best.profileId).toBe(created.body.id);

    const history = await request(app.getHttpServer())
      .get('/v1/speakers/history')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);

    expect(history.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('diarizes with gap-based turns', async () => {
    const org = await seedOrg(prisma, 'dia');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'dia-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/speakers/diarize')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', toneWav(330), 'dialog.wav')
      .expect(200);

    expect(res.body.turns.length).toBe(2);
    expect(res.body.speakers).toEqual(expect.arrayContaining(['SPEAKER_A', 'SPEAKER_B']));
    expect(res.body.diarizationProvider).toBe('gap_diarization_v1');
  });

  it('exposes speakerEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ speakerEngine { product capabilities { id status } } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.speakerEngine.product).toContain('Speaker');
  });

  it('computes fingerprints and gap diarization helpers', () => {
    const a = computeVoiceFingerprint(toneWav(220));
    const b = computeVoiceFingerprint(toneWav(220));
    expect(cosineSimilarity(a.vector, b.vector)).toBeGreaterThan(0.95);
    const turns = diarizeSegmentsByGaps([
      { id: 0, start: 0, end: 1, text: 'hi' },
      { id: 1, start: 2, end: 3, text: 'hello' },
    ]);
    expect(turns).toHaveLength(2);
  });
});
