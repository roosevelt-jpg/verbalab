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
              clerkUserId: `clerk_ia_${name}_${Date.now()}_${Math.random()}`,
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

describe('Intelligence Analytics (VL-191)', () => {
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

  it('documents Intelligence Analytics honesty', () => {
    const doc = join(root, 'docs/INTELLIGENCE_ANALYTICS.md');
    const adr = join(root, 'docs/adr/0102-intelligence-analytics.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/not.*Language.*Speech.*Voice/i);
    expect(text).toContain('VL-191');
  });

  it('exposes engine with regeneratesSpeechAnalytics=false', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/intelligence-analytics/engine')
      .expect(200);
    expect(res.body.product).toContain('Intelligence Analytics');
    expect(res.body.honesty.regeneratesSpeechAnalytics).toBe(false);
    expect(res.body.honesty.regeneratesVoiceAnalytics).toBe(false);
    expect(res.body.honesty.regeneratesLanguageAnalytics).toBe(false);
    expect(res.body.honesty.biDashboardOs).toBe(false);
    expect(res.body.honesty.aggregatesOnly).toBe(true);
  });

  it('returns overview/surfaces/report for org with seeded intel audits', async () => {
    const org = await seedOrg(prisma, 'ia');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ia-key',
    });

    await prisma.usageEvent.createMany({
      data: [
        {
          organizationId: org.id,
          workspaceId: org.workspaces[0]!.id,
          feature: 'chat',
          units: 100,
          unitType: 'tokens',
          provider: 'fixture_chat',
        },
        {
          organizationId: org.id,
          workspaceId: org.workspaces[0]!.id,
          feature: 'embeddings',
          units: 50,
          unitType: 'tokens',
          provider: 'fixture_embed',
        },
      ],
    });

    await prisma.auditEvent.createMany({
      data: [
        {
          organizationId: org.id,
          action: 'reasoning_cloud.reasoned',
          route: 'POST /v1/reasoning-cloud/reason',
          metadata: { latencyMs: 12 },
        },
        {
          organizationId: org.id,
          action: 'decision_engine.decided',
          route: 'POST /v1/decision-engine/decide',
          metadata: { kind: 'routing', decision: 'translate', confidence: 0.8 },
        },
        {
          organizationId: org.id,
          action: 'prompt_intelligence.evaluated',
          route: 'POST /v1/prompt-intelligence/evaluate',
          metadata: { score: 0.9 },
        },
      ],
    });

    const overview = await request(app.getHttpServer())
      .get('/v1/intelligence-analytics/overview')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(overview.body.usage.chat.requests).toBeGreaterThanOrEqual(1);
    expect(overview.body.usage.embeddings.requests).toBeGreaterThanOrEqual(1);
    expect(overview.body.estimatedCostUsd).toBeGreaterThanOrEqual(0);
    expect(overview.body.quality.avgDecisionConfidence).toBeCloseTo(0.8, 1);

    const surfaces = await request(app.getHttpServer())
      .get('/v1/intelligence-analytics/surfaces')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(surfaces.body.totalEvents).toBeGreaterThanOrEqual(3);
    expect(surfaces.body.bySurface.some((s: { surface: string }) => s.surface === 'reasoning')).toBe(
      true,
    );

    const report = await request(app.getHttpServer())
      .get('/v1/intelligence-analytics/report')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(report.body.honesty.aggregatesOnly).toBe(true);
    expect(report.body.routing.decisions).toBeGreaterThanOrEqual(1);
  });

  it('exposes intelligenceAnalytics via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ intelligenceAnalytics { product regeneratesSpeechAnalytics regeneratesVoiceAnalytics biDashboardOs aggregatesOnly capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.intelligenceAnalytics.regeneratesSpeechAnalytics).toBe(false);
    expect(res.body.data.intelligenceAnalytics.aggregatesOnly).toBe(true);
  });
});
