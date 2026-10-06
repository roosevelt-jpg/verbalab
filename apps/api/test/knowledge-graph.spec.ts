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
              clerkUserId: `clerk_kg_${name}_${Date.now()}_${Math.random()}`,
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

describe('Knowledge Graph Cloud', () => {
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

  it('documents Knowledge Graph honesty', () => {
    const doc = join(root, 'docs/KNOWLEDGE_GRAPH.md');
    const adr = join(root, 'docs/adr/0095-knowledge-graph-cloud.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/prefer/i);
    expect(text).toMatch(/RAG/i);
    expect(text).not.toMatch(/neo4j parity shipped/i);
  });

  it('exposes engine with neo4jParity=false and linked Ontology Platform', async () => {
    const res = await request(app.getHttpServer()).get('/v1/knowledge-graph/engine').expect(200);
    expect(res.body.product).toContain('Knowledge Graph');
    expect(res.body.honesty.neo4jParity).toBe(false);
    expect(res.body.honesty.ontologyPlatform).toBe(true);
    expect(res.body.honesty.ontologyOs).toBe(false);
    expect(res.body.honesty.preferRag).toBe(true);
    const ont = res.body.capabilities.find((c: { id: string }) => c.id === 'ontologies');
    expect(ont.status).toBe('partial');
    expect(ont.api).toContain('/v1/ontology/engine');
    const medical = res.body.capabilities.find((c: { id: string }) => c.id === 'medical-graph');
    expect(medical.status).toBe('deferred');

    const domains = await request(app.getHttpServer()).get('/v1/knowledge-graph/domains').expect(200);
    expect(domains.body.domains.find((d: { id: string }) => d.id === 'general').status).toBe(
      'shipped',
    );
  });

  it('creates entities/edges, rejects deferred domains, returns neighborhood', async () => {
    const org = await seedOrg(prisma, 'kg');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'kg-key',
    });

    const a = await request(app.getHttpServer())
      .post('/v1/knowledge-graph/entities')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'Lugemi', type: 'organization', domain: 'general' })
      .expect(201);
    expect(a.body.name).toBe('Lugemi');

    const b = await request(app.getHttpServer())
      .post('/v1/knowledge-graph/entities')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'Nairobi', type: 'place' })
      .expect(201);

    const rejected = await request(app.getHttpServer())
      .post('/v1/knowledge-graph/entities')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'Clinic', domain: 'medical' });
    expect(rejected.status).toBe(400);
    expect(JSON.stringify(rejected.body)).toMatch(/deferred/i);

    const edge = await request(app.getHttpServer())
      .post('/v1/knowledge-graph/relationships')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        fromEntityId: a.body.id,
        toEntityId: b.body.id,
        type: 'headquartered_in',
        label: 'HQ',
      })
      .expect(201);
    expect(edge.body.type).toBe('headquartered_in');

    const neighborhood = await request(app.getHttpServer())
      .get(`/v1/knowledge-graph/entities/${a.body.id}/neighborhood`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(neighborhood.body.neighbors.some((n: { id: string }) => n.id === b.body.id)).toBe(true);
    expect(neighborhood.body.relationships.length).toBeGreaterThanOrEqual(1);

    const analytics = await request(app.getHttpServer())
      .get('/v1/knowledge-graph/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.entities).toBeGreaterThanOrEqual(2);
    expect(analytics.body.relationships).toBeGreaterThanOrEqual(1);
  });

  it('exposes knowledgeGraphEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ knowledgeGraphEngine { product neo4jParity ontologyPlatform preferRag capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeGraphEngine.neo4jParity).toBe(false);
    expect(res.body.data.knowledgeGraphEngine.preferRag).toBe(true);
  });
});
