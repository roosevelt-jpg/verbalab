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
import { assessAntiSpoof } from '../src/voice-biometrics/anti-spoof';
import {
  encryptFingerprint,
  resolveFingerprint,
} from '../src/voice-biometrics/fingerprint-crypto';
import { computeVoiceFingerprint } from '../src/speaker-intelligence/fingerprint';

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
              clerkUserId: `clerk_vb_${name}_${Date.now()}_${Math.random()}`,
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

function speechishWav(seconds = 1.5): Buffer {
  const sampleRate = 8000;
  const n = Math.floor(sampleRate * seconds);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const env = 0.3 + 0.5 * Math.abs(Math.sin(2 * Math.PI * 3 * t));
    samples[i] =
      Math.sin(2 * Math.PI * 180 * t) * 0.25 * env +
      Math.sin(2 * Math.PI * 320 * t) * 0.15 * env +
      (Math.random() - 0.5) * 0.04;
  }
  return encodeWavPcm16(samples, sampleRate);
}

describe('Voice Biometrics', () => {
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

  it('documents Voice Biometrics honesty (not NIST/PAD)', () => {
    const doc = join(root, 'docs/VOICE_BIOMETRICS.md');
    const adr = join(root, 'docs/adr/0087-voice-biometrics.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/is \*\*not\*\* NIST/i);
    expect(text).toContain('Encryption at rest');
  });

  it('encrypts and resolves fingerprints round-trip', () => {
    const fp = computeVoiceFingerprint(speechishWav());
    const enc = encryptFingerprint(fp);
    expect(enc.enc).toBe(1);
    const back = resolveFingerprint(enc);
    expect(back?.dims).toBe(fp.dims);
    expect(back?.vector.length).toBe(fp.vector.length);
  });

  it('anti-spoof heuristics mark certifiedPad=false', () => {
    const result = assessAntiSpoof(speechishWav());
    expect(result.certifiedPad).toBe(false);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
  });

  it('exposes engine with nistCertified=false', async () => {
    const engine = await request(app.getHttpServer()).get('/v1/voice-biometrics/engine').expect(200);
    expect(engine.body.product).toBe('Lugemi Voice Biometrics');
    expect(engine.body.honesty.nistCertified).toBe(false);
    expect(engine.body.honesty.padCertified).toBe(false);
    const auth = engine.body.capabilities.find((c: { id: string }) => c.id === 'voice-authentication');
    expect(auth.status).toBe('partial');

    const enc = await request(app.getHttpServer()).get('/v1/voice-biometrics/encryption').expect(200);
    expect(enc.body.algorithm).toBe('aes-256-gcm');
  });

  it('secure enroll, authenticate, and delete biometric', async () => {
    const org = await seedOrg(prisma, 'vb');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'vb-key',
    });

    const profile = await request(app.getHttpServer())
      .post('/v1/speakers/profiles')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ displayName: 'Roosevelt' })
      .expect(201);

    const wav = speechishWav();
    const enroll = await request(app.getHttpServer())
      .post('/v1/voice-biometrics/enroll')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('profileId', profile.body.id)
      .field('enableAuthFactor', 'true')
      .attach('file', wav, 'enroll.wav')
      .expect(200);

    expect(enroll.body.fingerprintEncrypted).toBe(true);
    expect(enroll.body.encryptionAtRest).toBe(true);

    const stored = await prisma.speakerProfile.findUnique({ where: { id: profile.body.id } });
    expect(stored?.fingerprintEncrypted).toBe(true);
    expect(stored?.fingerprintJson).toMatchObject({ enc: 1 });

    const auth = await request(app.getHttpServer())
      .post('/v1/voice-biometrics/authenticate')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('profileId', profile.body.id)
      .attach('file', wav, 'auth.wav')
      .expect(200);

    expect(['accept', 'step_up', 'reject']).toContain(auth.body.decision);
    expect(auth.body.nistCertified).toBe(false);
    expect(auth.body.antiSpoof.certifiedPad).toBe(false);

    const del = await request(app.getHttpServer())
      .delete(`/v1/voice-biometrics/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);

    expect(del.body.deleted).toBe(true);
    expect(del.body.profile.status).toBe('deleted');

    const after = await prisma.speakerProfile.findUnique({ where: { id: profile.body.id } });
    expect(after?.fingerprintJson).toBeNull();
    expect(after?.deletedAt).toBeTruthy();
  });

  it('exposes voiceBiometricsEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ voiceBiometricsEngine { product nistCertified padCertified capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.voiceBiometricsEngine.nistCertified).toBe(false);
    expect(res.body.data.voiceBiometricsEngine.padCertified).toBe(false);
  });
});
