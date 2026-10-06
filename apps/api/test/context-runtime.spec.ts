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
              clerkUserId: `clerk_cr_${name}_${Date.now}_${Math.random}`,
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

describe('Context Runtime',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_CONTEXT_RUNTIME_MODE;

  beforeAll(async  => {
    process.env.LUGEMI_CONTEXT_RUNTIME_MODE = 'sandbox';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async  => {
    if (prevMode === undefined) delete process.env.LUGEMI_CONTEXT_RUNTIME_MODE;
    else process.env.LUGEMI_CONTEXT_RUNTIME_MODE = prevMode;
    await app.close;
  });

  it('documents Context Runtime honesty (extends Context Engine; not infinite window)',  => {
    const doc = join(root, 'docs/CONTEXT_RUNTIME.md');
    const adr = join(root, 'docs/adr/0128-context-runtime.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/infinite context/i);
    expect(text).toMatch(/Context Engine|i);
    expect(text).toMatch(/summarization/i);
  });

  it('exposes engine with honest flags', async  => {
    const res = await request(app.getHttpServer).get('/v1/context-runtime/engine').expect(200);
    expect(res.body.product).toContain('Context Runtime');
    expect(res.body.honesty.infiniteContextWindow).toBe(false);
    expect(res.body.honesty.llmSummarization).toBe(false);
    expect(res.body.honesty.realtimePush).toBe(false);
    expect(res.body.honesty.regeneratesContextEngine).toBe(false);
    expect(res.body.honesty.extendsContextEngine).toBe(true);
    expect(res.body.honesty.usesIntelligentCacheContextNamespace).toBe(true);
    expect(res.body.links.console).toBe('/context-runtime');

    const scopes = await request(app.getHttpServer)
      .get('/v1/context-runtime/scopes')
      .expect(200);
    expect(scopes.body.scopes.some((s: { id: string }) => s.id === 'workspace')).toBe(true);
    expect(scopes.body.scopes.some((s: { id: string }) => s.id === 'model')).toBe(true);
  });

  it('assembles, prioritizes, compresses, and caches', async  => {
    const org = await seedOrg(prisma, 'cr');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'cr-key',
    });

    const assembled = await request(app.getHttpServer)
      .post('/v1/context-runtime/assemble')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        modelHint: 'sandbox-model',
        providerHint: 'gateway',
        maxChars: 2000,
        useCache: true,
        include: { documents: false, knowledgeGraph: false },
      })
      .expect(200);
    expect(assembled.body.honesty.infiniteContextWindow).toBe(false);
    expect(assembled.body.included).toEqual(expect.arrayContaining(['language', 'workspace', 'model']));
    expect(assembled.body.promptContext).toContain('Model context');
    expect(assembled.body.cache).toBe('miss');

    const cached = await request(app.getHttpServer)
      .post('/v1/context-runtime/assemble')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        modelHint: 'sandbox-model',
        providerHint: 'gateway',
        maxChars: 2000,
        useCache: true,
        include: { documents: false, knowledgeGraph: false },
      })
      .expect(200);
    expect(cached.body.cache).toBe('hit');

    const prioritized = await request(app.getHttpServer)
      .post('/v1/context-runtime/prioritize')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        blocks: [
          { id: 'a', kind: 'documents', priority: 50, content: 'docs', chars: 4 },
          { id: 'b', kind: 'language', priority: 10, content: 'lang', chars: 4 },
        ],
        priorityOverrides: { documents: 5 },
      })
      .expect(200);
    expect(prioritized.body.order[0]).toBe('documents');

    const compressed = await request(app.getHttpServer)
      .post('/v1/context-runtime/compress')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        text: 'x'.repeat(500),
        maxChars: 80,
      })
      .expect(200);
    expect(compressed.body.afterChars).toBeLessThanOrEqual(80);
    expect(compressed.body.honesty.llmSummarization).toBe(false);

    const retrieved = await request(app.getHttpServer)
      .post('/v1/context-runtime/retrieve')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ maxChars: 1500, include: { documents: false } })
      .expect(200);
    expect(retrieved.body.promptContext).toBeTruthy;

    const analytics = await request(app.getHttpServer)
      .get('/v1/context-runtime/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.assemblies).toBeGreaterThanOrEqual(1);
  });

  it('exposes contextRuntimeEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ contextRuntimeEngine { product infiniteContextWindow llmSummarization extendsContextEngine regeneratesContextEngine mode maxChars capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.contextRuntimeEngine.product).toContain('Context Runtime');
    expect(res.body.data.contextRuntimeEngine.infiniteContextWindow).toBe(false);
    expect(res.body.data.contextRuntimeEngine.extendsContextEngine).toBe(true);
    expect(res.body.data.contextRuntimeEngine.capabilities.length).toBeGreaterThan(5);
  });
});
