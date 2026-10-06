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
              clerkUserId: `clerk_tax_${name}_${Date.now}_${Math.random}`,
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

describe('Taxonomy Platform',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async  => {
    storageDir = await mkdtemp(join(tmpdir, 'lugemi-tax-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

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

  afterAll(async  => {
    await app.close;
    await rm(storageDir, { recursive: true, force: true });
  });

  it('documents Taxonomy honesty (not enterprise taxonomy OS)',  => {
    const doc = join(root, 'docs/TAXONOMY_PLATFORM.md');
    const adr = join(root, 'docs/adr/0108-taxonomy-platform.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/enterprise taxonomy OS/i);
    expect(text).toMatch(/Ontology/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
  });

  it('exposes engine with honest flags', async  => {
    const res = await request(app.getHttpServer).get('/v1/taxonomy/engine').expect(200);
    expect(res.body.product).toContain('Taxonomy');
    expect(res.body.honesty.enterpriseTaxonomyOs).toBe(false);
    expect(res.body.honesty.mlAutoClassification).toBe(false);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);
    expect(res.body.honesty.distinctFromOntology).toBe(true);

    const kinds = await request(app.getHttpServer)
      .get('/v1/taxonomy/content-types')
      .expect(200);
    expect(kinds.body.kinds.some((k: { id: string }) => k.id === 'markdown')).toBe(true);
  });

  it('creates trees, assigns to documents, and heuristic classifies', async  => {
    const org = await seedOrg(prisma, 'tax');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'tax-key',
    });

    const root = await request(app.getHttpServer)
      .post('/v1/taxonomy/terms')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'Policies', kind: 'category' })
      .expect(201);
    expect(root.body.slug).toBe('policies');

    const child = await request(app.getHttpServer)
      .post('/v1/taxonomy/terms')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'HR', kind: 'category', parentId: root.body.id })
      .expect(201);

    const tag = await request(app.getHttpServer)
      .post('/v1/taxonomy/terms')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'leave-policy', kind: 'tag' })
      .expect(201);

    const trees = await request(app.getHttpServer)
      .get('/v1/taxonomy/trees')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    const policies = trees.body.trees.find((t: { id: string }) => t.id === root.body.id);
    expect(policies.children.some((c: { id: string }) => c.id === child.body.id)).toBe(true);

    const uploaded = await request(app.getHttpServer)
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', Buffer.from('# Leave policy\n\nVacation days.'), 'leave-policy.md')
      .expect(201);

    await request(app.getHttpServer)
      .post('/v1/taxonomy/assign')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ termId: child.body.id, documentId: uploaded.body.id })
      .expect(201);

    const doc = await request(app.getHttpServer)
      .get(`/v1/knowledge/documents/${uploaded.body.id}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(doc.body.collection).toBe('hr');

    const classified = await request(app.getHttpServer)
      .post('/v1/taxonomy/classify')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ documentId: uploaded.body.id, apply: true })
      .expect(200);
    expect(classified.body.honesty.mlAutoClassification).toBe(false);
    expect(classified.body.matches.some((m: { id: string }) => m.id === tag.body.id)).toBe(true);

    const analytics = await request(app.getHttpServer)
      .get('/v1/taxonomy/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.terms).toBeGreaterThanOrEqual(3);
    expect(analytics.body.assignments).toBeGreaterThanOrEqual(1);
  });

  it('exposes taxonomyEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ taxonomyEngine { product enterpriseTaxonomyOs mlAutoClassification orgWorkspaceScoped capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.taxonomyEngine.enterpriseTaxonomyOs).toBe(false);
    expect(res.body.data.taxonomyEngine.mlAutoClassification).toBe(false);
    expect(res.body.data.taxonomyEngine.orgWorkspaceScoped).toBe(true);
  });
});
