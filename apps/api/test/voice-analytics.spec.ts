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
import { UsageService } from '../src/usage/usage.service';
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
              clerkUserId: `clerk_va_${name}_${Date.now()}_${Math.random()}`,
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

describe('Voice Analytics (VL-178)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let usage: UsageService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    usage = app.get(UsageService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Voice Analytics distinct from Speech Analytics', () => {
    const doc = join(root, 'docs/VOICE_ANALYTICS.md');
    const adr = join(root, 'docs/adr/0089-voice-analytics.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Speech Analytics/i);
    expect(text).toMatch(/deferred/i);
    expect(text).not.toMatch(/BI dashboard.*shipped/i);
  });

  it('exposes engine with regeneratesSpeechAnalytics=false and BI deferred', async () => {
    const res = await request(app.getHttpServer()).get('/v1/voice-analytics/engine').expect(200);
    expect(res.body.product).toContain('Voice Analytics');
    expect(res.body.honesty.regeneratesSpeechAnalytics).toBe(false);
    expect(res.body.honesty.biDashboardProduct).toBe(false);
    const bi = res.body.capabilities.find((c: { id: string }) => c.id === 'bi-dashboard');
    expect(bi.status).toBe('deferred');
  });

  it('returns usage overview revenue and report', async () => {
    const org = await seedOrg(prisma, 'va');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'va-key',
    });

    await usage.recordTts({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      apiKeyId: key.id,
      characters: 1200,
      provider: 'test',
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: org.id,
        action: 'tts.synthesized',
        route: 'POST /v1/tts/synthesize',
        apiKeyPrefix: key.prefix,
        metadata: {
          voice: 'own:sw-aisha',
          language: 'sw',
          characters: 1200,
          bytes: 4096,
          watermarkApplied: true,
          latencyMs: 180,
        },
      },
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: org.id,
        action: 'tts.streamed',
        route: 'POST /v1/tts/stream',
        apiKeyPrefix: key.prefix,
        metadata: {
          voice: 'nova',
          characters: 100,
          bytes: 512,
          chunks: 2,
          watermarkApplied: false,
        },
      },
    });

    const listing = await prisma.voiceListing.create({
      data: {
        publisherOrgId: org.id,
        publisherWorkspaceId: org.workspaces[0]!.id,
        kind: 'language_pack',
        sourceType: 'pack',
        sourceVoiceId: 'language_pack:sw',
        title: 'Swahili Pack',
        licenseType: 'commercial',
        rightsAttested: true,
        priceCents: 500,
        status: 'published',
        ratingSum: 5,
        ratingCount: 1,
      },
    });

    await prisma.voiceListingSale.create({
      data: {
        listingId: listing.id,
        buyerOrgId: org.id,
        publisherOrgId: org.id,
        amountCents: 500,
        currency: 'usd',
        status: 'recorded',
      },
    });

    const overview = await request(app.getHttpServer())
      .get('/v1/voice-analytics/overview')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);

    expect(overview.body.usage.tts.requests).toBeGreaterThanOrEqual(1);
    expect(overview.body.usage.tts.characters).toBeGreaterThanOrEqual(1200);
    expect(overview.body.revenueCents).toBeGreaterThanOrEqual(500);
    expect(overview.body.estimatedCostUsd).toBeGreaterThan(0);

    const voices = await request(app.getHttpServer())
      .get('/v1/voice-analytics/voices')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(voices.body.byVoice.some((v: { voice: string }) => v.voice === 'own:sw-aisha')).toBe(
      true,
    );

    const languages = await request(app.getHttpServer())
      .get('/v1/voice-analytics/languages')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(languages.body.byLanguage.some((l: { language: string }) => l.language === 'sw')).toBe(
      true,
    );

    const streaming = await request(app.getHttpServer())
      .get('/v1/voice-analytics/streaming')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(streaming.body.streamEvents).toBeGreaterThanOrEqual(1);

    const report = await request(app.getHttpServer())
      .get('/v1/voice-analytics/report')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(report.body.product).toContain('Voice Analytics');
    expect(report.body.marketplace).toBeDefined();
    expect(report.body.note).toMatch(/Speech Analytics/i);
  });

  it('exposes voiceAnalyticsEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ voiceAnalyticsEngine { product regeneratesSpeechAnalytics biDashboardProduct shippedCount } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.voiceAnalyticsEngine.regeneratesSpeechAnalytics).toBe(false);
    expect(res.body.data.voiceAnalyticsEngine.biDashboardProduct).toBe(false);
    expect(res.body.data.voiceAnalyticsEngine.shippedCount).toBeGreaterThan(0);
  });
});
