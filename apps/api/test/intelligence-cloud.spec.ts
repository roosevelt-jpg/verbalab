import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { IntelligenceCloudService } from '../src/intelligence-cloud/intelligence-cloud.service';
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
              clerkUserId: `clerk_intel_${name}_${Date.now()}_${Math.random()}`,
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

describe('Intelligence Cloud Foundation (VL-180)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let intelligenceCloud: IntelligenceCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    intelligenceCloud = app.get(IntelligenceCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Intelligence Cloud mapping (no custom AI kernel)', () => {
    const doc = join(root, 'docs/INTELLIGENCE_CLOUD.md');
    const adr = join(root, 'docs/adr/0091-intelligence-cloud-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Embedding');
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('af-south-1');
    expect(text).toMatch(/is \*\*not\*\* a custom AI kernel/i);
    expect(text).toContain('VL-060');
    expect(text).toContain('VL-062');
    expect(text).toContain('VL-063');
  });

  it('exposes public product catalog with honest statuses', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/intelligence-cloud/products')
      .expect(200);
    expect(res.body.architecture.graphql).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.customAiKernel).toBe(false);
    expect(res.body.architecture.llmGateway).toBe(true);
    expect(res.body.architecture.pgvector).toBe(true);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.docs).toBe('/docs/INTELLIGENCE_CLOUD.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'intelligence',
        'embeddings',
        'vector',
        'memory',
        'reasoning',
        'orchestration',
      ]),
    );

    const hub = res.body.products.find((p: { id: string }) => p.id === 'intelligence');
    expect(hub.status).toBe('shipped');

    const embeddings = res.body.products.find((p: { id: string }) => p.id === 'embeddings');
    expect(embeddings.status).toBe('partial');
    expect(embeddings.api).toContain('/v1/embedding-cloud/engine');
    expect(embeddings.console).toBe('/embedding-cloud');

    const vector = res.body.products.find((p: { id: string }) => p.id === 'vector');
    expect(vector.status).toBe('partial');
    expect(vector.api).toContain('/v1/vector-cloud/engine');
    expect(vector.console).toBe('/vector-cloud');

    const memory = res.body.products.find((p: { id: string }) => p.id === 'memory');
    expect(memory.status).toBe('partial');
    expect(memory.api).toContain('/v1/memory-cloud/engine');
    expect(memory.console).toBe('/memory-cloud');

    const kg = res.body.products.find((p: { id: string }) => p.id === 'knowledge-graph');
    expect(kg.status).toBe('partial');
    expect(kg.api).toContain('/v1/knowledge-graph/engine');
    expect(kg.console).toBe('/knowledge-graph');

    const context = res.body.products.find((p: { id: string }) => p.id === 'context-engine');
    expect(context.status).toBe('partial');
    expect(context.api).toContain('/v1/context-engine/engine');
    expect(context.console).toBe('/context-engine');

    const reasoning = res.body.products.find((p: { id: string }) => p.id === 'reasoning');
    expect(reasoning.status).toBe('partial');
    expect(reasoning.api).toContain('/v1/reasoning-cloud/engine');
    expect(reasoning.console).toBe('/reasoning-cloud');

    const recommendations = res.body.products.find(
      (p: { id: string }) => p.id === 'recommendations',
    );
    expect(recommendations.status).toBe('partial');
    expect(recommendations.api).toContain('/v1/recommendation-engine/engine');
    expect(recommendations.console).toBe('/recommendation-engine');

    const promptIntel = res.body.products.find(
      (p: { id: string }) => p.id === 'prompt-intelligence',
    );
    expect(promptIntel.status).toBe('partial');
    expect(promptIntel.api).toContain('/v1/prompt-intelligence/engine');
    expect(promptIntel.console).toBe('/prompt-intelligence');

    const decision = res.body.products.find((p: { id: string }) => p.id === 'decision-engine');
    expect(decision.status).toBe('partial');
    expect(decision.api).toContain('/v1/decision-engine/engine');
    expect(decision.console).toBe('/decision-engine');

    const orchestration = res.body.products.find((p: { id: string }) => p.id === 'orchestration');
    expect(orchestration.status).toBe('partial');
    expect(orchestration.api).toContain('/v1/ai-orchestration/engine');
    expect(orchestration.console).toBe('/ai-orchestration');

    const intelAnalytics = res.body.products.find(
      (p: { id: string }) => p.id === 'intelligence-analytics',
    );
    expect(intelAnalytics.status).toBe('partial');
    expect(intelAnalytics.api).toContain('/v1/intelligence-analytics/engine');
    expect(intelAnalytics.console).toBe('/intelligence-analytics');
  });

  it('returns org intelligence overview with chat/embeddings usage + deferred flags', async () => {
    const org = await seedOrg(prisma, `intel_${Date.now()}`);

    const overview = await intelligenceCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_intel',
      role: 'owner',
    });

    expect(overview.usage.chat).toBeDefined();
    expect(overview.usage.embeddings).toBeDefined();
    expect(overview.workspace.knowledgeDocuments).toBeGreaterThanOrEqual(0);
    expect(overview.deferred.customAiKernel).toBe(true);
    expect(overview.deferred.embeddingCloudProduct).toBe(false);
    expect(overview.deferred.vectorCloudProduct).toBe(false);
    expect(overview.deferred.dedicatedVectorDb).toBe(true);
    expect(overview.deferred.memoryCloud).toBe(false);
    expect(overview.deferred.knowledgeGraphProduct).toBe(false);
    expect(overview.deferred.knowledgeGraphOs).toBe(true);
    expect(overview.deferred.contextEngine).toBe(false);
    expect(overview.deferred.reasoningCloudProduct).toBe(false);
    expect(overview.deferred.customReasoner).toBe(true);
    expect(overview.deferred.recommendationEngine).toBe(false);
    expect(overview.deferred.promptIntelligence).toBe(false);
    expect(overview.deferred.decisionEngineProduct).toBe(false);
    expect(overview.deferred.decisionEngineOs).toBe(true);
    expect(overview.deferred.orchestrationProduct).toBe(false);
    expect(overview.deferred.multiCloudAgentOs).toBe(true);
    expect(overview.deferred.intelligenceAnalyticsProduct).toBe(false);
    expect(overview.links.intelligenceCloud).toBe('/intelligence-cloud');
    expect(overview.links.embeddingCloud).toBe('/embedding-cloud');
    expect(overview.links.vectorCloud).toBe('/vector-cloud');
    expect(overview.links.memoryCloud).toBe('/memory-cloud');
    expect(overview.links.knowledgeGraph).toBe('/knowledge-graph');
    expect(overview.links.contextEngine).toBe('/context-engine');
    expect(overview.links.reasoningCloud).toBe('/reasoning-cloud');
    expect(overview.links.recommendationEngine).toBe('/recommendation-engine');
    expect(overview.links.promptIntelligence).toBe('/prompt-intelligence');
    expect(overview.links.decisionEngine).toBe('/decision-engine');
    expect(overview.links.aiOrchestration).toBe('/ai-orchestration');
    expect(overview.links.intelligenceAnalytics).toBe('/intelligence-analytics');
    expect(overview.links.knowledge).toBe('/knowledge');
    expect(overview.links.chat).toBe('/chat');
    expect(overview.architecture.hexagonalRewrite).toBe(false);
    expect(overview.architecture.customAiKernel).toBe(false);
  });

  it('exposes intelligenceProducts via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ intelligenceProducts { id name status } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.intelligenceProducts.length).toBeGreaterThan(5);
    expect(
      res.body.data.intelligenceProducts.some((p: { id: string }) => p.id === 'intelligence'),
    ).toBe(true);
  });
});
