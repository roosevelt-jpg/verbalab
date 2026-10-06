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
              clerkUserId: `clerk_sr_${name}_${Date.now()}_${Math.random()}`,
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

describe('Streaming Runtime (VL-208)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.VERBALAB_STREAMING_RUNTIME_MODE;
  const prevChunks = process.env.VERBALAB_STREAMING_MAX_CHUNKS;

  beforeAll(async () => {
    process.env.VERBALAB_STREAMING_RUNTIME_MODE = 'sandbox';
    process.env.VERBALAB_STREAMING_MAX_CHUNKS = '32';

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
    if (prevMode === undefined) delete process.env.VERBALAB_STREAMING_RUNTIME_MODE;
    else process.env.VERBALAB_STREAMING_RUNTIME_MODE = prevMode;
    if (prevChunks === undefined) delete process.env.VERBALAB_STREAMING_MAX_CHUNKS;
    else process.env.VERBALAB_STREAMING_MAX_CHUNKS = prevChunks;
    await app.close();
  });

  it('documents Streaming Runtime honesty', () => {
    const doc = join(root, 'docs/STREAMING_RUNTIME.md');
    const adr = join(root, 'docs/adr/0119-streaming-runtime.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/WebSocket|gRPC|video/i);
    expect(text).toMatch(/does \*\*not\*\*|not regenerate/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
    expect(text).toContain('VL-208');
    expect(text).toMatch(/SSE/i);
  });

  it('exposes engine with honesty + surfaces', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/streaming-runtime/engine')
      .expect(200);
    expect(res.body.product).toContain('Streaming Runtime');
    expect(res.body.honesty.websocketOs).toBe(false);
    expect(res.body.honesty.grpcStreamingOs).toBe(false);
    expect(res.body.honesty.videoStreamingOs).toBe(false);
    expect(res.body.honesty.bidirectionalRealtimeOs).toBe(false);
    expect(res.body.honesty.regeneratesExistingStreams).toBe(false);
    expect(res.body.honesty.extendsExistingSse).toBe(true);
    expect(res.body.honesty.sandboxChunkStream).toBe(true);
    expect(res.body.honesty.primaryTransport).toBe('sse');
    expect(res.body.ceilings.maxChunksPerStream).toBe(32);
    expect(res.body.mode).toBe('sandbox');

    const surfaces = await request(app.getHttpServer())
      .get('/v1/streaming-runtime/surfaces')
      .expect(200);
    expect(surfaces.body.surfaces.some((s: { kind: string }) => s.kind === 'speech')).toBe(true);
    expect(surfaces.body.surfaces.find((s: { kind: string }) => s.kind === 'video').status).toBe(
      'deferred',
    );

    const transports = await request(app.getHttpServer())
      .get('/v1/streaming-runtime/transports')
      .expect(200);
    expect(transports.body.transports.find((t: { id: string }) => t.id === 'sse').status).toBe(
      'shipped',
    );
    expect(
      transports.body.transports.find((t: { id: string }) => t.id === 'grpc').status,
    ).toBe('deferred');
  });

  it('streams sandbox LLM chunks and redirects speech to existing SSE', async () => {
    const org = await seedOrg(prisma, `sr_${Date.now()}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'sr-test',
    });

    const session = await request(app.getHttpServer())
      .post('/v1/streaming-runtime/sessions')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ kind: 'llm', label: 'demo' })
      .expect(201);
    expect(session.body.session.kind).toBe('llm');

    const llm = await request(app.getHttpServer())
      .post('/v1/streaming-runtime/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kind: 'llm',
        sessionId: session.body.session.id,
        text: 'one two three four',
      })
      .expect(200);
    expect(llm.headers['content-type']).toMatch(/text\/event-stream/);
    expect(llm.text).toMatch(/event: meta/);
    expect(llm.text).toMatch(/event: chunk/);
    expect(llm.text).toMatch(/event: done/);
    expect(llm.text).toMatch(/websocketOs":false|sandbox/);

    const speech = await request(app.getHttpServer())
      .post('/v1/streaming-runtime/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ kind: 'speech' })
      .expect(200);
    expect(speech.text).toMatch(/event: redirect/);
    expect(speech.text).toMatch(/\/v1\/speech\/stream/);
    expect(speech.text).toMatch(/regeneratesExistingStreams":false/);

    const mon = await request(app.getHttpServer())
      .get('/v1/streaming-runtime/monitoring')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(mon.body.honesty.extendsExistingSse).toBe(true);
    expect(mon.body.deferred).toEqual(
      expect.arrayContaining(['video-streaming', 'websockets', 'grpc']),
    );
  });

  it('exposes streamingRuntimeEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ streamingRuntimeEngine { product websocketOs grpcStreamingOs videoStreamingOs regeneratesExistingStreams extendsExistingSse sandboxChunkStream orgWorkspaceScoped primaryTransport mode maxChunksPerStream capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.streamingRuntimeEngine.websocketOs).toBe(false);
    expect(res.body.data.streamingRuntimeEngine.grpcStreamingOs).toBe(false);
    expect(res.body.data.streamingRuntimeEngine.videoStreamingOs).toBe(false);
    expect(res.body.data.streamingRuntimeEngine.regeneratesExistingStreams).toBe(false);
    expect(res.body.data.streamingRuntimeEngine.extendsExistingSse).toBe(true);
    expect(res.body.data.streamingRuntimeEngine.primaryTransport).toBe('sse');
    expect(res.body.data.streamingRuntimeEngine.maxChunksPerStream).toBe(32);
  });
});
