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
              clerkUserId: `clerk_ntts_${name}_${Date.now()}_${Math.random()}`,
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

describe('Neural Text-to-Speech', () => {
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
            id: 'alloy',
            name: 'Alloy',
            gender: 'neutral',
            languages: ['en'],
            provider: 'fixture',
          },
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
          audio: Buffer.from(`AUDIO:${input.text}:${input.voice}`),
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

  it('documents Neural TTS honesty (no child-voice / vendor-stream claims)', () => {
    const doc = join(root, 'docs/NEURAL_TTS.md');
    const adr = join(root, 'docs/adr/0082-neural-tts.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Batch TTS');
    expect(text).toContain('chunk SSE');
    expect(text).toMatch(/Children voices[\s\S]*Deferred/i);
    expect(text).toMatch(/is \*\*not\*\* third-party TTS/i);
  });

  it('exposes engine catalog with honest streaming/children statuses', async () => {
    const res = await request(app.getHttpServer()).get('/v1/tts/engine').expect(200);
    expect(res.body.product).toBe('Lugemi Neural TTS');
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');

    const ids = res.body.capabilities.map((c: { id: string }) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining(['batch-tts', 'streaming-tts', 'male-voices', 'female-voices', 'children-voices']),
    );

    const batch = res.body.capabilities.find((c: { id: string }) => c.id === 'batch-tts');
    expect(batch.status).toBe('shipped');

    const streaming = res.body.capabilities.find((c: { id: string }) => c.id === 'streaming-tts');
    expect(streaming.status).toBe('shipped');
    expect(streaming.api).toContain('/v1/tts/stream');

    const children = res.body.capabilities.find((c: { id: string }) => c.id === 'children-voices');
    expect(children.status).toBe('deferred');
  });

  it('lists enriched voices and filters by gender', async () => {
    const all = await request(app.getHttpServer()).get('/v1/tts/voices').expect(200);
    expect(all.body.data.some((v: { id: string }) => v.id === 'alloy')).toBe(true);
    expect(all.body.data[0].personality).toBeDefined();
    expect(all.body.data[0].category).toBeDefined();

    const female = await request(app.getHttpServer()).get('/v1/tts/voices?gender=female').expect(200);
    expect(female.body.data.every((v: { gender: string }) => v.gender === 'female')).toBe(true);
    expect(female.body.data.some((v: { id: string }) => v.id === 'nova')).toBe(true);
  });

  it('batch synthesizes and streams chunk SSE', async () => {
    const org = await seedOrg(prisma, 'ntts');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ntts-key',
    });

    const batch = await request(app.getHttpServer())
      .post('/v1/tts/synthesize')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hello Neural TTS', voice: 'alloy' })
      .expect(200);

    expect(batch.headers['content-type']).toMatch(/audio/);
    expect(batch.headers['x-lugemi-mode']).toBe('batch');
    expect(batch.headers['x-lugemi-provider']).toBe('fixture');
    expect(batch.body.toString()).toContain('AUDIO:Hello Neural TTS');

    const stream = await request(app.getHttpServer())
      .post('/v1/tts/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Stream me', voice: 'nova' })
      .expect(200);

    expect(stream.headers['content-type']).toMatch(/text\/event-stream/);
    const body = stream.text;
    expect(body).toContain('event: meta');
    expect(body).toContain('chunk_sse_after_synthesis');
    expect(body).toContain('event: audio');
    expect(body).toContain('event: done');
  });

  it('exposes neuralTtsEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ neuralTtsEngine { product capabilities { id status } } neuralTtsVoices { id gender } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.neuralTtsEngine.product).toBe('Lugemi Neural TTS');
    expect(
      res.body.data.neuralTtsEngine.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'streaming-tts' && c.status === 'shipped',
      ),
    ).toBe(true);
    expect(res.body.data.neuralTtsVoices.length).toBeGreaterThan(0);
  });
});
