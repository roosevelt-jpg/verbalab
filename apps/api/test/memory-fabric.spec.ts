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
import { MemoryFabricService } from '../src/memory-fabric/memory-fabric.service';
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
              clerkUserId: `clerk_mf_${name}_${Date.now()}_${Math.random()}`,
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

describe('Memory Fabric', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let fabric: MemoryFabricService;
  let bus: EventFabricBus;
  const prevMode = process.env.LUGEMI_MEMORY_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.EVENT_FABRIC_MEMORY = '1';
    process.env.LUGEMI_MEMORY_RUNTIME_MODE = 'sandbox';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    fabric = app.get(MemoryFabricService);
    bus = app.get(EventFabricBus);
    bus.resetForTests();
    fabric.resetCounters();
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_MEMORY_RUNTIME_MODE;
    else process.env.LUGEMI_MEMORY_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Memory Fabric honesty (extends Memory Runtime; not Mem0 / replication OS)', () => {
    const doc = join(root, 'docs/MEMORY_FABRIC.md');
    const adr = join(root, 'docs/adr/0147-memory-fabric.md');
    const phase = join(
      root,
      'docs/roadmap/volume10-ai-fabric/phases/phase_06_112_Memory_Fabric.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(phase)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('');
    expect(text).toMatch(/Memory Runtime/i);
    expect(text).toMatch(/Mem0/i);
    expect(text).toMatch(/hard gate|hard-gate/i);
  });

  it('has no TODO/FIXME/implement-later markers in Memory Fabric source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'memory-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes catalog, routes, pipelines, cache, and federation with honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/memory-fabric/products')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Memory Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.mem0Os).toBe(false);
    expect(res.body.architecture.multiRegionReplicationOs).toBe(false);
    expect(res.body.architecture.regeneratesMemoryRuntime).toBe(false);
    expect(res.body.architecture.extendsMemoryRuntime).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.honesty.cacheViaIntelligentCache).toBe(true);
    expect(res.body.safety.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/MEMORY_FABRIC.md');
    expect(res.body.intelligentCache.product).toContain('Intelligent Cache');
    expect(res.body.pipelines.length).toBeGreaterThanOrEqual(2);

    const hub = res.body.products.find((p: { id: string }) => p.id === 'memory-fabric');
    expect(hub.status).toBe('shipped');

    const routes = await request(app.getHttpServer())
      .get('/v1/memory-fabric/routes')
      .expect(200);
    expect(routes.body.routes.some((r: { kind: string }) => r.kind === 'short_term')).toBe(true);

    const plan = await request(app.getHttpServer())
      .post('/v1/memory-fabric/route')
      .send({ kinds: ['short_term', 'sync', 'nope'] })
      .expect(200);
    expect(plan.body.plan.map((p: { kind: string }) => p.kind)).toEqual(
      expect.arrayContaining(['short_term', 'sync']),
    );
    expect(plan.body.missing).toContain('nope');

    const pipeline = await request(app.getHttpServer())
      .post('/v1/memory-fabric/pipeline')
      .send({ pipelineId: 'write-sync' })
      .expect(200);
    expect(pipeline.body.pipeline.steps).toEqual(['short_term', 'sync']);
    expect(pipeline.body.plan.length).toBe(2);

    const cache = await request(app.getHttpServer()).get('/v1/memory-fabric/cache').expect(200);
    expect(cache.body.cache.target).toBe('intelligent-cache');

    const fed = await request(app.getHttpServer())
      .post('/v1/memory-fabric/federate')
      .send({ kinds: ['cloud', 'workspace'] })
      .expect(200);
    expect(fed.body.federation.length).toBe(2);
  });

  it('distributes/replicates same-org peers and syncs via Runtime façade', async () => {
    bus.resetForTests();
    fabric.resetCounters();
    const org = await seedOrg(prisma, `mf_${Date.now()}`);
    const primary = org.workspaces.find((w) => w.name === 'Default')!;
    const peer = org.workspaces.find((w) => w.name === 'Peer')!;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: primary.id,
      userId: org.memberships[0]!.userId,
      name: 'mf-key',
    });

    const dist = await request(app.getHttpServer())
      .post('/v1/memory-fabric/distribute')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kinds: ['short_term', 'long_term'],
        publishEvent: true,
        topic: 'memory-fabric-test',
      })
      .expect(200);
    expect(dist.body.distribution.targets).toContain(peer.id);
    expect(dist.body.event.type).toBe('com.lugemi.memory.distributed');

    const replicate = await request(app.getHttpServer())
      .post('/v1/memory-fabric/replicate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(200);
    expect(replicate.body.replication.targets).toContain(peer.id);
    expect(replicate.body.honesty.multiRegionReplicationOs).toBe(false);

    const sync = await request(app.getHttpServer())
      .post('/v1/memory-fabric/sync')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(200);
    expect(typeof sync.body.synced).toBe('number');
    expect(sync.body.honesty.regeneratesMemoryRuntime).toBe(false);

    const monitoring = await request(app.getHttpServer())
      .get('/v1/memory-fabric/monitoring')
      .expect(200);
    expect(monitoring.body.counters.distributions).toBeGreaterThan(0);
    expect(monitoring.body.counters.syncs).toBeGreaterThan(0);
  });

  it('exposes overview and GraphQL CQRS façades', async () => {
    const org = await seedOrg(prisma, `mf_ov_${Date.now()}`);
    const overview = await fabric.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_mf',
      role: 'owner',
    });
    expect(overview.deferred.agentFabric).toBe(false);
    expect(overview.deferred.policyFabric).toBe(false);
    expect(overview.links.memoryFabric).toBe('/memory-fabric');
    expect(overview.honesty.extendsMemoryRuntime).toBe(true);

    const caps = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ memoryFabricCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(caps.body.errors).toBeUndefined();
    expect(caps.body.data.memoryFabricCapabilities.length).toBeGreaterThan(5);

    const routes = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ memoryFabricRoutes { kind name target api cloud notes } }',
      })
      .expect(200);
    expect(routes.body.errors).toBeUndefined();
    expect(
      routes.body.data.memoryFabricRoutes.some((r: { kind: string }) => r.kind === 'short_term'),
    ).toBe(true);
  });
});
