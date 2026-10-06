import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { KnowledgeFabricService } from '../src/knowledge-fabric/knowledge-fabric.service';
import { EventFabricBus } from '../src/event-fabric/event-fabric.bus';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkTsFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
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
              clerkUserId: `clerk_kf_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: [
          { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
          { name: 'Peer', defaultSourceLang: 'en', defaultTargetLang: 'fr' },
        ],
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Knowledge Fabric (VL-242)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let fabric: KnowledgeFabricService;
  let bus: EventFabricBus;

  beforeAll(async () => {
    process.env.EVENT_FABRIC_MEMORY = '1';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    fabric = app.get(KnowledgeFabricService);
    bus = app.get(EventFabricBus);
    bus.resetForTests();
    fabric.resetCounters();
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Knowledge Fabric honesty (extends Knowledge Cloud; not Confluence OS)', () => {
    const doc = join(root, 'docs/KNOWLEDGE_FABRIC.md');
    const adr = join(root, 'docs/adr/0144-knowledge-fabric.md');
    const phase = join(
      root,
      'docs/roadmap/volume10-ai-fabric/phases/phase_03_109_Knowledge_Fabric.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(phase)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-242');
    expect(text).toMatch(/Knowledge Cloud/i);
    expect(text).toMatch(/Confluence|SharePoint/i);
    expect(text).toMatch(/Neo4j/i);
    expect(text).toMatch(/hard gate|hard-gate/i);
  });

  it('has no TODO/FIXME/implement-later markers in Knowledge Fabric source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'knowledge-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes catalog, routes, router, and federation with honesty', async () => {
    const res = await request(app.getHttpServer()).get('/v1/knowledge-fabric/products').expect(200);
    expect(res.body.product).toBe('VerbaLab Knowledge Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.confluenceSharepointOs).toBe(false);
    expect(res.body.architecture.neo4jFederationOs).toBe(false);
    expect(res.body.architecture.regeneratesKnowledgeCloud).toBe(false);
    expect(res.body.architecture.extendsKnowledgeCloud).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.honesty.crossWorkspaceSameOrgOnly).toBe(true);
    expect(res.body.safety.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/KNOWLEDGE_FABRIC.md');
    expect(res.body.enterpriseSearch.product).toContain('Enterprise Search');

    const hub = res.body.products.find((p: { id: string }) => p.id === 'knowledge-fabric');
    expect(hub.status).toBe('shipped');

    const routes = await request(app.getHttpServer())
      .get('/v1/knowledge-fabric/routes')
      .expect(200);
    expect(routes.body.routes.length).toBeGreaterThanOrEqual(8);
    expect(routes.body.routes.some((r: { kind: string }) => r.kind === 'search')).toBe(true);

    const plan = await request(app.getHttpServer())
      .post('/v1/knowledge-fabric/route')
      .send({ kinds: ['search', 'rag', 'nope'] })
      .expect(200);
    expect(plan.body.plan.map((p: { kind: string }) => p.kind)).toEqual(
      expect.arrayContaining(['search', 'rag']),
    );
    expect(plan.body.missing).toContain('nope');

    const fed = await request(app.getHttpServer())
      .post('/v1/knowledge-fabric/federate')
      .send({ kinds: ['hub', 'search'] })
      .expect(200);
    expect(fed.body.federation.length).toBe(2);
    expect(fed.body.honesty.neo4jFederationOs).toBe(false);
  });

  it('distributes and syncs same-org peers with optional Event Fabric events', async () => {
    bus.resetForTests();
    fabric.resetCounters();
    const org = await seedOrg(prisma, `kf_${Date.now()}`);
    const primary = org.workspaces.find((w) => w.name === 'Default')!;
    const peer = org.workspaces.find((w) => w.name === 'Peer')!;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: primary.id,
      userId: org.memberships[0]!.userId,
      name: 'kf-key',
    });

    const dist = await request(app.getHttpServer())
      .post('/v1/knowledge-fabric/distribute')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kinds: ['hub', 'search'],
        publishEvent: true,
        topic: 'knowledge-fabric-test',
      })
      .expect(200);
    expect(dist.body.distribution.targets).toContain(peer.id);
    expect(dist.body.event.type).toBe('com.verbalab.knowledge.distributed');

    const sync = await request(app.getHttpServer())
      .post('/v1/knowledge-fabric/sync')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        targetWorkspaceId: peer.id,
        kinds: ['knowledge-base', 'documents'],
        publishEvent: true,
      })
      .expect(200);
    expect(sync.body.sync.targetWorkspaceId).toBe(peer.id);
    expect(sync.body.sync.cursor).toMatch(/^kf:/);
    expect(sync.body.event.type).toBe('com.verbalab.knowledge.synced');

    const bad = await request(app.getHttpServer())
      .post('/v1/knowledge-fabric/sync')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ targetWorkspaceId: 'ws_not_a_peer' })
      .expect(200);
    expect(bad.body.error).toBe('target_workspace_not_in_org_peers');

    const monitoring = await request(app.getHttpServer())
      .get('/v1/knowledge-fabric/monitoring')
      .expect(200);
    expect(monitoring.body.counters.distributions).toBeGreaterThan(0);
    expect(monitoring.body.counters.syncs).toBeGreaterThan(0);
    expect(monitoring.body.counters.eventPublishes).toBeGreaterThan(0);
  });

  it('exposes overview and GraphQL CQRS façades', async () => {
    const org = await seedOrg(prisma, `kf_ov_${Date.now()}`);
    const overview = await fabric.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_kf',
      role: 'owner',
    });
    expect(overview.deferred.promptFabric).toBe(false);
    expect(overview.deferred.reasoningFabric).toBe(false);
    expect(overview.deferred.policyFabric).toBe(false);
    expect(overview.deferred.crossOrgDataPlane).toBe(true);
    expect(overview.links.knowledgeFabric).toBe('/knowledge-fabric');
    expect(overview.honesty.extendsKnowledgeCloud).toBe(true);
    expect(overview.workspace.peerWorkspaces).toBeGreaterThanOrEqual(1);

    const caps = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ knowledgeFabricCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(caps.body.errors).toBeUndefined();
    expect(caps.body.data.knowledgeFabricCapabilities.length).toBeGreaterThan(5);

    const routes = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ knowledgeFabricRoutes { kind name target api cloud notes } }',
      })
      .expect(200);
    expect(routes.body.errors).toBeUndefined();
    expect(
      routes.body.data.knowledgeFabricRoutes.some((r: { kind: string }) => r.kind === 'rag'),
    ).toBe(true);
  });
});
