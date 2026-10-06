import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { InferenceCloudService } from '../src/inference-cloud/inference-cloud.service';
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
              clerkUserId: `clerk_inf_${name}_${Date.now()}_${Math.random()}`,
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

describe('Inference Cloud Foundation (VL-204)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let inferenceCloud: InferenceCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    inferenceCloud = app.get(InferenceCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Inference Cloud mapping (no GPU hyperscaler OS)', () => {
    const doc = join(root, 'docs/INFERENCE_CLOUD.md');
    const adr = join(root, 'docs/adr/0115-inference-cloud-foundation.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('GPU Platform');
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('af-south-1');
    expect(text).toMatch(/is \*\*not\*\* a GPU hyperscaler/i);
    expect(text).toContain('VL-021');
    expect(text).toMatch(/hard ceiling|spend/i);
    const readmeText = readFileSync(readme, 'utf8');
    expect(readmeText).toMatch(/GPU|spend|bill/i);
  });

  it('exposes public product catalog with honest statuses', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/inference-cloud/products')
      .expect(200);
    expect(res.body.architecture.graphql).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.gpuHyperscalerOs).toBe(false);
    expect(res.body.architecture.multiRegionRuntimeOs).toBe(false);
    expect(res.body.architecture.regeneratesAiGateway).toBe(false);
    expect(res.body.architecture.extendsAiGateway).toBe(true);
    expect(res.body.architecture.extendsChatEmbeddings).toBe(true);
    expect(res.body.architecture.vendorApisToday).toBe(true);
    expect(res.body.architecture.hardSpendCeilingsRequired).toBe(true);
    expect(res.body.architecture.openEndedGpuAutoscale).toBe(false);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.docs).toBe('/docs/INFERENCE_CLOUD.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'inference-cloud',
        'gpu-platform',
        'model-serving',
        'ai-router',
        'streaming-runtime',
        'batch-runtime',
        'intelligent-cache',
        'cost-optimization',
        'ai-runtime-analytics',
        'cpu-runtime',
        'model-registry-bridge',
      ]),
    );

    const hub = res.body.products.find((p: { id: string }) => p.id === 'inference-cloud');
    expect(hub.status).toBe('shipped');

    const gpu = res.body.products.find((p: { id: string }) => p.id === 'gpu-platform');
    expect(gpu.status).toBe('partial');
    expect(gpu.api).toContain('/v1/gpu-platform/engine');
    expect(gpu.console).toBe('/gpu-platform');
    expect(gpu.notes).toMatch(/spend|ceiling/i);

    const serving = res.body.products.find((p: { id: string }) => p.id === 'model-serving');
    expect(serving.status).toBe('partial');
    expect(serving.api).toContain('/v1/model-serving/engine');
    expect(serving.console).toBe('/model-serving');

    const router = res.body.products.find((p: { id: string }) => p.id === 'ai-router');
    expect(router.status).toBe('partial');
    expect(router.api).toContain('/v1/ai-router/engine');
    expect(router.console).toBe('/ai-router');

    const streaming = res.body.products.find((p: { id: string }) => p.id === 'streaming-runtime');
    expect(streaming.status).toBe('partial');
    expect(streaming.api).toContain('/v1/streaming-runtime/engine');
    expect(streaming.console).toBe('/streaming-runtime');

    const batch = res.body.products.find((p: { id: string }) => p.id === 'batch-runtime');
    expect(batch.status).toBe('partial');
    expect(batch.api).toContain('/v1/batch-runtime/engine');
    expect(batch.console).toBe('/batch-runtime');

    const cache = res.body.products.find((p: { id: string }) => p.id === 'intelligent-cache');
    expect(cache.status).toBe('partial');
    expect(cache.api).toContain('/v1/intelligent-cache/engine');
    expect(cache.console).toBe('/intelligent-cache');

    const cost = res.body.products.find((p: { id: string }) => p.id === 'cost-optimization');
    expect(cost.status).toBe('partial');
    expect(cost.api).toContain('/v1/cost-optimization/engine');
    expect(cost.console).toBe('/cost-optimization');
    expect(cost.notes).toMatch(/enforce/i);

    const runtime = res.body.products.find((p: { id: string }) => p.id === 'ai-runtime-analytics');
    expect(runtime.status).toBe('partial');
    expect(runtime.api).toContain('/v1/ai-runtime-analytics/engine');
    expect(runtime.console).toBe('/ai-runtime-analytics');
  });

  it('returns org inference overview with usage + deferred + spend safety', async () => {
    const org = await seedOrg(prisma, `inf_${Date.now()}`);

    const overview = await inferenceCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_inf',
      role: 'owner',
    });

    expect(overview.usage.chat).toBeDefined();
    expect(overview.usage.embeddings).toBeDefined();
    expect(overview.deferred.gpuPlatform).toBe(false);
    expect(overview.links.gpuPlatform).toBe('/gpu-platform');
    expect(overview.deferred.modelServing).toBe(false);
    expect(overview.links.modelServing).toBe('/model-serving');
    expect(overview.deferred.aiRouter).toBe(false);
    expect(overview.links.aiRouter).toBe('/ai-router');
    expect(overview.deferred.streamingRuntimeProduct).toBe(false);
    expect(overview.links.streamingRuntime).toBe('/streaming-runtime');
    expect(overview.deferred.batchRuntimeProduct).toBe(false);
    expect(overview.links.batchRuntime).toBe('/batch-runtime');
    expect(overview.deferred.intelligentCache).toBe(false);
    expect(overview.links.intelligentCache).toBe('/intelligent-cache');
    expect(overview.deferred.costOptimization).toBe(false);
    expect(overview.links.costOptimization).toBe('/cost-optimization');
    expect(overview.deferred.aiRuntimeAnalytics).toBe(false);
    expect(overview.links.aiRuntimeAnalytics).toBe('/ai-runtime-analytics');
    expect(overview.deferred.gpuHyperscalerOs).toBe(true);
    expect(overview.deferred.regeneratesAiGateway).toBe(false);
    expect(overview.spendSafety.hardSpendCeilingsRequired).toBe(true);
    expect(overview.spendSafety.openEndedGpuAutoscale).toBe(false);
    expect(overview.spendSafety.sandboxBeforeRealCloudBill).toBe(true);
    expect(overview.links.inferenceCloud).toBe('/inference-cloud');
    expect(overview.links.gateway).toBe('/gateway');
    expect(overview.architecture.hexagonalRewrite).toBe(false);
    expect(overview.architecture.extendsAiGateway).toBe(true);
  });

  it('exposes inferenceProducts via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ inferenceProducts { id name status } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.inferenceProducts.length).toBeGreaterThan(8);
    expect(
      res.body.data.inferenceProducts.some((p: { id: string }) => p.id === 'inference-cloud'),
    ).toBe(true);
  });
});
