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
import { GatewayService } from '../src/gateway/gateway.service';
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
              clerkUserId: `clerk_ec_${name}_${Date.now()}_${Math.random()}`,
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

describe('Embedding Cloud', () => {
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

    app.get(GatewayService).setEmbeddingProviderForTests({
      name: 'fixture_embeddings',
      async embed(input) {
        const texts = Array.isArray(input.input) ? input.input : [input.input];
        return {
          data: texts.map((text, index) => ({
            index,
            embedding: [text.length, index, 0.25],
          })),
          model: input.model ?? 'fixture-embed',
          provider: 'fixture_embeddings',
          promptTokens: texts.length * 2,
          totalTokens: texts.length * 2,
          latencyMs: 2,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Embedding Cloud honesty', () => {
    const doc = join(root, 'docs/EMBEDDING_CLOUD.md');
    const adr = join(root, 'docs/adr/0092-embedding-cloud.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/deferred/i);
    expect(text).not.toMatch(/trains embedding models/i);
  });

  it('exposes engine with multimodalOs=false and speech deferred', async () => {
    const res = await request(app.getHttpServer()).get('/v1/embedding-cloud/engine').expect(200);
    expect(res.body.product).toContain('Embedding Cloud');
    expect(res.body.honesty.trainsEmbeddingModels).toBe(false);
    expect(res.body.honesty.multimodalOs).toBe(false);
    const speech = res.body.modalities.find((m: { id: string }) => m.id === 'speech');
    expect(speech.status).toBe('deferred');
    const text = res.body.modalities.find((m: { id: string }) => m.id === 'text');
    expect(text.status).toBe('shipped');

    const models = await request(app.getHttpServer()).get('/v1/embedding-cloud/models').expect(200);
    expect(models.body.models.some((m: { default: boolean }) => m.default)).toBe(true);
  });

  it('embeds text/code and rejects deferred modalities', async () => {
    const org = await seedOrg(prisma, 'ec');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ec-key',
    });

    const emb = await request(app.getHttpServer())
      .post('/v1/embedding-cloud/embed')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ input: 'Habari', modality: 'code' })
      .expect(200);

    expect(emb.body.modality).toBe('code');
    expect(emb.body.data[0].embedding).toEqual([6, 0, 0.25]);
    expect(emb.body.usage.total_tokens).toBe(2);

    const rejected = await request(app.getHttpServer())
      .post('/v1/embedding-cloud/embed')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ input: 'x', modality: 'image' });
    expect(rejected.status).toBe(400);
    expect(JSON.stringify(rejected.body)).toMatch(/deferred/i);

    const analytics = await request(app.getHttpServer())
      .get('/v1/embedding-cloud/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.requests).toBeGreaterThanOrEqual(1);
    expect(analytics.body.tokens).toBeGreaterThanOrEqual(2);
  });

  it('exposes embeddingCloudEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ embeddingCloudEngine { product trainsEmbeddingModels multimodalOs capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.embeddingCloudEngine.trainsEmbeddingModels).toBe(false);
    expect(res.body.data.embeddingCloudEngine.multimodalOs).toBe(false);
  });
});
