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
import { ReasoningFabricService } from '../src/reasoning-fabric/reasoning-fabric.service';
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
              clerkUserId: `clerk_rf_${name}_${Date.now()}_${Math.random()}`,
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

describe('Reasoning Fabric (VL-244)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let fabric: ReasoningFabricService;
  let bus: EventFabricBus;
  const prevMode = process.env.VERBALAB_REASONING_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.EVENT_FABRIC_MEMORY = '1';
    process.env.VERBALAB_REASONING_RUNTIME_MODE = 'sandbox';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    fabric = app.get(ReasoningFabricService);
    bus = app.get(EventFabricBus);
    bus.resetForTests();
    fabric.resetCounters();
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.VERBALAB_REASONING_RUNTIME_MODE;
    else process.env.VERBALAB_REASONING_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Reasoning Fabric honesty (extends Reasoning Runtime; not custom reasoner OS)', () => {
    const doc = join(root, 'docs/REASONING_FABRIC.md');
    const adr = join(root, 'docs/adr/0146-reasoning-fabric.md');
    const phase = join(
      root,
      'docs/roadmap/volume10-ai-fabric/phases/phase_05_111_Reasoning_Fabric.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(phase)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-244');
    expect(text).toMatch(/Reasoning Runtime/i);
    expect(text).toMatch(/custom reasoner/i);
    expect(text).toMatch(/hard gate|hard-gate/i);
  });

  it('has no TODO/FIXME/implement-later markers in Reasoning Fabric source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'reasoning-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes catalog, routes, pipelines, cache, and federation with honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/reasoning-fabric/products')
      .expect(200);
    expect(res.body.product).toBe('VerbaLab Reasoning Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.customReasonerOs).toBe(false);
    expect(res.body.architecture.regeneratesReasoningRuntime).toBe(false);
    expect(res.body.architecture.extendsReasoningRuntime).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.honesty.cacheViaIntelligentCache).toBe(true);
    expect(res.body.safety.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/REASONING_FABRIC.md');
    expect(res.body.intelligentCache.product).toContain('Intelligent Cache');
    expect(res.body.pipelines.length).toBeGreaterThanOrEqual(2);

    const hub = res.body.products.find((p: { id: string }) => p.id === 'reasoning-fabric');
    expect(hub.status).toBe('shipped');

    const routes = await request(app.getHttpServer())
      .get('/v1/reasoning-fabric/routes')
      .expect(200);
    expect(routes.body.routes.some((r: { kind: string }) => r.kind === 'reason')).toBe(true);

    const plan = await request(app.getHttpServer())
      .post('/v1/reasoning-fabric/route')
      .send({ kinds: ['plan', 'reason', 'nope'] })
      .expect(200);
    expect(plan.body.plan.map((p: { kind: string }) => p.kind)).toEqual(
      expect.arrayContaining(['plan', 'reason']),
    );
    expect(plan.body.missing).toContain('nope');

    const pipeline = await request(app.getHttpServer())
      .post('/v1/reasoning-fabric/pipeline')
      .send({ pipelineId: 'plan-reason-evaluate' })
      .expect(200);
    expect(pipeline.body.pipeline.steps).toEqual(['plan', 'reason', 'evaluate']);
    expect(pipeline.body.plan.length).toBe(3);

    const cache = await request(app.getHttpServer()).get('/v1/reasoning-fabric/cache').expect(200);
    expect(cache.body.cache.target).toBe('intelligent-cache');

    const fed = await request(app.getHttpServer())
      .post('/v1/reasoning-fabric/federate')
      .send({ kinds: ['cloud', 'history'] })
      .expect(200);
    expect(fed.body.federation.length).toBe(2);
  });

  it('distributes same-org peers and lists empty history via Runtime façade', async () => {
    bus.resetForTests();
    fabric.resetCounters();
    const org = await seedOrg(prisma, `rf_${Date.now()}`);
    const primary = org.workspaces.find((w) => w.name === 'Default')!;
    const peer = org.workspaces.find((w) => w.name === 'Peer')!;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: primary.id,
      userId: org.memberships[0]!.userId,
      name: 'rf-key',
    });

    const dist = await request(app.getHttpServer())
      .post('/v1/reasoning-fabric/distribute')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kinds: ['plan', 'reason'],
        publishEvent: true,
        topic: 'reasoning-fabric-test',
      })
      .expect(200);
    expect(dist.body.distribution.targets).toContain(peer.id);
    expect(dist.body.event.type).toBe('com.verbalab.reasoning.distributed');

    const history = await request(app.getHttpServer())
      .get('/v1/reasoning-fabric/history')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(Array.isArray(history.body.runs)).toBe(true);
    expect(history.body.honesty.regeneratesReasoningRuntime).toBe(false);

    const monitoring = await request(app.getHttpServer())
      .get('/v1/reasoning-fabric/monitoring')
      .expect(200);
    expect(monitoring.body.counters.distributions).toBeGreaterThan(0);
    expect(monitoring.body.counters.pipelines).toBeGreaterThanOrEqual(0);
  });

  it('exposes overview and GraphQL CQRS façades', async () => {
    const org = await seedOrg(prisma, `rf_ov_${Date.now()}`);
    const overview = await fabric.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_rf',
      role: 'owner',
    });
    expect(overview.deferred.memoryFabric).toBe(false);
    expect(overview.deferred.policyFabric).toBe(false);
    expect(overview.links.reasoningFabric).toBe('/reasoning-fabric');
    expect(overview.honesty.extendsReasoningRuntime).toBe(true);

    const caps = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ reasoningFabricCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(caps.body.errors).toBeUndefined();
    expect(caps.body.data.reasoningFabricCapabilities.length).toBeGreaterThan(5);

    const routes = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ reasoningFabricRoutes { kind name target api cloud notes } }',
      })
      .expect(200);
    expect(routes.body.errors).toBeUndefined();
    expect(
      routes.body.data.reasoningFabricRoutes.some((r: { kind: string }) => r.kind === 'plan'),
    ).toBe(true);
  });
});
