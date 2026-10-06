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
              clerkUserId: `clerk_ara_${name}_${Date.now()}_${Math.random()}`,
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

describe('AI Runtime Analytics (VL-212)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.VERBALAB_AI_RUNTIME_ANALYTICS_MODE;

  beforeAll(async () => {
    process.env.VERBALAB_AI_RUNTIME_ANALYTICS_MODE = 'sandbox';

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
    if (prevMode === undefined) delete process.env.VERBALAB_AI_RUNTIME_ANALYTICS_MODE;
    else process.env.VERBALAB_AI_RUNTIME_ANALYTICS_MODE = prevMode;
    await app.close();
  });

  it('documents AI Runtime Analytics honesty', () => {
    const doc = join(root, 'docs/AI_RUNTIME_ANALYTICS.md');
    const adr = join(root, 'docs/adr/0123-ai-runtime-analytics.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/BI|APM/i);
    expect(text).toMatch(/does \*\*not\*\*|not invent/i);
    expect(text).toMatch(/VL-191|Intelligence Analytics/i);
    expect(text).toMatch(/org\/workspace|workspace/i);
    expect(text).toContain('VL-212');
  });

  it('exposes engine with honesty flags', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/ai-runtime-analytics/engine')
      .expect(200);
    expect(res.body.product).toContain('AI Runtime Analytics');
    expect(res.body.honesty.biDashboardOs).toBe(false);
    expect(res.body.honesty.apmOs).toBe(false);
    expect(res.body.honesty.cloudGpuTelemetryOs).toBe(false);
    expect(res.body.honesty.regeneratesIntelligenceAnalytics).toBe(false);
    expect(res.body.honesty.regeneratesKnowledgeAnalytics).toBe(false);
    expect(res.body.honesty.aggregatesOnly).toBe(true);
    expect(res.body.honesty.extendsInferenceCloud).toBe(true);
    expect(res.body.mode).toBe('sandbox');
    expect(res.body.capabilities.some((c: { id: string }) => c.id === 'latency')).toBe(true);
    expect(res.body.capabilities.some((c: { id: string }) => c.id === 'cache-hits')).toBe(true);
  });

  it('aggregates overview/report from Inference Cloud ledgers', async () => {
    const org = await seedOrg(prisma, `ara_${Date.now()}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'ara-test',
    });

    await prisma.aiRouterDecision.create({
      data: {
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        feature: 'chat',
        optimize: 'cost',
        selectedProvider: 'openai',
        selectedModel: 'gpt-test',
        chainJson: [],
        metadata: { latencyMs: 42 },
      },
    });

    await prisma.cacheEntry.create({
      data: {
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        namespace: 'translation',
        cacheKey: 'en:sw:hello',
        valueJson: { text: 'habari' },
        hits: 3,
        misses: 1,
      },
    });

    await prisma.costSpendEvent.create({
      data: {
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        category: 'provider',
        amountUsd: 0.12,
        feature: 'chat',
      },
    });

    const overview = await request(app.getHttpServer())
      .get('/v1/ai-runtime-analytics/overview')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(overview.body.throughput.routerDecisions).toBeGreaterThanOrEqual(1);
    expect(overview.body.cache.hits).toBeGreaterThanOrEqual(3);
    expect(overview.body.cost.ledgerUsd).toBeGreaterThanOrEqual(0.12);
    expect(overview.body.honesty.biDashboardOs).toBe(false);

    const cache = await request(app.getHttpServer())
      .get('/v1/ai-runtime-analytics/cache')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(cache.body.hits).toBeGreaterThanOrEqual(3);
    expect(cache.body.misses).toBeGreaterThanOrEqual(1);

    const cpu = await request(app.getHttpServer())
      .get('/v1/ai-runtime-analytics/cpu')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(cpu.body.host.cpuCount).toBeGreaterThan(0);
    expect(cpu.body.honesty.apmOs).toBe(false);

    const report = await request(app.getHttpServer())
      .get('/v1/ai-runtime-analytics/report')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(report.body.models).toBeDefined();
    expect(report.body.streaming).toBeDefined();
    expect(report.body.honesty.aggregatesOnly).toBe(true);

    const mon = await request(app.getHttpServer())
      .get('/v1/ai-runtime-analytics/monitoring')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(mon.body.honesty.regeneratesIntelligenceAnalytics).toBe(false);
  });

  it('exposes aiRuntimeAnalyticsEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ aiRuntimeAnalyticsEngine { product biDashboardOs apmOs cloudGpuTelemetryOs regeneratesIntelligenceAnalytics regeneratesKnowledgeAnalytics enterpriseReportingSuite aggregatesOnly orgWorkspaceScoped extendsInferenceCloud mode capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.aiRuntimeAnalyticsEngine.biDashboardOs).toBe(false);
    expect(res.body.data.aiRuntimeAnalyticsEngine.apmOs).toBe(false);
    expect(res.body.data.aiRuntimeAnalyticsEngine.aggregatesOnly).toBe(true);
    expect(res.body.data.aiRuntimeAnalyticsEngine.regeneratesIntelligenceAnalytics).toBe(false);
  });
});
