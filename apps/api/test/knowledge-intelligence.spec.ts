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
              clerkUserId: `clerk_ki_${name}_${Date.now()}_${Math.random()}`,
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

describe('Knowledge Intelligence', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'lugemi-ki-'));
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

  it('documents Knowledge Intelligence honesty (not BI/Palantir OS)', () => {
    const doc = join(root, 'docs/KNOWLEDGE_INTELLIGENCE.md');
    const adr = join(root, 'docs/adr/0111-knowledge-intelligence.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/BI|Palantir/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
    expect(text).toMatch(/Intelligence Analytics/i);
  });

  it('exposes engine with honest flags', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/knowledge-intelligence/engine')
      .expect(200);
    expect(res.body.product).toContain('Knowledge Intelligence');
    expect(res.body.honesty.biOs).toBe(false);
    expect(res.body.honesty.palantirParity).toBe(false);
    expect(res.body.honesty.regeneratesIntelligenceAnalytics).toBe(false);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);
    expect(res.body.honesty.extendsKnowledgeCloud).toBe(true);
  });

  it('discovers, links, validates, recommends, and scores confidence on real docs', async () => {
    const org = await seedOrg(prisma, 'ki');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ki-key',
    });

    const leave = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('collection', 'policies')
      .field('tags', 'leave,hr')
      .attach(
        'file',
        Buffer.from('# Leave policy\n\nEmployees get 22 paid leave days.'),
        'leave-policy.md',
      )
      .expect(201);

    const leave2 = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('collection', 'policies')
      .field('tags', 'leave')
      .attach(
        'file',
        Buffer.from('# Leave policy\n\nEmployees get 22 paid leave days.'),
        'leave-policy.md',
      )
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/taxonomy/terms')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'Leave Policies', kind: 'category', slug: 'leave-policies' })
      .expect(201);

    const insight = await request(app.getHttpServer())
      .get('/v1/knowledge-intelligence/insight')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(insight.body.documents).toBeGreaterThanOrEqual(2);
    expect(insight.body.ready).toBeGreaterThanOrEqual(2);

    const discovered = await request(app.getHttpServer())
      .post('/v1/knowledge-intelligence/discover')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'leave' })
      .expect(200);
    expect(discovered.body.documents.length).toBeGreaterThanOrEqual(1);
    expect(discovered.body.taxonomyTerms.length).toBeGreaterThanOrEqual(1);

    const linked = await request(app.getHttpServer())
      .post('/v1/knowledge-intelligence/link')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ documentId: leave.body.id })
      .expect(200);
    expect(linked.body.links.some((l: { id: string }) => l.id === leave2.body.id)).toBe(true);

    const validated = await request(app.getHttpServer())
      .post('/v1/knowledge-intelligence/validate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ documentId: leave.body.id })
      .expect(200);
    expect(validated.body.results[0].ok).toBe(true);

    const recommended = await request(app.getHttpServer())
      .post('/v1/knowledge-intelligence/recommend')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'leave' })
      .expect(200);
    expect(recommended.body.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(recommended.body.honesty.retailRecommenderOs).toBe(false);

    const dupes = await request(app.getHttpServer())
      .post('/v1/knowledge-intelligence/duplicates')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(200);
    expect(dupes.body.pairs.length).toBeGreaterThanOrEqual(1);
    expect(dupes.body.honesty.mlNearDuplicate).toBe(false);

    const confidence = await request(app.getHttpServer())
      .post('/v1/knowledge-intelligence/confidence')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ documentId: leave.body.id })
      .expect(200);
    expect(confidence.body.scores[0].score).toBeGreaterThan(0.4);
    expect(confidence.body.honesty.calibratedConfidence).toBe(false);

    const analytics = await request(app.getHttpServer())
      .get('/v1/knowledge-intelligence/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.documents).toBeGreaterThanOrEqual(2);
  });

  it('exposes knowledgeIntelligenceEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ knowledgeIntelligenceEngine { product biOs regeneratesIntelligenceAnalytics orgWorkspaceScoped extendsKnowledgeCloud capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeIntelligenceEngine.biOs).toBe(false);
    expect(res.body.data.knowledgeIntelligenceEngine.regeneratesIntelligenceAnalytics).toBe(false);
    expect(res.body.data.knowledgeIntelligenceEngine.orgWorkspaceScoped).toBe(true);
  });
});
