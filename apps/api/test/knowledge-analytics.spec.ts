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
              clerkUserId: `clerk_ka_${name}_${Date.now()}_${Math.random()}`,
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

describe('Knowledge Analytics', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Knowledge Analytics honesty (not sibling analytics / BI OS)', () => {
    const doc = join(root, 'docs/KNOWLEDGE_ANALYTICS.md');
    const adr = join(root, 'docs/adr/0113-knowledge-analytics.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Language\/Speech\/Voice\/Intelligence/i);
    expect(text).toMatch(/BI/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
    expect(text).toContain('');
  });

  it('exposes engine with honest separation flags', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/knowledge-analytics/engine')
      .expect(200);
    expect(res.body.product).toContain('Knowledge Analytics');
    expect(res.body.honesty.regeneratesLanguageAnalytics).toBe(false);
    expect(res.body.honesty.regeneratesSpeechAnalytics).toBe(false);
    expect(res.body.honesty.regeneratesVoiceAnalytics).toBe(false);
    expect(res.body.honesty.regeneratesIntelligenceAnalytics).toBe(false);
    expect(res.body.honesty.biDashboardOs).toBe(false);
    expect(res.body.honesty.aggregatesOnly).toBe(true);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);
  });

  it('returns overview/usage/report for org with seeded knowledge data', async () => {
    const org = await seedOrg(prisma, 'ka');
    const workspaceId = org.workspaces[0]!.id;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      userId: org.memberships[0]!.userId,
      name: 'ka-key',
    });

    await prisma.knowledgeDocument.create({
      data: {
        organizationId: org.id,
        workspaceId,
        filename: 'policy.md',
        mimeType: 'text/markdown',
        sizeBytes: 120,
        storageKey: `ka/${org.id}/policy.md`,
        status: 'ready',
        chunkCount: 2,
        tags: ['policy'],
        contentKind: 'markdown',
      },
    });

    await prisma.auditEvent.createMany({
      data: [
        {
          organizationId: org.id,
          action: 'enterprise_search.searched',
          route: 'POST /v1/enterprise-search/search',
          metadata: { mode: 'hybrid', hits: 3, k: 8 },
        },
        {
          organizationId: org.id,
          action: 'enterprise_search.searched',
          route: 'POST /v1/enterprise-search/search',
          metadata: { mode: 'keyword', hits: 0, k: 8 },
        },
        {
          organizationId: org.id,
          action: 'enterprise_rag.queried',
          route: 'POST /v1/enterprise-rag/query',
          metadata: { citations: 1 },
        },
        {
          organizationId: org.id,
          action: 'knowledge_intelligence.validated',
          route: 'POST /v1/knowledge-intelligence/validate',
          metadata: { ok: true },
        },
      ],
    });

    const overview = await request(app.getHttpServer())
      .get('/v1/knowledge-analytics/overview')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(overview.body.growth.documents).toBeGreaterThanOrEqual(1);
    expect(overview.body.usage.totalEvents).toBeGreaterThanOrEqual(3);
    expect(overview.body.search.searches).toBeGreaterThanOrEqual(2);
    expect(overview.body.confidence.samples).toBeGreaterThanOrEqual(1);

    const usage = await request(app.getHttpServer())
      .get('/v1/knowledge-analytics/usage')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(
      usage.body.bySurface.some((s: { surface: string }) => s.surface === 'enterprise_search'),
    ).toBe(true);

    const report = await request(app.getHttpServer())
      .get('/v1/knowledge-analytics/report')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(report.body.honesty.aggregatesOnly).toBe(true);
    expect(report.body.honesty.regeneratesIntelligenceAnalytics).toBe(false);
    expect(report.body.search.zeroHitSearches).toBeGreaterThanOrEqual(1);
  });

  it('exposes knowledgeAnalytics via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ knowledgeAnalytics { product regeneratesIntelligenceAnalytics regeneratesSpeechAnalytics biDashboardOs aggregatesOnly orgWorkspaceScoped capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeAnalytics.regeneratesIntelligenceAnalytics).toBe(false);
    expect(res.body.data.knowledgeAnalytics.biDashboardOs).toBe(false);
    expect(res.body.data.knowledgeAnalytics.aggregatesOnly).toBe(true);
    expect(res.body.data.knowledgeAnalytics.orgWorkspaceScoped).toBe(true);
  });
});
