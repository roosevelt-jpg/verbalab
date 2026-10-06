import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { KnowledgeCloudService } from '../src/knowledge-cloud/knowledge-cloud.service';
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
              clerkUserId: `clerk_know_${name}_${Date.now()}_${Math.random()}`,
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

describe('Knowledge Cloud Foundation', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let knowledgeCloud: KnowledgeCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    knowledgeCloud = app.get(KnowledgeCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Knowledge Cloud mapping (no enterprise knowledge OS)', () => {
    const doc = join(root, 'docs/KNOWLEDGE_CLOUD.md');
    const adr = join(root, 'docs/adr/0104-knowledge-cloud-foundation.md');
    const readme = join(root, 'docs/roadmap/volume6-knowledge-cloud/README_VOLUME6.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Enterprise Knowledge Base');
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('af-south-1');
    expect(text).toMatch(/is \*\*not\*\* an enterprise knowledge OS/i);
  });

  it('exposes public product catalog with honest statuses', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/knowledge-cloud/products')
      .expect(200);
    expect(res.body.architecture.graphql).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.enterpriseKnowledgeOs).toBe(false);
    expect(res.body.architecture.ontologyOs).toBe(false);
    expect(res.body.architecture.regeneratesVl062).toBe(false);
    expect(res.body.architecture.extendsVl062).toBe(true);
    expect(res.body.architecture.extendsIntelligenceCloud).toBe(true);
    expect(res.body.architecture.tenantScopedKnowledge).toBe(true);
    expect(res.body.architecture.pgvector).toBe(true);
    expect(res.body.architecture.neo4jParity).toBe(false);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.docs).toBe('/docs/KNOWLEDGE_CLOUD.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'knowledge-cloud',
        'enterprise-knowledge-base',
        'enterprise-search',
        'ontology-platform',
        'taxonomy-platform',
        'enterprise-rag',
        'knowledge-memory',
        'knowledge-intelligence',
        'enterprise-knowledge-apis',
        'knowledge-analytics',
      ]),
    );

    const hub = res.body.products.find((p: { id: string }) => p.id === 'knowledge-cloud');
    expect(hub.status).toBe('shipped');

    const ekb = res.body.products.find(
      (p: { id: string }) => p.id === 'enterprise-knowledge-base',
    );
    expect(ekb.status).toBe('shipped');
    expect(ekb.api).toContain('/v1/knowledge-base/engine');
    expect(ekb.console).toBe('/knowledge-base');

    const search = res.body.products.find((p: { id: string }) => p.id === 'enterprise-search');
    expect(search.status).toBe('shipped');
    expect(search.api).toContain('/v1/enterprise-search/engine');
    expect(search.console).toBe('/enterprise-search');

    const ontology = res.body.products.find((p: { id: string }) => p.id === 'ontology-platform');
    expect(ontology.status).toBe('shipped');
    expect(ontology.api).toContain('/v1/ontology/engine');
    expect(ontology.console).toBe('/ontology');

    const taxonomy = res.body.products.find((p: { id: string }) => p.id === 'taxonomy-platform');
    expect(taxonomy.status).toBe('shipped');
    expect(taxonomy.api).toContain('/v1/taxonomy/engine');
    expect(taxonomy.console).toBe('/taxonomy');

    const rag = res.body.products.find((p: { id: string }) => p.id === 'enterprise-rag');
    expect(rag.status).toBe('shipped');
    expect(rag.api).toContain('/v1/enterprise-rag/engine');
    expect(rag.console).toBe('/enterprise-rag');

    const km = res.body.products.find((p: { id: string }) => p.id === 'knowledge-memory');
    expect(km.status).toBe('shipped');
    expect(km.api).toContain('/v1/knowledge-memory/engine');
    expect(km.console).toBe('/knowledge-memory');

    const ki = res.body.products.find((p: { id: string }) => p.id === 'knowledge-intelligence');
    expect(ki.status).toBe('shipped');
    expect(ki.api).toContain('/v1/knowledge-intelligence/engine');
    expect(ki.console).toBe('/knowledge-intelligence');

    const apis = res.body.products.find(
      (p: { id: string }) => p.id === 'enterprise-knowledge-apis',
    );
    expect(apis.status).toBe('shipped');
    expect(apis.api).toContain('/v1/knowledge-apis/engine');
    expect(apis.console).toBe('/knowledge-apis');
  });

  it('returns org knowledge overview with doc/chunk counts + deferred flags', async () => {
    const org = await seedOrg(prisma, `know_${Date.now()}`);

    const overview = await knowledgeCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_know',
      role: 'owner',
    });

    expect(overview.usage.chat).toBeDefined();
    expect(overview.usage.embeddings).toBeDefined();
    expect(overview.workspace.knowledgeDocuments).toBeGreaterThanOrEqual(0);
    expect(overview.workspace.knowledgeChunks).toBeGreaterThanOrEqual(0);
    expect(overview.deferred.enterpriseKnowledgeBase).toBe(false);
    expect(overview.links.knowledgeBase).toBe('/knowledge-base');
    expect(overview.deferred.enterpriseSearch).toBe(false);
    expect(overview.links.enterpriseSearch).toBe('/enterprise-search');
    expect(overview.deferred.ontologyPlatform).toBe(false);
    expect(overview.links.ontology).toBe('/ontology');
    expect(overview.deferred.taxonomyPlatform).toBe(false);
    expect(overview.links.taxonomy).toBe('/taxonomy');
    expect(overview.deferred.enterpriseRagProduct).toBe(false);
    expect(overview.links.enterpriseRag).toBe('/enterprise-rag');
    expect(overview.deferred.knowledgeMemory).toBe(false);
    expect(overview.links.knowledgeMemory).toBe('/knowledge-memory');
    expect(overview.deferred.knowledgeIntelligence).toBe(false);
    expect(overview.links.knowledgeIntelligence).toBe('/knowledge-intelligence');
    expect(overview.deferred.enterpriseKnowledgeApisPack).toBe(false);
    expect(overview.links.knowledgeApis).toBe('/knowledge-apis');
    expect(overview.deferred.knowledgeAnalytics).toBe(false);
    expect(overview.links.knowledgeAnalytics).toBe('/knowledge-analytics');
    expect(overview.deferred.enterpriseKnowledgeOs).toBe(true);
    expect(overview.deferred.ontologyOs).toBe(true);
    expect(overview.deferred.neo4jKnowledgeOs).toBe(true);
    expect(overview.deferred.regeneratesVl062).toBe(false);
    expect(overview.links.knowledgeCloud).toBe('/knowledge-cloud');
    expect(overview.links.knowledge).toBe('/knowledge');
    expect(overview.links.knowledgeGraph).toBe('/knowledge-graph');
    expect(overview.links.intelligenceCloud).toBe('/intelligence-cloud');
    expect(overview.architecture.hexagonalRewrite).toBe(false);
    expect(overview.architecture.enterpriseKnowledgeOs).toBe(false);
    expect(overview.architecture.extendsVl062).toBe(true);
  });

  it('exposes knowledgeProducts via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ knowledgeProducts { id name status } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeProducts.length).toBeGreaterThan(5);
    expect(
      res.body.data.knowledgeProducts.some((p: { id: string }) => p.id === 'knowledge-cloud'),
    ).toBe(true);
  });
});
