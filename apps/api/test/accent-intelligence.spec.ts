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
import { confidenceBand } from '../src/accents/accent-engine.catalog';

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
              clerkUserId: `clerk_acc_${name}_${Date.now}_${Math.random}`,
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

describe('Accent Intelligence',  => {
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

  it('documents Accent Intelligence honesty',  => {
    const doc = join(root, 'docs/ACCENT_INTELLIGENCE.md');
    const adr = join(root, 'docs/adr/0072-accent-intelligence.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Classification');
    expect(text).toContain('Dialect');
    expect(text).toMatch(/deferred/i);
    expect(text).not.toMatch(/acoustic regional models.*shipped/i);
  });

  it('exposes accent engine catalog with deferred regional models', async  => {
    const res = await request(app.getHttpServer).get('/v1/accents/engine').expect(200);
    expect(res.body.product).toContain('Accent');
    const ids = res.body.capabilities.map((c: { id: string }) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'accent-detection',
        'accent-classification',
        'dialect-detection',
        'regional-models',
        'accent-analytics',
      ]),
    );
    const regional = res.body.capabilities.find((c: { id: string }) => c.id === 'regional-models');
    expect(regional.status).toBe('deferred');
    const dialect = res.body.capabilities.find((c: { id: string }) => c.id === 'dialect-detection');
    expect(dialect.api).toContain('/v1/dialects/detect');
  });

  it('classifies accent with confidence band and analytics', async  => {
    const org = await seedOrg(prisma, 'acc');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'acc-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/accents/classify')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        language: 'en',
        text: 'How far na, I dey go market for Lagos abeg.',
      })
      .expect(200);

    expect(res.body.classification).toBeDefined;
    expect(res.body.classification.confidenceBand).toBeTruthy;
    expect(Array.isArray(res.body.classification.ranked)).toBe(true);
    expect(res.body.product).toBe('Accent Intelligence');

    const analytics = await request(app.getHttpServer)
      .get('/v1/accents/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);

    expect(analytics.body.classifies).toBeGreaterThanOrEqual(1);
    expect(analytics.body.registryProfiles).toBeGreaterThan(0);
  });

  it('exposes accentEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({ query: '{ accentEngine { product capabilities { id status } } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.accentEngine.product).toContain('Accent');
  });

  it('maps confidence bands',  => {
    expect(confidenceBand(0.8)).toBe('high');
    expect(confidenceBand(0.5)).toBe('medium');
    expect(confidenceBand(0.2)).toBe('low');
    expect(confidenceBand(0)).toBe('none');
  });
});
