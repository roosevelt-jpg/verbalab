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
              clerkUserId: `clerk_ekb_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: [
          { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
          { name: 'Other', defaultSourceLang: 'en', defaultTargetLang: 'yo' },
        ],
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Enterprise Knowledge Base', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'lugemi-ekb-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const gateway = app.get(GatewayService);
    gateway.setEmbeddingProviderForTests({
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

  it('documents EKB honesty (not Confluence OS) + tenant scoping', () => {
    const doc = join(root, 'docs/ENTERPRISE_KNOWLEDGE_BASE.md');
    const adr = join(root, 'docs/adr/0105-enterprise-knowledge-base.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/org\/workspace/i);
    expect(text).toMatch(/Confluence/i);
    expect(text).toContain('');
  });

  it('exposes engine with honest flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/knowledge-base/engine').expect(200);
    expect(res.body.product).toContain('Knowledge Base');
    expect(res.body.honesty.confluenceOs).toBe(false);
    expect(res.body.honesty.sharePointParity).toBe(false);
    expect(res.body.honesty.approvalWorkflow).toBe(false);
    expect(res.body.honesty.multimodalMediaIngest).toBe(false);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);
    expect(res.body.honesty.extendsVl062).toBe(true);
    expect(res.body.honesty.regeneratesVl062).toBe(false);

    const kinds = await request(app.getHttpServer())
      .get('/v1/knowledge-base/content-kinds')
      .expect(200);
    expect(kinds.body.kinds.some((k: { id: string }) => k.id === 'markdown')).toBe(true);
    expect(kinds.body.deferred).toEqual(expect.arrayContaining(['image', 'video', 'audio']));
  });

  it('scopes documents to workspace and supports collection/tags/revise-meta', async () => {
    const org = await seedOrg(prisma, 'ekb');
    const wsA = org.workspaces[0]!;
    const wsB = org.workspaces[1]!;
    const keyA = await apiKeys.create({
      organizationId: org.id,
      workspaceId: wsA.id,
      userId: org.memberships[0]!.userId,
      name: 'ekb-a',
    });
    const keyB = await apiKeys.create({
      organizationId: org.id,
      workspaceId: wsB.id,
      userId: org.memberships[0]!.userId,
      name: 'ekb-b',
    });

    const uploaded = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${keyA.secret}`)
      .field('collection', 'policies')
      .field('tags', 'hr,africa')
      .field('contentKind', 'policy')
      .attach('file', Buffer.from('# Leave policy\n\nEmployees get 20 days.'), 'leave-policy.md')
      .expect(201);

    expect(uploaded.body.collection).toBe('policies');
    expect(uploaded.body.tags).toEqual(expect.arrayContaining(['hr', 'africa']));
    expect(uploaded.body.contentKind).toBe('policy');
    expect(uploaded.body.version).toBe(1);

    const listedA = await request(app.getHttpServer())
      .get('/v1/knowledge-base/documents')
      .query({ collection: 'policies', tag: 'hr' })
      .set('Authorization', `Bearer ${keyA.secret}`)
      .expect(200);
    expect(listedA.body.data.some((d: { id: string }) => d.id === uploaded.body.id)).toBe(true);

    await request(app.getHttpServer())
      .get(`/v1/knowledge/documents/${uploaded.body.id}`)
      .set('Authorization', `Bearer ${keyB.secret}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/v1/knowledge-base/documents/${uploaded.body.id}`)
      .set('Authorization', `Bearer ${keyB.secret}`)
      .expect(404);

    const revised = await request(app.getHttpServer())
      .post(`/v1/knowledge-base/documents/${uploaded.body.id}/revise-meta`)
      .set('Authorization', `Bearer ${keyA.secret}`)
      .send({ tags: ['hr', 'updated'], collection: 'policies-v2' })
      .expect(200);
    expect(revised.body.version).toBe(2);
    expect(revised.body.collection).toBe('policies-v2');
    expect(revised.body.tags).toEqual(expect.arrayContaining(['hr', 'updated']));

    const collections = await request(app.getHttpServer())
      .get('/v1/knowledge-base/collections')
      .set('Authorization', `Bearer ${keyA.secret}`)
      .expect(200);
    expect(collections.body.collections.some((c: { id: string }) => c.id === 'policies-v2')).toBe(
      true,
    );

    const analytics = await request(app.getHttpServer())
      .get('/v1/knowledge-base/analytics')
      .set('Authorization', `Bearer ${keyA.secret}`)
      .expect(200);
    expect(analytics.body.documents).toBeGreaterThanOrEqual(1);
  });

  it('exposes knowledgeBaseEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ knowledgeBaseEngine { product confluenceOs orgWorkspaceScoped extendsVl062 capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeBaseEngine.confluenceOs).toBe(false);
    expect(res.body.data.knowledgeBaseEngine.orgWorkspaceScoped).toBe(true);
    expect(res.body.data.knowledgeBaseEngine.extendsVl062).toBe(true);
    expect(res.body.data.knowledgeBaseEngine.capabilities.length).toBeGreaterThan(3);
  });
});
