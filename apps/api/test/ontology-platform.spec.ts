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
              clerkUserId: `clerk_ont_${name}_${Date.now()}_${Math.random()}`,
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

describe('Ontology Platform', () => {
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

  it('documents Ontology honesty (not OWL/Protege OS)', () => {
    const doc = join(root, 'docs/ONTOLOGY_PLATFORM.md');
    const adr = join(root, 'docs/adr/0107-ontology-platform.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/OWL/i);
    expect(text).toContain('');
    expect(text).toMatch(/org\/workspace/i);
  });

  it('exposes engine with honest flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ontology/engine').expect(200);
    expect(res.body.product).toContain('Ontology');
    expect(res.body.honesty.owlOs).toBe(false);
    expect(res.body.honesty.protegeParity).toBe(false);
    expect(res.body.honesty.rdfTripleStore).toBe(false);
    expect(res.body.honesty.certifiedVerticalOntologies).toBe(false);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);
    expect(res.body.honesty.extendsVl184).toBe(true);

    const domains = await request(app.getHttpServer()).get('/v1/ontology/domains').expect(200);
    expect(domains.body.domains.find((d: { id: string }) => d.id === 'general').status).toBe(
      'shipped',
    );
    expect(domains.body.domains.find((d: { id: string }) => d.id === 'medical').status).toBe(
      'deferred',
    );
  });

  it('creates concepts, hierarchy, synonyms, and labels (workspace scoped)', async () => {
    const org = await seedOrg(prisma, 'ont');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ont-key',
    });

    const parent = await request(app.getHttpServer())
      .post('/v1/ontology/concepts')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'Animal', domain: 'general', labels: { en: 'Animal', sw: 'Mnyama' } })
      .expect(201);
    expect(parent.body.type).toBe('concept');
    expect(parent.body.metadata.labels.en).toBe('Animal');

    const child = await request(app.getHttpServer())
      .post('/v1/ontology/concepts')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'Dog', domain: 'general' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/ontology/hierarchies')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ parentId: parent.body.id, childId: child.body.id })
      .expect(201);

    const children = await request(app.getHttpServer())
      .get(`/v1/ontology/concepts/${parent.body.id}/children`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(children.body.children.some((c: { id: string }) => c.id === child.body.id)).toBe(true);

    const syn = await request(app.getHttpServer())
      .post('/v1/ontology/synonyms')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ conceptId: child.body.id, synonym: 'canine' })
      .expect(201);
    expect(syn.body.concept.aliases).toEqual(expect.arrayContaining(['canine']));

    await request(app.getHttpServer())
      .post(`/v1/ontology/concepts/${child.body.id}/labels`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ labels: { fr: 'Chien' } })
      .expect(200);

    const analytics = await request(app.getHttpServer())
      .get('/v1/ontology/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.concepts).toBeGreaterThanOrEqual(2);
    expect(analytics.body.hierarchyEdges).toBeGreaterThanOrEqual(1);
  });

  it('exposes ontologyEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ ontologyEngine { product owlOs orgWorkspaceScoped extendsVl184 capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.ontologyEngine.owlOs).toBe(false);
    expect(res.body.data.ontologyEngine.orgWorkspaceScoped).toBe(true);
    expect(res.body.data.ontologyEngine.capabilities.length).toBeGreaterThan(3);
  });
});
