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
              clerkUserId: `clerk_interp_${name}_${Date.now()}_${Math.random()}`,
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

describe('Live interpreter', () => {
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
    gateway.setSttProviderForTests({
      name: 'fixture_stt',
      async transcribe() {
        return {
          text: 'Hello friend',
          language: 'en',
          durationSeconds: 2.5,
          provider: 'fixture_stt',
          latencyMs: 1,
        };
      },
    });
    gateway.setDetectProviderForTests({
      name: 'fixture_detect',
      async detect() {
        return { language: 'en', confidence: 0.99, provider: 'fixture_detect' };
      },
    });
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
    gateway.setTtsProviderForTests({
      name: 'fixture_tts',
      listVoices() {
        return [
          {
            id: 'alloy',
            name: 'Alloy',
            gender: 'neutral',
            languages: ['en'],
            provider: 'fixture_tts',
          },
        ];
      },
      async synthesize(input) {
        return {
          audio: Buffer.from(`AUDIO:${input.text}`),
          mimeType: 'audio/mpeg',
          format: 'mp3',
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

  it('runs STT → MT → TTS and returns audioBase64', async () => {
    const org = await seedOrg(prisma, 'interp');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'interp-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/interpret')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('target', 'sw')
      .field('voice', 'alloy')
      .attach('file', tinyWav(), 'hello.wav')
      .expect(200);

    expect(res.body.sourceText).toBe('Hello friend');
    expect(res.body.targetText).toBe('[sw] Hello friend');
    expect(res.body.source).toBe('en');
    expect(res.body.target).toBe('sw');
    expect(res.body.providers).toEqual({
      stt: 'fixture_stt',
      mt: 'fixture_mt',
      tts: 'fixture_tts',
    });
    expect(res.body.skippedMt).toBe(false);
    expect(Buffer.from(res.body.audioBase64, 'base64').toString('utf8')).toBe(
      'AUDIO:[sw] Hello friend',
    );

    const sttEvents = await prisma.usageEvent.count({
      where: { organizationId: org.id, feature: 'stt' },
    });
    const mtEvents = await prisma.usageEvent.count({
      where: { organizationId: org.id, feature: 'translate' },
    });
    const ttsEvents = await prisma.usageEvent.count({
      where: { organizationId: org.id, feature: 'tts' },
    });
    expect(sttEvents).toBe(1);
    expect(mtEvents).toBe(1);
    expect(ttsEvents).toBe(1);
  });

  it('skips MT when source equals target', async () => {
    const org = await seedOrg(prisma, 'interpsame');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'same-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/interpret')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('source', 'en')
      .field('target', 'en')
      .field('voice', 'alloy')
      .attach('file', tinyWav(), 'same.wav')
      .expect(200);

    expect(res.body.skippedMt).toBe(true);
    expect(res.body.targetText).toBe('Hello friend');
    expect(res.body.providers.mt).toBeNull();
  });

  it('requires target and voice', async () => {
    const org = await seedOrg(prisma, 'interpbad');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'bad-key',
    });

    await request(app.getHttpServer())
      .post('/v1/interpret')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', tinyWav(), 'bad.wav')
      .expect(400);
  });
});
