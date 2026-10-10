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
              clerkUserId: `clerk_kapis_${name}_${Date.now()}_${Math.random()}`,
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

describe('Enterprise Knowledge APIs', () => {
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

  it('documents Knowledge APIs honesty (not gRPC/Kafka/SDK-generator OS)', () => {
    const doc = join(root, 'docs/KNOWLEDGE_APIS.md');
    const adr = join(root, 'docs/adr/0112-enterprise-knowledge-apis.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/gRPC/i);
    expect(text).toMatch(/Kafka/i);
    expect(text).toMatch(/SDK generator|sdkGenerator/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
  });

  it('exposes engine with honest flags + public catalogs', async () => {
    const res = await request(app.getHttpServer()).get('/v1/knowledge-apis/engine').expect(200);
    expect(res.body.product).toContain('Knowledge APIs');
    expect(res.body.honesty.grpcOs).toBe(false);
    expect(res.body.honesty.kafkaEventStreamingOs).toBe(false);
    expect(res.body.honesty.sdkGeneratorOs).toBe(false);
    expect(res.body.honesty.extendsExistingKnowledgeApis).toBe(true);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);

    const gql = await request(app.getHttpServer()).get('/v1/knowledge-apis/graphql').expect(200);
    expect(gql.body.queries.some((q: { name: string }) => q.name === 'enterpriseRagEngine')).toBe(
      true,
    );

    const openapi = await request(app.getHttpServer()).get('/v1/knowledge-apis/openapi').expect(200);
    expect(openapi.body.document).toBe('/v1/openapi.json');
    expect(openapi.body.knowledgePaths.length).toBeGreaterThan(5);

    const sdk = await request(app.getHttpServer()).get('/v1/knowledge-apis/sdk').expect(200);
    expect(sdk.body.methods).toContain('knowledgeApisEngine');
    expect(sdk.body.honesty.sdkGeneratorOs).toBe(false);

    const webhooks = await request(app.getHttpServer()).get('/v1/knowledge-apis/webhooks').expect(200);
    expect(webhooks.body.events.length).toBeGreaterThan(0);
    expect(webhooks.body.honesty.kafkaEventStreamingOs).toBe(false);
  });

  it('lists surfaces and streams SSE audit tails', async () => {
    const org = await seedOrg(prisma, 'kapis');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'kapis-key',
    });

    const surfaces = await request(app.getHttpServer())
      .get('/v1/knowledge-apis/surfaces')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(surfaces.body.surfaces.some((s: { product: string }) => s.product === 'enterprise-rag')).toBe(
      true,
    );
    expect(
      surfaces.body.surfaces.some((s: { product: string }) => s.product === 'knowledge-intelligence'),
    ).toBe(true);

    const stream = await request(app.getHttpServer())
      .get('/v1/knowledge-apis/events/stream')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(stream.headers['content-type']).toMatch(/text\/event-stream/);
    expect(stream.text).toContain('event: meta');
    expect(stream.text).toContain('event: done');
    expect(stream.text).toContain('kafkaEventStreamingOs');

    const analytics = await request(app.getHttpServer())
      .get('/v1/knowledge-apis/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.surfaceCount).toBeGreaterThanOrEqual(8);
    expect(analytics.body.surfacesViewsLast30d).toBeGreaterThanOrEqual(1);
  });

  it('exposes knowledgeApisEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ knowledgeApisEngine { product grpcOs kafkaEventStreamingOs sdkGeneratorOs extendsExistingKnowledgeApis orgWorkspaceScoped capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeApisEngine.grpcOs).toBe(false);
    expect(res.body.data.knowledgeApisEngine.kafkaEventStreamingOs).toBe(false);
    expect(res.body.data.knowledgeApisEngine.sdkGeneratorOs).toBe(false);
    expect(res.body.data.knowledgeApisEngine.extendsExistingKnowledgeApis).toBe(true);
  });
});
