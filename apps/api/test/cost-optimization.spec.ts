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
              clerkUserId: `clerk_co_${name}_${Date.now()}_${Math.random()}`,
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

describe('Cost Optimization', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_COST_OPTIMIZATION_MODE;
  const prevDaily = process.env.LUGEMI_COST_DAILY_CAP_USD;

  beforeAll(async () => {
    process.env.LUGEMI_COST_OPTIMIZATION_MODE = 'sandbox';
    process.env.LUGEMI_COST_DAILY_CAP_USD = '1';

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
    if (prevMode === undefined) delete process.env.LUGEMI_COST_OPTIMIZATION_MODE;
    else process.env.LUGEMI_COST_OPTIMIZATION_MODE = prevMode;
    if (prevDaily === undefined) delete process.env.LUGEMI_COST_DAILY_CAP_USD;
    else process.env.LUGEMI_COST_DAILY_CAP_USD = prevDaily;
    await app.close();
  });

  it('documents Cost Optimization honesty + enforce requirement', () => {
    const doc = join(root, 'docs/COST_OPTIMIZATION.md');
    const adr = join(root, 'docs/adr/0122-cost-optimization.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/FinOps|Spot/i);
    expect(text).toMatch(/does \*\*not\*\*|not invent/i);
    expect(text).toMatch(/enforce|402/i);
    expect(text).toMatch(/org\/workspace|workspace/i);
    expect(readFileSync(readme, 'utf8')).toMatch(/enforce/i);
  });

  it('exposes engine with honesty + hard ceilings', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/cost-optimization/engine')
      .expect(200);
    expect(res.body.product).toContain('Cost Optimization');
    expect(res.body.honesty.finOpsOs).toBe(false);
    expect(res.body.honesty.cloudSpotApis).toBe(false);
    expect(res.body.honesty.reservedInstanceMarketplace).toBe(false);
    expect(res.body.honesty.openEndedAutoscale).toBe(false);
    expect(res.body.honesty.enforcesSpendCaps).toBe(true);
    expect(res.body.honesty.reportOnly).toBe(false);
    expect(res.body.spendSafety.enforcesSpendCaps).toBe(true);
    expect(res.body.ceilings.defaultDailyCapUsd).toBe(1);
    expect(res.body.capabilities.some((c: { id: string }) => c.id === 'spend-enforcement')).toBe(
      true,
    );
  });

  it('records spend, enforces ceiling, and optimizes routes', async () => {
    const org = await seedOrg(prisma, `co_${Date.now()}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'co-test',
    });

    await request(app.getHttpServer())
      .put('/v1/cost-optimization/budgets')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        dailyCapUsd: 1,
        monthlyCapUsd: 10,
        enforce: true,
        preferSpot: true,
        reservedCapacityUnits: 2,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/cost-optimization/record')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ category: 'provider', amountUsd: 0.6, feature: 'chat' })
      .expect(201);

    const over = await request(app.getHttpServer())
      .post('/v1/cost-optimization/record')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ category: 'provider', amountUsd: 0.5, feature: 'chat' })
      .expect(402);
    expect(JSON.stringify(over.body)).toMatch(/ceiling|spend/i);

    const soft = await request(app.getHttpServer())
      .post('/v1/cost-optimization/check')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ additionalUsd: 0.5, soft: true })
      .expect(200);
    expect(soft.body.allowed).toBe(false);

    const opt = await request(app.getHttpServer())
      .post('/v1/cost-optimization/optimize')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ feature: 'chat' })
      .expect(200);
    expect(opt.body.optimize).toBe('cost');
    expect(opt.body.selected?.providerId).toBeTruthy();
    expect(opt.body.honesty.cloudSpotApis).toBe(false);

    const pred = await request(app.getHttpServer())
      .get('/v1/cost-optimization/predictions')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(pred.body.spotPlan.note).toMatch(/Spot/i);
    expect(pred.body.honesty.finOpsOs).toBe(false);

    // Lower daily cap below already-spent so AI Router resolve hard-gates
    await request(app.getHttpServer())
      .put('/v1/cost-optimization/budgets')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ dailyCapUsd: 0.5, monthlyCapUsd: 10, enforce: true })
      .expect(200);

    const resolve = await request(app.getHttpServer())
      .post('/v1/ai-router/resolve')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ feature: 'chat', optimize: 'cost' })
      .expect(402);
    expect(JSON.stringify(resolve.body)).toMatch(/ceiling|spend/i);

    const mon = await request(app.getHttpServer())
      .get('/v1/cost-optimization/monitoring')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(mon.body.honesty.enforcesSpendCaps).toBe(true);
    expect(mon.body.honesty.reportOnly).toBe(false);
  });

  it('exposes costOptimizationEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ costOptimizationEngine { product finOpsOs cloudSpotApis reservedInstanceMarketplace openEndedAutoscale regeneratesAiGateway enforcesSpendCaps reportOnly orgWorkspaceScoped extendsGpuPlatform extendsAiRouter mode defaultDailyCapUsd defaultMonthlyCapUsd capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.costOptimizationEngine.finOpsOs).toBe(false);
    expect(res.body.data.costOptimizationEngine.enforcesSpendCaps).toBe(true);
    expect(res.body.data.costOptimizationEngine.reportOnly).toBe(false);
    expect(res.body.data.costOptimizationEngine.cloudSpotApis).toBe(false);
    expect(res.body.data.costOptimizationEngine.defaultDailyCapUsd).toBe(1);
  });
});
