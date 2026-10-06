import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
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
              clerkUserId: `clerk_vc_${name}_${Date.now()}_${Math.random()}`,
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

function fakeEmbedding(seed: number): number[] {
  return Array.from({ length: 1536 }, (_, i) => Math.sin((seed + 1) * (i + 1) * 0.01) * 0.1);
}

describe('Vector Cloud', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'lugemi-vc-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

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
            embedding: fakeEmbedding(text.length + index),
          })),
          model: 'fixture-embed',
          provider: 'fixture_embeddings',
          promptTokens: texts.length * 2,
          totalTokens: texts.length * 2,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('documents Vector Cloud honesty', () => {
    const doc = join(root, 'docs/VECTOR_CLOUD.md');
    const adr = join(root, 'docs/adr/0093-vector-cloud.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/deferred/i);
    expect(text).toContain('');
    expect(text).not.toMatch(/pinecone parity shipped/i);
  });

  it('exposes engine with managedVectorDbOs=false and hybrid deferred', async () => {
    const res = await request(app.getHttpServer()).get('/v1/vector-cloud/engine').expect(200);
    expect(res.body.product).toContain('Vector Cloud');
    expect(res.body.honesty.managedVectorDbOs).toBe(false);
    expect(res.body.honesty.pineconeParity).toBe(false);
    expect(res.body.honesty.hybridBm25).toBe(false);
    const hybrid = res.body.capabilities.find((c: { id: string }) => c.id === 'hybrid-search');
    expect(hybrid.status).toBe('deferred');
    const semantic = res.body.capabilities.find((c: { id: string }) => c.id === 'semantic-search');
    expect(semantic.status).toBe('shipped');

    const indexes = await request(app.getHttpServer()).get('/v1/vector-cloud/indexes').expect(200);
    expect(indexes.body.indexes[0].type).toBe('hnsw');
  });

  it('searches vectors after knowledge ingest and reports analytics', async () => {
    const org = await seedOrg(prisma, 'vc');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'vc-key',
    });

    const body = Buffer.from(
      'Lugemi headquarters is located in Nairobi, Kenya. The platform focuses on African language intelligence.',
      'utf8',
    );

    const upload = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', body, 'hq.txt')
      .expect(201);
    expect(upload.body.status).toBe('ready');

    const cols = await request(app.getHttpServer())
      .get('/v1/vector-cloud/collections')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(cols.body.collections[0].id).toBe('knowledge');
    expect(cols.body.collections[0].vectorCount).toBeGreaterThanOrEqual(1);

    const search = await request(app.getHttpServer())
      .post('/v1/vector-cloud/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'Where is Lugemi HQ?', k: 3 })
      .expect(200);

    expect(search.body.collection).toBe('knowledge');
    expect(search.body.backend).toBe('pgvector');
    expect(search.body.hits.length).toBeGreaterThanOrEqual(1);
    expect(search.body.hits[0].filename).toBe('hq.txt');
    expect(search.body.hits[0].content).toMatch(/Nairobi/i);

    const filtered = await request(app.getHttpServer())
      .post('/v1/vector-cloud/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'Nairobi', documentId: upload.body.id, k: 3 })
      .expect(200);
    expect(filtered.body.hits.every((h: { documentId: string }) => h.documentId === upload.body.id)).toBe(
      true,
    );

    const empty = await request(app.getHttpServer())
      .post('/v1/vector-cloud/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: ' ' });
    expect(empty.status).toBe(400);

    const analytics = await request(app.getHttpServer())
      .get('/v1/vector-cloud/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.searchRequests).toBeGreaterThanOrEqual(1);
    expect(analytics.body.vectors).toBeGreaterThanOrEqual(1);
  });

  it('exposes vectorCloudEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ vectorCloudEngine { product managedVectorDbOs pineconeParity hybridBm25 capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.vectorCloudEngine.managedVectorDbOs).toBe(false);
    expect(res.body.data.vectorCloudEngine.pineconeParity).toBe(false);
    expect(res.body.data.vectorCloudEngine.hybridBm25).toBe(false);
  });
});
