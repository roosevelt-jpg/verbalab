import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { UsageService } from '../src/usage/usage.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { OpenAiWhisperAdapter } from '../src/gateway/openai-whisper.adapter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_stt_${name}_${Date.now}_${Math.random}`,
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

/** Minimal RIFF/WAV header + silence payload so multer accepts a .wav upload. */
function tinyWav: Buffer {
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

describe('Speech-to-text',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let usage: UsageService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    usage = app.get(UsageService);

    app.get(GatewayService).setSttProviderForTests({
      name: 'fixture',
      async transcribe(input) {
        return {
          text: `transcript:${input.filename}`,
          language: input.language ?? 'en',
          durationSeconds: 12.4,
          provider: 'fixture',
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async  => {
    await app.close;
  });

  it('transcribes audio and meters STT seconds', async  => {
    const org = await seedOrg(prisma, 'stt');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'stt-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/audio/transcriptions')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('language', 'en')
      .attach('file', tinyWav, { filename: 'hello.wav', contentType: 'audio/wav' })
      .expect(200);

    expect(res.body).toMatchObject({
      text: 'transcript:hello.wav',
      language: 'en',
      durationSeconds: 13,
      provider: 'fixture',
    });
    expect(res.body.durationMinutes).toBeCloseTo(13 / 60, 3);

    const summary = await usage.summary(org.id);
    expect(summary.stt.requests).toBe(1);
    expect(summary.stt.seconds).toBe(13);
    expect(summary.stt.minutes).toBeCloseTo(13 / 60, 3);
  });

  it('rejects unsupported extensions', async  => {
    const org = await seedOrg(prisma, 'badext');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'bad-key',
    });

    await request(app.getHttpServer)
      .post('/v1/audio/transcriptions')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', Buffer.from('not-audio'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('OpenAI adapter reports not configured without key', async  => {
    const adapter = new OpenAiWhisperAdapter('');
    await expect(
      adapter.transcribe({
        buffer: Buffer.from('x'),
        filename: 'a.wav',
        mimeType: 'audio/wav',
      }),
    ).rejects.toMatchObject({ code: 'provider_not_configured' });
  });
});
