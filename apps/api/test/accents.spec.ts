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

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_acc_${name}_${Date.now()}_${Math.random()}`,
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

function tinyWav(): Buffer {
  const dataSize = 64;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(8000, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

describe('Accent detection', () => {
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

    const gateway = app.get(GatewayService);
    gateway.setDetectProviderForTests({
      name: 'fixture_detect',
      async detect() {
        return { language: 'en', confidence: 0.9, provider: 'fixture_detect' };
      },
    });
    gateway.setSttProviderForTests({
      name: 'fixture_stt',
      async transcribe() {
        return {
          text: 'How far abi wetin sef oya',
          language: 'en',
          durationSeconds: 3.2,
          provider: 'fixture_stt',
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/accents lists curated profiles', async () => {
    const res = await request(app.getHttpServer()).get('/v1/accents').expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
    expect(res.body.data.some((a: { code: string }) => a.code === 'en-ng')).toBe(true);
  });

  it('POST /v1/accents/detect scores Nigerian English cues from text', async () => {
    const org = await seedOrg(prisma, 'acc');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'acc-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/accents/detect')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'How far, abi you dey come? Wetin happen sef?', language: 'en' })
      .expect(200);

    expect(res.body.language).toBe('en');
    expect(res.body.accent).toBe('en-ng');
    expect(res.body.inputMode).toBe('text');
    expect(res.body.provider).toBe('cues');
  });

  it('POST /v1/accents/detect accepts audio → STT → cues', async () => {
    const org = await seedOrg(prisma, 'accaudio');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'acc-audio-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/accents/detect')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('language', 'en')
      .attach('file', tinyWav(), 'sample.wav')
      .expect(200);

    expect(res.body.inputMode).toBe('audio');
    expect(res.body.stt.provider).toBe('fixture_stt');
    expect(res.body.accent).toBe('en-ng');
    expect(res.body.transcript).toContain('abi');
  });
});
