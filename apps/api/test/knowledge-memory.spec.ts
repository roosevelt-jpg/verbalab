import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');

function fakeEmbedding(seed: number): number[] {
  return Array.from({ length: 1536 }, (_, i) => Math.sin((seed + 1) * (i + 1) * 0.01) * 0.1);
}

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_km_${name}_${Date.now()}_${Math.random()}`,
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

describe('Knowledge Memory (VL-199)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'lugemi-km-'));
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

  it('documents Knowledge Memory honesty (not Mem0 OS; distinct from Memory Cloud)', () => {
    const doc = join(root, 'docs/KNOWLEDGE_MEMORY.md');
    const adr = join(root, 'docs/adr/0110-knowledge-memory.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/Mem0|Zep/i);
    expect(text).toMatch(/Memory Cloud/i);
    expect(text).toMatch(/VL-183/);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
  });

  it('exposes engine with honest flags', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/knowledge-memory/engine')
      .expect(200);
    expect(res.body.product).toContain('Knowledge Memory');
    expect(res.body.honesty.mem0Os).toBe(false);
    expect(res.body.honesty.regeneratesMemoryCloud).toBe(false);
    expect(res.body.honesty.extendsVl183).toBe(true);
    expect(res.body.honesty.distinctFromMemoryCloud).toBe(true);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);

    const scopes = await request(app.getHttpServer())
      .get('/v1/knowledge-memory/scopes')
      .expect(200);
    expect(scopes.body.scopes.some((s: { id: string }) => s.id === 'user')).toBe(true);
    expect(scopes.body.layer).toBe('knowledge');
  });

  it('creates, evolves, versions, and links to knowledge documents', async () => {
    const org = await seedOrg(prisma, 'km');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'km-key',
    });

    const doc = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', Buffer.from('# HQ\n\nLugemi HQ is in Nairobi.'), 'hq.md')
      .expect(201);

    const created = await request(app.getHttpServer())
      .post('/v1/knowledge-memory/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        scope: 'workspace',
        content: 'Company HQ city is Nairobi.',
        documentId: doc.body.id,
      })
      .expect(201);
    expect(created.body.layer).toBe('knowledge');
    expect(created.body.scope).toBe('workspace');
    expect(created.body.documentId).toBe(doc.body.id);
    expect(created.body.version).toBe(1);

    const userMem = await request(app.getHttpServer())
      .post('/v1/knowledge-memory/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        scope: 'user',
        subjectUserId: org.memberships[0]!.userId,
        content: 'Prefers Swahili glossaries for HQ docs.',
      })
      .expect(201);
    expect(userMem.body.scope).toBe('user');
    expect(userMem.body.subjectUserId).toBe(org.memberships[0]!.userId);

    const evolved = await request(app.getHttpServer())
      .post(`/v1/knowledge-memory/memories/${created.body.id}/evolve`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        content: 'Company HQ city is Nairobi, Kenya.',
        reason: 'add country',
      })
      .expect(200);
    expect(evolved.body.version).toBe(2);
    expect(evolved.body.evolutionCount).toBe(1);
    expect(evolved.body.content).toContain('Kenya');

    const versions = await request(app.getHttpServer())
      .get(`/v1/knowledge-memory/memories/${created.body.id}/versions`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(versions.body.currentVersion).toBe(2);
    expect(versions.body.history).toHaveLength(1);
    expect(versions.body.history[0].content).toContain('Nairobi');
    expect(versions.body.history[0].reason).toBe('add country');

    const search = await request(app.getHttpServer())
      .post('/v1/knowledge-memory/search')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'Nairobi' })
      .expect(200);
    expect(search.body.hits.some((h: { id: string }) => h.id === created.body.id)).toBe(true);

    // Plain Memory Cloud rows without layer=knowledge must not appear.
    await request(app.getHttpServer())
      .post('/v1/memory-cloud/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ scope: 'workspace', kind: 'long_term', content: 'Intelligence-only memory row.' })
      .expect(201);

    const listed = await request(app.getHttpServer())
      .get('/v1/knowledge-memory/memories')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(listed.body.data.every((m: { layer: string }) => m.layer === 'knowledge')).toBe(true);
    expect(
      listed.body.data.some((m: { content: string }) => m.content.includes('Intelligence-only')),
    ).toBe(false);

    const analytics = await request(app.getHttpServer())
      .get('/v1/knowledge-memory/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.active).toBeGreaterThanOrEqual(2);
    expect(analytics.body.withDocument).toBeGreaterThanOrEqual(1);
    expect(analytics.body.evolved).toBeGreaterThanOrEqual(1);
  });

  it('exposes knowledgeMemoryEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ knowledgeMemoryEngine { product mem0Os regeneratesMemoryCloud extendsVl183 distinctFromMemoryCloud orgWorkspaceScoped capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeMemoryEngine.mem0Os).toBe(false);
    expect(res.body.data.knowledgeMemoryEngine.regeneratesMemoryCloud).toBe(false);
    expect(res.body.data.knowledgeMemoryEngine.extendsVl183).toBe(true);
    expect(res.body.data.knowledgeMemoryEngine.distinctFromMemoryCloud).toBe(true);
  });
});
