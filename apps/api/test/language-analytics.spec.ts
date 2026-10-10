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
              clerkUserId: `clerk_la_${name}_${Date.now()}_${Math.random()}`,
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

describe('Language Analytics Phase 14', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;
  let orgId: string;
  let workspaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const org = await seedOrg(prisma, 'la');
    orgId = org.id;
    workspaceId = org.workspaces[0]!.id;
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      userId: org.memberships[0]!.userId,
      name: 'la-key',
    });
    rawKey = created.secret;

    await prisma.translationRequest.createMany({
      data: [
        {
          organizationId: orgId,
          workspaceId,
          sourceLang: 'en',
          targetLang: 'sw',
          characters: 120,
          provider: 'fixture',
          latencyMs: 40,
        },
        {
          organizationId: orgId,
          workspaceId,
          sourceLang: 'en',
          targetLang: 'sw',
          characters: 80,
          provider: 'tm',
          latencyMs: 5,
        },
        {
          organizationId: orgId,
          workspaceId,
          sourceLang: 'en',
          targetLang: 'fr',
          characters: 50,
          provider: 'fixture',
          latencyMs: 90,
        },
      ],
    });

    await prisma.usageEvent.create({
      data: {
        organizationId: orgId,
        workspaceId,
        feature: 'translate',
        unitType: 'characters',
        units: 250,
        provider: 'fixture',
      },
    });

    await prisma.translationReview.createMany({
      data: [
        {
          organizationId: orgId,
          workspaceId,
          sourceLang: 'en',
          targetLang: 'sw',
          sourceText: 'Hello',
          targetText: 'Habari',
          provider: 'fixture',
          qualityScore: 88,
          needsReview: false,
          status: 'accepted',
        },
        {
          organizationId: orgId,
          workspaceId,
          sourceLang: 'en',
          targetLang: 'sw',
          sourceText: 'Bye',
          targetText: 'Bye',
          provider: 'fixture',
          qualityScore: 40,
          needsReview: true,
          status: 'rejected',
        },
      ],
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        action: 'dialect.detect',
        route: 'POST /v1/dialects/detect',
        metadata: { language: 'en', dialect: 'en-us', provider: 'cues', confidence: 0.7 },
      },
    });
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships ADR and docs', () => {
    expect(existsSync(join(root, 'docs/adr/0067-language-analytics-phase-14.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/ANALYTICS.md'), 'utf8')).toContain('/reports/enterprise');
  });

  it('exposes catalog with wired country/accuracy', async () => {
    const res = await request(app.getHttpServer()).get('/v1/analytics').expect(200);
    expect(res.body.product).toMatch(/Language Analytics/i);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'country_usage' && c.status === 'shipped',
      ),
    ).toBe(true);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'translation_accuracy' && c.status === 'shipped',
      ),
    ).toBe(true);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'enterprise_reports' && c.status === 'shipped',
      ),
    ).toBe(true);
  });

  it('returns translation, language, quality, latency, dialect analytics', async () => {
    const translation = await request(app.getHttpServer())
      .get('/v1/analytics/translation')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(translation.body.requests).toBe(3);
    expect(translation.body.tmHits).toBe(1);

    const languages = await request(app.getHttpServer())
      .get('/v1/analytics/languages')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(languages.body.asTarget.some((r: { language: string }) => r.language === 'sw')).toBe(true);

    const quality = await request(app.getHttpServer())
      .get('/v1/analytics/quality')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(quality.body.reviews).toBe(2);
    expect(quality.body.translationAccuracyProxy).toBe(0.5);
    expect(quality.body.averageQualityScore).toBe(64);

    const latency = await request(app.getHttpServer())
      .get('/v1/analytics/latency')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(latency.body.samples).toBe(3);
    expect(latency.body.p95Ms).toBeGreaterThan(0);

    const dialects = await request(app.getHttpServer())
      .get('/v1/analytics/dialects')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(dialects.body.dialectDetects).toBeGreaterThan(0);
    expect(dialects.body.byDialect[0].code).toBe('en-us');
  });

  it('returns enterprise report and GraphQL languageAnalytics', async () => {
    const report = await request(app.getHttpServer())
      .get('/v1/analytics/reports/enterprise')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(report.body.product).toMatch(/Enterprise Report/i);
    expect(report.body.translation.requests).toBe(3);
    expect(report.body.quality.reviews).toBe(2);

    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `{
          languageAnalytics { product shippedCount }
          analyticsOverview { estimatedCostUsd languagePairCount }
          enterpriseAnalyticsReport { translationRequests averageQualityScore p95LatencyMs }
        }`,
      })
      .expect(200);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.languageAnalytics.shippedCount).toBeGreaterThan(5);
    expect(gql.body.data.enterpriseAnalyticsReport.translationRequests).toBe(3);
  });
});
