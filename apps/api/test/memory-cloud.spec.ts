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
              clerkUserId: `clerk_mc_${name}_${Date.now()}_${Math.random()}`,
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

describe('Memory Cloud', () => {
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

  it('documents Memory Cloud honesty + GDPR', () => {
    const doc = join(root, 'docs/MEMORY_CLOUD.md');
    const adr = join(root, 'docs/adr/0094-memory-cloud.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/GDPR/i);
    expect(text).toMatch(/erase/i);
    expect(text).not.toMatch(/infinite personalization OS shipped/i);
  });

  it('exposes engine with gdpr flags and no infinite personalization OS', async () => {
    const res = await request(app.getHttpServer()).get('/v1/memory-cloud/engine').expect(200);
    expect(res.body.product).toContain('Memory Cloud');
    expect(res.body.honesty.gdprExport).toBe(true);
    expect(res.body.honesty.gdprErase).toBe(true);
    expect(res.body.honesty.infinitePersonalizationOs).toBe(false);
    expect(res.body.honesty.automatedRetentionSweeper).toBe(false);

    const scopes = await request(app.getHttpServer()).get('/v1/memory-cloud/scopes').expect(200);
    expect(scopes.body.scopes.some((s: { id: string }) => s.id === 'workspace')).toBe(true);
  });

  it('creates, searches, exports, and erases memories (GDPR path)', async () => {
    const org = await seedOrg(prisma, 'mc');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'mc-key',
    });

    const created = await request(app.getHttpServer())
      .post('/v1/memory-cloud/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        scope: 'workspace',
        kind: 'long_term',
        content: 'User prefers Swahili greetings.',
        subjectUserId: org.memberships[0]!.userId,
      })
      .expect(201);

    expect(created.body.content).toMatch(/Swahili/);
    expect(created.body.version).toBe(1);

    const revised = await request(app.getHttpServer())
      .post(`/v1/memory-cloud/memories/${created.body.id}/revise`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ content: 'User prefers Swahili greetings and formal tone.' })
      .expect(200);
    expect(revised.body.version).toBe(2);

    const search = await request(app.getHttpServer())
      .post('/v1/memory-cloud/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'Swahili' })
      .expect(200);
    expect(search.body.hits.length).toBeGreaterThanOrEqual(1);

    const exported = await request(app.getHttpServer())
      .post('/v1/memory-cloud/export')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ subjectUserId: org.memberships[0]!.userId })
      .expect(200);
    expect(exported.body.count).toBeGreaterThanOrEqual(1);

    const badErase = await request(app.getHttpServer())
      .post('/v1/memory-cloud/erase')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ confirm: false });
    expect(badErase.status).toBe(400);

    const erased = await request(app.getHttpServer())
      .post('/v1/memory-cloud/erase')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ subjectUserId: org.memberships[0]!.userId, confirm: true })
      .expect(200);
    expect(erased.body.erased).toBe(true);
    expect(erased.body.count).toBeGreaterThanOrEqual(1);

    const remaining = await request(app.getHttpServer())
      .get('/v1/memory-cloud/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(remaining.body.data.length).toBe(0);

    const analytics = await request(app.getHttpServer())
      .get('/v1/memory-cloud/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.writes).toBeGreaterThanOrEqual(1);
    expect(analytics.body.exports).toBeGreaterThanOrEqual(1);
    expect(analytics.body.erases).toBeGreaterThanOrEqual(1);
  });

  it('exposes memoryCloudEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ memoryCloudEngine { product infinitePersonalizationOs gdprExport gdprErase capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.memoryCloudEngine.gdprExport).toBe(true);
    expect(res.body.data.memoryCloudEngine.gdprErase).toBe(true);
    expect(res.body.data.memoryCloudEngine.infinitePersonalizationOs).toBe(false);
  });
});
