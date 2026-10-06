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
              clerkUserId: `clerk_gpu_${name}_${Date.now()}_${Math.random()}`,
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

describe('GPU Platform', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_GPU_PROVISION_MODE;
  const prevMax = process.env.LUGEMI_GPU_MAX_INSTANCES;
  const prevSpend = process.env.LUGEMI_GPU_MAX_SPEND_USD;

  beforeAll(async () => {
    process.env.LUGEMI_GPU_PROVISION_MODE = 'sandbox';
    process.env.LUGEMI_GPU_MAX_INSTANCES = '2';
    process.env.LUGEMI_GPU_MAX_SPEND_USD = '25';

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
    if (prevMode === undefined) delete process.env.LUGEMI_GPU_PROVISION_MODE;
    else process.env.LUGEMI_GPU_PROVISION_MODE = prevMode;
    if (prevMax === undefined) delete process.env.LUGEMI_GPU_MAX_INSTANCES;
    else process.env.LUGEMI_GPU_MAX_INSTANCES = prevMax;
    if (prevSpend === undefined) delete process.env.LUGEMI_GPU_MAX_SPEND_USD;
    else process.env.LUGEMI_GPU_MAX_SPEND_USD = prevSpend;
    await app.close();
  });

  it('documents GPU Platform spend-safety honesty', () => {
    const doc = join(root, 'docs/GPU_PLATFORM.md');
    const adr = join(root, 'docs/adr/0116-gpu-platform.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/hard.*(ceiling|instance|spend)/i);
    expect(text).toMatch(/does \*\*not\*\* call|not.*cloud GPU API/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
  });

  it('exposes engine with hard ceilings and no cloud GPU APIs', async () => {
    const res = await request(app.getHttpServer()).get('/v1/gpu-platform/engine').expect(200);
    expect(res.body.product).toContain('GPU Platform');
    expect(res.body.honesty.gpuHyperscalerOs).toBe(false);
    expect(res.body.honesty.callsCloudGpuApis).toBe(false);
    expect(res.body.honesty.openEndedGpuAutoscale).toBe(false);
    expect(res.body.honesty.hardSpendCeilingsRequired).toBe(true);
    expect(res.body.honesty.sandboxLogicalOnly).toBe(true);
    expect(res.body.ceilings.maxInstances).toBe(2);
    expect(res.body.ceilings.maxSpendUsd).toBe(25);
    expect(res.body.ceilings.provisionMode).toBe('sandbox');

    const pools = await request(app.getHttpServer()).get('/v1/gpu-platform/pools').expect(200);
    expect(pools.body.pools.length).toBeGreaterThanOrEqual(3);
    expect(pools.body.pools.some((p: { vendor: string }) => p.vendor === 'nvidia')).toBe(true);
    expect(pools.body.pools.some((p: { vendor: string }) => p.vendor === 'amd')).toBe(true);
    expect(pools.body.pools.some((p: { vendor: string }) => p.vendor === 'intel')).toBe(true);
  });

  it('allocates sandbox GPUs and enforces hard instance ceiling', async () => {
    const org = await seedOrg(prisma, 'gpu');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'gpu-key',
    });

    const a1 = await request(app.getHttpServer())
      .post('/v1/gpu-platform/allocations')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ poolId: 'sandbox-nvidia-t4', instances: 1, purpose: 'test' })
      .expect(201);
    expect(a1.body.allocation.status).toBe('active');
    expect(a1.body.honesty.callsCloudGpuApis).toBe(false);

    await request(app.getHttpServer())
      .post('/v1/gpu-platform/allocations')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ poolId: 'sandbox-amd-mi210', instances: 1 })
      .expect(201);

    const over = await request(app.getHttpServer())
      .post('/v1/gpu-platform/allocations')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ poolId: 'sandbox-intel-max', instances: 1 })
      .expect(402);
    expect(JSON.stringify(over.body)).toMatch(/ceiling|instance/i);

    const scale = await request(app.getHttpServer())
      .post(`/v1/gpu-platform/allocations/${a1.body.allocation.id}/scale`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ targetInstances: 8 });
    expect([200, 201]).toContain(scale.status);
    expect(scale.body.clampedToCeiling).toBe(true);
    expect(scale.body.appliedInstances).toBeLessThan(8);
    expect(scale.body.honesty.openEndedGpuAutoscale).toBe(false);

    const overScale = await request(app.getHttpServer())
      .post('/v1/gpu-platform/allocations')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ poolId: 'sandbox-nvidia-a10', instances: 2 })
      .expect(402);
    expect(JSON.stringify(overScale.body)).toMatch(/ceiling|instance/i);

    const costs = await request(app.getHttpServer())
      .get('/v1/gpu-platform/costs')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(costs.body.activeInstances).toBe(2);
    expect(costs.body.withinSpendCeiling).toBe(true);
  });

  it('exposes gpuPlatformEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ gpuPlatformEngine { product gpuHyperscalerOs callsCloudGpuApis openEndedGpuAutoscale hardSpendCeilingsRequired sandboxLogicalOnly maxInstances maxSpendUsd provisionMode capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.gpuPlatformEngine.gpuHyperscalerOs).toBe(false);
    expect(res.body.data.gpuPlatformEngine.callsCloudGpuApis).toBe(false);
    expect(res.body.data.gpuPlatformEngine.openEndedGpuAutoscale).toBe(false);
    expect(res.body.data.gpuPlatformEngine.hardSpendCeilingsRequired).toBe(true);
    expect(res.body.data.gpuPlatformEngine.sandboxLogicalOnly).toBe(true);
  });
});
