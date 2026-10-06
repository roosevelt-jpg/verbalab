import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
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
              clerkUserId: `clerk_ce_${name}_${Date.now}_${Math.random}`,
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

function fakeEmbedding(seed: number): number[] {
  return Array.from({ length: 1536 }, (_, i) => Math.sin((seed + 1) * (i + 1) * 0.01) * 0.1);
}

describe('Context Engine',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async  => {
    storageDir = await mkdtemp(join(tmpdir, 'lugemi-ce-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setEmbeddingProviderForTests({
      name: 'fixture_embeddings',
      async embed(input) {
        const texts = Array.isArray(input.input) ? input.input : [input.input];
        return {
          data: texts.map((text, index) => ({
            index,
            embedding: fakeEmbedding(text.length + index),
          })),
          model: 'fixture-embed',
          provider: 'fixture_embeddings',
          promptTokens: texts.length * 2,
          totalTokens: texts.length * 2,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async  => {
    await app.close;
    await rm(storageDir, { recursive: true, force: true });
  });

  it('documents Context Engine honesty',  => {
    const doc = join(root, 'docs/CONTEXT_ENGINE.md');
    const adr = join(root, 'docs/adr/0096-context-engine.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/compression/i);
    expect(text).not.toMatch(/infinite context window shipped/i);
  });

  it('exposes engine with infiniteContextWindow=false and realtime deferred', async  => {
    const res = await request(app.getHttpServer).get('/v1/context-engine/engine').expect(200);
    expect(res.body.product).toContain('Context Engine');
    expect(res.body.honesty.infiniteContextWindow).toBe(false);
    expect(res.body.honesty.llmSummarization).toBe(false);
    expect(res.body.honesty.realtimePush).toBe(false);
    const realtime = res.body.capabilities.find((c: { id: string }) => c.id === 'realtime');
    expect(realtime.status).toBe('deferred');

    const sources = await request(app.getHttpServer).get('/v1/context-engine/sources').expect(200);
    expect(sources.body.sources.some((s: { id: string }) => s.id === 'documents')).toBe(true);
  });

  it('assembles language/workspace/memory/document context with compression', async  => {
    const org = await seedOrg(prisma, 'ce');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ce-key',
    });

    await request(app.getHttpServer)
      .post('/v1/memory-cloud/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        scope: 'workspace',
        kind: 'long_term',
        content: 'Prefer concise answers with citations.',
      })
      .expect(201);

    await request(app.getHttpServer)
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach(
        'file',
        Buffer.from(
          'Lugemi headquarters is located in Nairobi, Kenya. The platform focuses on African language intelligence.',
          'utf8',
        ),
        'hq.txt',
      )
      .expect(201);

    const assembled = await request(app.getHttpServer)
      .post('/v1/context-engine/assemble')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        query: 'Where is Lugemi HQ?',
        maxChars: 2500,
        promptKey: 'rag',
        include: {
          language: true,
          workspace: true,
          historical: true,
          documents: true,
          prompt: true,
          knowledgeGraph: false,
          organization: true,
          user: false,
          project: false,
          conversation: false,
        },
      })
      .expect(200);

    expect(assembled.body.included).toEqual(
      expect.arrayContaining(['language', 'workspace', 'documents', 'prompt']),
    );
    expect(assembled.body.promptContext).toMatch(/Language defaults/);
    expect(assembled.body.promptContext).toMatch(/Prefer concise|Nairobi|System prompt/i);
    expect(assembled.body.compression.maxChars).toBe(2500);
    expect(assembled.body.compression.afterChars).toBeLessThanOrEqual(2500);
    expect(assembled.body.compression.method).toBe('priority_char_budget');

    const tiny = await request(app.getHttpServer)
      .post('/v1/context-engine/assemble')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'HQ', maxChars: 500 })
      .expect(200);
    expect(tiny.body.compression.truncated).toBe(true);

    const analytics = await request(app.getHttpServer)
      .get('/v1/context-engine/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.assemblies).toBeGreaterThanOrEqual(2);
  });

  it('exposes contextEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ contextEngine { product infiniteContextWindow llmSummarization realtimePush capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.contextEngine.infiniteContextWindow).toBe(false);
    expect(res.body.data.contextEngine.realtimePush).toBe(false);
  });
});
