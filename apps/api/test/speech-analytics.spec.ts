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
              clerkUserId: `clerk_sa_${name}_${Date.now}_${Math.random}`,
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

describe('Speech Analytics',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let usage: UsageService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    usage = app.get(UsageService);
  });

  afterAll(async  => {
    await app.close;
  });

  it('documents Speech Analytics honesty',  => {
    const doc = join(root, 'docs/SPEECH_ANALYTICS.md');
    const adr = join(root, 'docs/adr/0078-speech-analytics.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Language Analytics/i);
    expect(text).toMatch(/deferred/i);
    expect(text).not.toMatch(/WER lab.*shipped/i);
  });

  it('exposes speech analytics engine with WER lab deferred', async  => {
    const res = await request(app.getHttpServer).get('/v1/speech-analytics/engine').expect(200);
    expect(res.body.product).toContain('Speech Analytics');
    const wer = res.body.capabilities.find((c: { id: string }) => c.id === 'wer-lab');
    expect(wer.status).toBe('deferred');
  });

  it('returns usage overview costs and report', async  => {
    const org = await seedOrg(prisma, 'sa');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'sa-key',
    });

    await usage.recordStt({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      apiKeyId: key.id,
      seconds: 90,
      provider: 'test',
    });
    await usage.recordTts({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      apiKeyId: key.id,
      characters: 500,
      provider: 'test',
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: org.id,
        action: 'speech.recognized',
        route: 'POST /v1/speech/recognize',
        apiKeyPrefix: key.prefix,
        metadata: {
          language: 'en',
          durationSeconds: 12,
          confidence: 0.88,
          industryPacks: ['medical'],
        },
      },
    });

    const overview = await request(app.getHttpServer)
      .get('/v1/speech-analytics/overview')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(overview.body.usage.stt.requests).toBeGreaterThanOrEqual(1);
    expect(overview.body.usage.tts.requests).toBeGreaterThanOrEqual(1);
    expect(overview.body.estimatedCostUsd).toBeGreaterThan(0);

    const languages = await request(app.getHttpServer)
      .get('/v1/speech-analytics/languages')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(languages.body.byLanguage.some((l: { language: string }) => l.language === 'en')).toBe(
      true,
    );

    const accuracy = await request(app.getHttpServer)
      .get('/v1/speech-analytics/accuracy')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(accuracy.body.sttConfidence.average).toBe(0.88);

    const industries = await request(app.getHttpServer)
      .get('/v1/speech-analytics/industries')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(industries.body.byIndustryPack.some((p: { pack: string }) => p.pack === 'medical')).toBe(
      true,
    );

    const report = await request(app.getHttpServer)
      .get('/v1/speech-analytics/report')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(report.body.product).toContain('Speech Analytics');
    expect(report.body.usage).toBeDefined;
  });

  it('exposes speechAnalyticsEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: '{ speechAnalyticsEngine { product capabilityCount shippedCount } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.speechAnalyticsEngine.capabilityCount).toBeGreaterThan(5);
  });
});
