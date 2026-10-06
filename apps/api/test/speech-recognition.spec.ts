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
import { formatSrtTimestamp, normalizeTranscriptText, segmentsToSrt } from '../src/speech-recognition/subtitles';

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
              clerkUserId: `clerk_sre_${name}_${Date.now()}_${Math.random()}`,
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

describe('Speech Recognition Engine', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let lastPrompt: string | undefined;

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
      async transcribe(input) {
        lastPrompt = input.prompt;
        return {
          text: 'hello from verba lab speech',
          language: input.language ?? 'en',
          durationSeconds: 3.2,
          provider: 'fixture',
          latencyMs: 1,
          confidence: 0.91,
          segments: [
            { id: 0, start: 0, end: 1.5, text: 'hello from', confidence: 0.9 },
            { id: 1, start: 1.5, end: 3.2, text: 'verba lab speech', confidence: 0.92 },
          ],
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Speech Recognition Engine mapping', () => {
    const doc = join(root, 'docs/SPEECH_RECOGNITION.md');
    const adr = join(root, 'docs/adr/0070-speech-recognition-engine.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Batch');
    expect(text).toContain('Streaming');
    expect(text).toContain('Whisper');
    expect(text).not.toMatch(/live microphone WebSocket.*shipped/i);
  });

  it('exposes engine catalog and industry packs', async () => {
    const engine = await request(app.getHttpServer()).get('/v1/speech/engine').expect(200);
    expect(engine.body.product).toMatch(/Lugemi (Speech|Echo Listen)/);
    const ids = engine.body.capabilities.map((c: { id: string }) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'batch-stt',
        'streaming-stt',
        'custom-vocabulary',
        'industry-vocabulary',
        'subtitles',
        'confidence',
      ]),
    );
    const streaming = engine.body.capabilities.find((c: { id: string }) => c.id === 'streaming-stt');
    expect(streaming.status).toBe('shipped');

    const packs = await request(app.getHttpServer()).get('/v1/speech/vocabulary/packs').expect(200);
    expect(packs.body.packs.map((p: { id: string }) => p.id)).toEqual(
      expect.arrayContaining(['medical', 'legal', 'financial', 'government']),
    );
  });

  it('recognizes audio with segments, confidence, and vocabulary prompt', async () => {
    const org = await seedOrg(prisma, 'sre');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'sre-key',
    });

    await request(app.getHttpServer())
      .post('/v1/speech/vocabulary')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ phrase: 'Lugemi' })
      .expect(201);

    lastPrompt = undefined;
    const res = await request(app.getHttpServer())
      .post('/v1/speech/recognize')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('industryPacks', 'medical')
      .attach('file', tinyWav(), 'sample.wav')
      .expect(200);

    expect(res.body.provider).toBe('fixture');
    expect(res.body.segments).toHaveLength(2);
    expect(res.body.confidence).toBe(0.91);
    expect(res.body.vocabularyApplied).toBe(true);
    expect(res.body.industryPacks).toContain('medical');
    expect(res.body.text).toMatch(/Hello/);
    expect(lastPrompt).toContain('Lugemi');
    expect(lastPrompt).toContain('hypertension');
  });

  it('streams SSE segment events', async () => {
    const org = await seedOrg(prisma, 'stream');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'stream-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/speech/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', tinyWav(), 'sample.wav')
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: start');
    expect(res.text).toContain('event: segment');
    expect(res.text).toContain('event: done');
  });

  it('generates SRT subtitles', async () => {
    const org = await seedOrg(prisma, 'subs');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'subs-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/speech/subtitles')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('format', 'srt')
      .attach('file', tinyWav(), 'sample.wav')
      .expect(200);

    expect(res.body.format).toBe('srt');
    expect(res.body.content).toContain('-->');
    expect(res.body.cueCount).toBe(2);
  });

  it('exposes speechEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ speechEngine { product capabilities { id status } } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.speechEngine.product).toMatch(/Lugemi (Speech|Echo Listen)/);
  });

  it('formats subtitle helpers', () => {
    expect(formatSrtTimestamp(65.5)).toBe('00:01:05,500');
    expect(normalizeTranscriptText('hello world')).toBe('Hello world.');
    expect(segmentsToSrt([{ id: 0, start: 0, end: 1, text: 'hi' }])).toContain('hi');
  });
});
