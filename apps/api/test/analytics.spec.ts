import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { estimateFeatureCostUsd, roundUsd } from '../src/analytics/analytics-cost';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_analytics_${name}_${Date.now}_${Math.random}`,
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

describe('Analytics',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async  => {
    await app.close;
  });

  it('estimates feature costs from units',  => {
    expect(roundUsd(estimateFeatureCostUsd('translate', 1000))).toBe(0.02);
    expect(roundUsd(estimateFeatureCostUsd('stt', 60))).toBe(0.006);
  });

  it('returns volume by feature, language pairs, cost, and job error rate', async  => {
    const org = await seedOrg(prisma, `an_${Date.now}`);
    const workspaceId = org.workspaces[0].id;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      userId: org.memberships[0].userId,
      name: 'analytics',
    });

    await prisma.usageEvent.createMany({
      data: [
        {
          organizationId: org.id,
          workspaceId,
          feature: 'translate',
          unitType: 'characters',
          units: 2000,
          provider: 'fixture',
        },
        {
          organizationId: org.id,
          workspaceId,
          feature: 'stt',
          unitType: 'seconds',
          units: 120,
          provider: 'fixture',
        },
      ],
    });

    await prisma.translationRequest.createMany({
      data: [
        {
          organizationId: org.id,
          workspaceId,
          sourceLang: 'en',
          targetLang: 'sw',
          characters: 1200,
          provider: 'fixture',
          latencyMs: 10,
        },
        {
          organizationId: org.id,
          workspaceId,
          sourceLang: 'en',
          targetLang: 'sw',
          characters: 800,
          provider: 'fixture',
          latencyMs: 12,
        },
        {
          organizationId: org.id,
          workspaceId,
          sourceLang: 'fr',
          targetLang: 'en',
          characters: 100,
          provider: 'fixture',
          latencyMs: 8,
        },
      ],
    });

    await prisma.job.createMany({
      data: [
        {
          organizationId: org.id,
          workspaceId,
          type: 'batch_translate',
          status: 'succeeded',
          input: {},
        },
        {
          organizationId: org.id,
          workspaceId,
          type: 'batch_translate',
          status: 'succeeded',
          input: {},
        },
        {
          organizationId: org.id,
          workspaceId,
          type: 'workflow',
          status: 'failed',
          input: {},
          error: 'boom',
        },
      ],
    });

    const res = await request(app.getHttpServer)
      .get('/v1/analytics/overview')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);

    expect(res.body.byFeature.length).toBeGreaterThanOrEqual(2);
    const translate = res.body.byFeature.find((f: { feature: string }) => f.feature === 'translate');
    expect(translate.units).toBe(2000);
    expect(translate.estimatedCostUsd).toBe(0.04);

    const enSw = res.body.byLanguagePair.find(
      (p: { source: string; target: string }) => p.source === 'en' && p.target === 'sw',
    );
    expect(enSw.requests).toBe(2);
    expect(enSw.characters).toBe(2000);

    expect(res.body.cost.estimatedUsd).toBeGreaterThan(0);
    expect(res.body.errors.jobSucceeded).toBe(2);
    expect(res.body.errors.jobFailed).toBe(1);
    expect(res.body.errors.errorRate).toBe(0.3333);
  });

  it('rejects invalid period windows', async  => {
    const org = await seedOrg(prisma, `an_bad_${Date.now}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'analytics',
    });

    await request(app.getHttpServer)
      .get('/v1/analytics/overview')
      .query({ from: '2026-09-01', to: '2026-08-01' })
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(400);
  });
});
