import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');

function fakeEmbedding(seed: number): number[] {
  return Array.from({ length: 1536 }, (_, i) => Math.sin((seed + 1) * (i + 1) * 0.01) * 0.1);
}

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_es_${name}_${Date.now()}_${Math.random()}`,
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

describe('Enterprise Search (VL-195)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'verbalab-es-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

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

  afterAll(async () => {
    await app.close();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('documents Enterprise Search honesty (not Elastic OS)', () => {
    const doc = join(root, 'docs/ENTERPRISE_SEARCH.md');
    const adr = join(root, 'docs/adr/0106-enterprise-search.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Elastic/i);
    expect(text).toContain('VL-062');
    expect(text).toMatch(/hybrid/i);
  });

  it('exposes engine with honest flags', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/enterprise-search/engine')
      .expect(200);
    expect(res.body.product).toContain('Enterprise Search');
    expect(res.body.honesty.elasticOs).toBe(false);
    expect(res.body.honesty.openSearchParity).toBe(false);
    expect(res.body.honesty.bm25Parity).toBe(false);
    expect(res.body.honesty.imageSearch).toBe(false);
    expect(res.body.honesty.voiceSearch).toBe(false);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);
    expect(res.body.honesty.extendsVl062).toBe(true);
    expect(res.body.honesty.extendsVectorCloud).toBe(true);

    const modes = await request(app.getHttpServer())
      .get('/v1/enterprise-search/modes')
      .expect(200);
    expect(modes.body.modes.map((m: { id: string }) => m.id)).toEqual(
      expect.arrayContaining(['keyword', 'semantic', 'hybrid']),
    );
  });

  it('runs keyword, semantic, hybrid search and suggestions (workspace scoped)', async () => {
    const org = await seedOrg(prisma, 'es');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'es-key',
    });

    await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('collection', 'policies')
      .field('tags', 'hr')
      .field('contentKind', 'policy')
      .attach(
        'file',
        Buffer.from('# Leave policy\n\nEmployees in Nairobi get twenty vacation days.'),
        'leave-policy.md',
      )
      .expect(201);

    const keyword = await request(app.getHttpServer())
      .post('/v1/enterprise-search/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'vacation', mode: 'keyword', collection: 'policies' })
      .expect(200);
    expect(keyword.body.mode).toBe('keyword');
    expect(keyword.body.hits.length).toBeGreaterThan(0);
    expect(keyword.body.hits[0].content.toLowerCase()).toContain('vacation');
    expect(keyword.body.honesty.elasticOs).toBe(false);

    const semantic = await request(app.getHttpServer())
      .post('/v1/enterprise-search/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'holiday leave days', mode: 'semantic', k: 5 })
      .expect(200);
    expect(semantic.body.mode).toBe('semantic');
    expect(semantic.body.hits.length).toBeGreaterThan(0);

    const hybrid = await request(app.getHttpServer())
      .post('/v1/enterprise-search/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'Nairobi leave', mode: 'hybrid', tag: 'hr' })
      .expect(200);
    expect(hybrid.body.mode).toBe('hybrid');
    expect(hybrid.body.hits.length).toBeGreaterThan(0);

    const suggest = await request(app.getHttpServer())
      .get('/v1/enterprise-search/suggest')
      .query({ q: 'leave' })
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(suggest.body.suggestions.some((s: { value: string }) => s.value.includes('leave'))).toBe(
      true,
    );
  });

  it('exposes enterpriseSearchEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ enterpriseSearchEngine { product elasticOs orgWorkspaceScoped extendsVl062 capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.enterpriseSearchEngine.elasticOs).toBe(false);
    expect(res.body.data.enterpriseSearchEngine.orgWorkspaceScoped).toBe(true);
    expect(res.body.data.enterpriseSearchEngine.capabilities.length).toBeGreaterThan(3);
  });
});
