import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkTsFiles(p, out);
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
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
              clerkUserId: `clerk_icaudit_${name}_${Date.now()}_${Math.random()}`,
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

describe('Inference Cloud Production Audit', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    const org = await seedOrg(prisma, 'ica');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ica-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit ADR, blueprint ADR, and report pack', () => {
    expect(existsSync(join(root, 'docs/adr/0124-inference-cloud-production-audit.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/inference-cloud-audit/PRODUCTION_READINESS.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/inference-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/inference-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/inference-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/inference-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    const readiness = readFileSync(
      join(root, 'docs/inference-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/not.*GPU hyperscaler|Rejected/i);
    expect(readiness).toContain('bounded');
    expect(readiness).toMatch(/AI Kernel|Volume 8/i);
    expect(readiness).toMatch(/enforce/i);
    const adr = readFileSync(
      join(root, 'docs/adr/0124-inference-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/AI Kernel/i);
    expect(adr).toMatch(/review gate|checklist/i);
  });

  it('has no TODO/FIXME/implement-later markers in Inference Cloud source trees', () => {
    const roots = [
      join(apiSrc, 'inference-cloud'),
      join(apiSrc, 'gpu-platform'),
      join(apiSrc, 'model-serving'),
      join(apiSrc, 'ai-router'),
      join(apiSrc, 'streaming-runtime'),
      join(apiSrc, 'batch-runtime'),
      join(apiSrc, 'intelligent-cache'),
      join(apiSrc, 'cost-optimization'),
      join(apiSrc, 'ai-runtime-analytics'),
    ];
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const dir of roots) {
      if (!existsSync(dir)) continue;
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes integrated Inference Cloud catalogs', async () => {
    const paths = [
      '/v1/inference-cloud/products',
      '/v1/gpu-platform/engine',
      '/v1/model-serving/engine',
      '/v1/ai-router/engine',
      '/v1/streaming-runtime/engine',
      '/v1/batch-runtime/engine',
      '/v1/intelligent-cache/engine',
      '/v1/cost-optimization/engine',
      '/v1/ai-runtime-analytics/engine',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }
  });

  it('verifies spend-safety: GPU hard ceilings + Cost Optimization enforce', async () => {
    const ceilings = await request(app.getHttpServer())
      .get('/v1/gpu-platform/ceilings')
      .expect(200);
    expect(ceilings.body.maxInstances).toBeGreaterThan(0);
    expect(ceilings.body.maxSpendUsd).toBeGreaterThan(0);
    expect(ceilings.body.note).toMatch(/Hard|ceiling/i);

    const gpu = await request(app.getHttpServer()).get('/v1/gpu-platform/engine').expect(200);
    expect(gpu.body.honesty.openEndedGpuAutoscale).toBe(false);
    expect(gpu.body.honesty.hardSpendCeilingsRequired).toBe(true);
    expect(gpu.body.spendSafety.openEndedGpuAutoscale).toBe(false);

    const cost = await request(app.getHttpServer())
      .get('/v1/cost-optimization/engine')
      .expect(200);
    expect(cost.body.honesty.enforcesSpendCaps).toBe(true);
    expect(cost.body.honesty.reportOnly).toBe(false);
    expect(cost.body.spendSafety.enforcesSpendCaps).toBe(true);
  });

  it('rejects unauthenticated GPU allocate and cost record (security)', async () => {
    const allocate = await request(app.getHttpServer())
      .post('/v1/gpu-platform/allocations')
      .send({ instances: 1 });
    expect([401, 403, 503]).toContain(allocate.status);

    const record = await request(app.getHttpServer())
      .post('/v1/cost-optimization/record')
      .send({ category: 'provider', amountUsd: 0.01 });
    expect([401, 403, 503]).toContain(record.status);

    const overview = await request(app.getHttpServer()).get(
      '/v1/ai-runtime-analytics/overview',
    );
    expect([401, 403, 503]).toContain(overview.status);
  });

  it('runs bounded sequential load smoke on public inference catalogs', async () => {
    const paths = [
      '/v1/inference-cloud/products',
      '/v1/gpu-platform/engine',
      '/v1/model-serving/engine',
      '/v1/ai-router/engine',
      '/v1/streaming-runtime/engine',
      '/v1/batch-runtime/engine',
      '/v1/intelligent-cache/engine',
      '/v1/cost-optimization/engine',
      '/v1/ai-runtime-analytics/engine',
    ];
    const started = Date.now();
    const iterations = 24;
    for (let i = 0; i < iterations; i++) {
      const path = paths[i % paths.length]!;
      await request(app.getHttpServer()).get(path).expect(200);
    }
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(30_000);
    expect(iterations).toBe(24);
  });

  it('runs bounded rapid stress smoke on inference products catalog', async () => {
    const started = Date.now();
    for (let i = 0; i < 12; i++) {
      await request(app.getHttpServer()).get('/v1/inference-cloud/products').expect(200);
    }
    expect(Date.now() - started).toBeLessThan(15_000);
  });

  it('GraphQL Inference Cloud façade queries respond with honesty flags', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `{
          inferenceProducts { id status }
          gpuPlatformEngine { product gpuHyperscalerOs callsCloudGpuApis openEndedGpuAutoscale hardSpendCeilingsRequired }
          modelServingEngine { product vllmOs kserveOs regeneratesAiGateway }
          aiRouterEngine { product serviceMeshOs multiCloudRouterOs enforcesSpendCaps dryRunResolveOnly }
          streamingRuntimeEngine { product websocketOs grpcStreamingOs videoStreamingOs }
          batchRuntimeEngine { product sparkOs airflowOs regeneratesJobsApi }
          intelligentCacheEngine { product redisClusterOs vectorSemanticOs cdnOs autoWiresGatewayResponses }
          costOptimizationEngine { product finOpsOs cloudSpotApis enforcesSpendCaps reportOnly }
          aiRuntimeAnalyticsEngine { product biDashboardOs apmOs regeneratesIntelligenceAnalytics aggregatesOnly }
        }`,
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.inferenceProducts.length).toBeGreaterThan(8);
    expect(res.body.data.gpuPlatformEngine.gpuHyperscalerOs).toBe(false);
    expect(res.body.data.gpuPlatformEngine.openEndedGpuAutoscale).toBe(false);
    expect(res.body.data.gpuPlatformEngine.hardSpendCeilingsRequired).toBe(true);
    expect(res.body.data.modelServingEngine.vllmOs).toBe(false);
    expect(res.body.data.aiRouterEngine.serviceMeshOs).toBe(false);
    expect(res.body.data.aiRouterEngine.enforcesSpendCaps).toBe(false);
    expect(res.body.data.streamingRuntimeEngine.websocketOs).toBe(false);
    expect(res.body.data.batchRuntimeEngine.sparkOs).toBe(false);
    expect(res.body.data.intelligentCacheEngine.redisClusterOs).toBe(false);
    expect(res.body.data.costOptimizationEngine.enforcesSpendCaps).toBe(true);
    expect(res.body.data.costOptimizationEngine.reportOnly).toBe(false);
    expect(res.body.data.aiRuntimeAnalyticsEngine.biDashboardOs).toBe(false);
    expect(res.body.data.aiRuntimeAnalyticsEngine.aggregatesOnly).toBe(true);
  });

  it('documents 12-layer cloud blueprint with Inference Cloud closed', () => {
    const blueprint = readFileSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'), 'utf8');
    expect(blueprint).toContain('Cloud Foundation');
    expect(blueprint).toContain('Production Audit');
    expect(blueprint).toContain('Inference');
    const living = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(living).toMatch(/→/);
  });
});
