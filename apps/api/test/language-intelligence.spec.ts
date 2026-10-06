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
import { GatewayService } from '../src/gateway/gateway.service';
import {
  analyzeIntent,
  analyzeReadability,
  analyzeSentiment,
} from '../src/language-intelligence/language-signals';

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
              clerkUserId: `clerk_li_${name}_${Date.now()}_${Math.random()}`,
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

describe('Language Intelligence Phase 12 (VL-144)', () => {
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

    app.get(GatewayService).setDetectProviderForTests({
      name: 'fixture_detect',
      async detect() {
        return { language: 'en', confidence: 0.95, provider: 'fixture_detect' };
      },
    });

    const org = await seedOrg(prisma, 'li');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'li-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships ADR and docs', () => {
    expect(existsSync(join(root, 'docs/adr/0065-language-intelligence-phase-12.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/LANGUAGE_INTELLIGENCE.md'), 'utf8')).toContain('/analyze');
  });

  it('unit heuristics for sentiment intent readability', () => {
    expect(analyzeSentiment('This is great and wonderful').label).toBe('positive');
    expect(analyzeIntent('Can you please translate this?').label).toMatch(/question|request|translate/);
    expect(analyzeReadability('The cat sat on the mat. It was warm.').score).toBeGreaterThan(0);
  });

  it('exposes catalog with partial intent/sentiment and shipped readability', async () => {
    const res = await request(app.getHttpServer()).get('/v1/language-intelligence').expect(200);
    expect(res.body.product).toMatch(/Language Intelligence/i);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'intent' && c.status === 'partial',
      ),
    ).toBe(true);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'readability' && c.status === 'shipped',
      ),
    ).toBe(true);
  });

  it('analyzes text with language and signals', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/language-intelligence/analyze')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ text: 'Thank you! Please translate this into French.', includeDialect: false })
      .expect(200);
    expect(res.body.language).toBe('en');
    expect(res.body.sentiment.label).toBeTruthy();
    expect(res.body.intent.label).toBeTruthy();
    expect(res.body.readability.score).toBeGreaterThanOrEqual(0);
    expect(res.body.complexity.level).toMatch(/low|medium|high/);
  });

  it('scores translation and speech confidence', async () => {
    const mt = await request(app.getHttpServer())
      .post('/v1/language-intelligence/translation-confidence')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        sourceText: 'Hello world',
        targetText: 'Habari dunia',
        sourceLang: 'en',
        targetLang: 'sw',
      })
      .expect(200);
    expect(mt.body.score).toBeGreaterThan(50);
    expect(mt.body.confidence).toBeGreaterThan(0.5);

    const speech = await request(app.getHttpServer())
      .post('/v1/language-intelligence/speech-confidence')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ transcript: 'um hello there', durationSeconds: 2 })
      .expect(200);
    expect(speech.body.reasons).toEqual(expect.arrayContaining(['hesitation_markers']));
  });

  it('streams analyze SSE events', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/language-intelligence/analyze/stream')
      .set('Authorization', `Bearer ${rawKey}`)
      .set('Accept', 'text/event-stream')
      .send({ text: 'Hello, this is a short test.', includeDialect: false })
      .expect(200);
    const body = String(res.text);
    expect(body).toContain('event: language');
    expect(body).toContain('event: sentiment');
    expect(body).toContain('event: done');
  });

  it('returns analytics and GraphQL languageIntelligence', async () => {
    const analytics = await request(app.getHttpServer())
      .get('/v1/language-intelligence/analytics')
      .set('Authorization', `Bearer ${rawKey}`)
      .expect(200);
    expect(analytics.body.analyzes).toBeGreaterThan(0);

    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `mutation($input: AnalyzeLanguageInput!) {
          analyzeLanguage(input: $input) { language intentLabel sentimentLabel readabilityScore }
        }`,
        variables: { input: { text: 'I love this great product!', includeDialect: false } },
      })
      .expect(200);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.analyzeLanguage.language).toBe('en');
    expect(gql.body.data.analyzeLanguage.sentimentLabel).toBe('positive');
  });
});
