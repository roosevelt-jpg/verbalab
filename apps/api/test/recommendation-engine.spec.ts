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
              clerkUserId: `clerk_rec_${name}_${Date.now()}_${Math.random()}`,
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

describe('Recommendation Engine', () => {
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

  it('documents Recommendation Engine honesty', () => {
    const doc = join(root, 'docs/RECOMMENDATION_ENGINE.md');
    const adr = join(root, 'docs/adr/0098-recommendation-engine.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/not.*retail recommender/i);
  });

  it('exposes engine with retailRecommenderOs=false', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/recommendation-engine/engine')
      .expect(200);
    expect(res.body.product).toContain('Recommendation Engine');
    expect(res.body.honesty.retailRecommenderOs).toBe(false);
    expect(res.body.honesty.collaborativeFiltering).toBe(false);
    expect(res.body.honesty.lightRankers).toBe(true);
    expect(res.body.honesty.trainsRankingModels).toBe(false);

    const kinds = await request(app.getHttpServer())
      .get('/v1/recommendation-engine/kinds')
      .expect(200);
    expect(kinds.body.kinds.some((k: { id: string }) => k.id === 'language')).toBe(true);
    expect(kinds.body.deferred).toContain('enterprise');
  });

  it('recommends languages/voices/workflows and rejects enterprise', async () => {
    const org = await seedOrg(prisma, 'rec');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'rec-key',
    });

    const langs = await request(app.getHttpServer())
      .post('/v1/recommendation-engine/recommend')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ kind: 'language', query: 'swahili', k: 5 })
      .expect(200);

    expect(langs.body.kind).toBe('language');
    expect(langs.body.items.length).toBeGreaterThan(0);
    expect(langs.body.honesty.retailRecommenderOs).toBe(false);
    expect(langs.body.items.some((i: { id: string }) => i.id === 'sw')).toBe(true);

    const voices = await request(app.getHttpServer())
      .post('/v1/recommendation-engine/recommend')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ kind: 'voice', query: 'female', k: 5 })
      .expect(200);
    expect(voices.body.kind).toBe('voice');
    expect(Array.isArray(voices.body.items)).toBe(true);

    const workflows = await request(app.getHttpServer())
      .post('/v1/recommendation-engine/recommend')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ kind: 'workflow', query: 'translate', k: 5 })
      .expect(200);
    expect(workflows.body.kind).toBe('workflow');
    expect(workflows.body.items.length).toBeGreaterThan(0);

    const enterprise = await request(app.getHttpServer())
      .post('/v1/recommendation-engine/recommend')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ kind: 'enterprise' });
    expect(enterprise.status).toBe(400);

    const analytics = await request(app.getHttpServer())
      .get('/v1/recommendation-engine/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.requests).toBeGreaterThanOrEqual(3);
  });

  it('exposes recommendationEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ recommendationEngine { product retailRecommenderOs collaborativeFiltering lightRankers capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.recommendationEngine.retailRecommenderOs).toBe(false);
    expect(res.body.data.recommendationEngine.lightRankers).toBe(true);
  });
});
