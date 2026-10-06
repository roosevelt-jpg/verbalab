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
import { AgentFabricService } from '../src/agent-fabric/agent-fabric.service';
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
              clerkUserId: `clerk_af_${name}_${Date.now()}_${Math.random()}`,
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

describe('Agent Fabric (VL-246)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let fabric: AgentFabricService;
  let bus: EventFabricBus;
  const prevMode = process.env.LUGEMI_AGENT_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.EVENT_FABRIC_MEMORY = '1';
    process.env.LUGEMI_AGENT_RUNTIME_MODE = 'sandbox';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    fabric = app.get(AgentFabricService);
    bus = app.get(EventFabricBus);
    bus.resetForTests();
    fabric.resetCounters();
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_AGENT_RUNTIME_MODE;
    else process.env.LUGEMI_AGENT_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Agent Fabric honesty (sandboxed + Policy-gated; not LangGraph/AutoGPT OS)', () => {
    const doc = join(root, 'docs/AGENT_FABRIC.md');
    const adr = join(root, 'docs/adr/0148-agent-fabric.md');
    const phase = join(
      root,
      'docs/roadmap/volume10-ai-fabric/phases/phase_07_113_Agent_Fabric.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(phase)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-246');
    expect(text).toMatch(/Agent Runtime/i);
    expect(text).toMatch(/sandbox/i);
    expect(text).toMatch(/hard gate|hard-gate|Policy/i);
    expect(text).toMatch(/LangGraph|AutoGPT/i);
  });

  it('has no TODO/FIXME/implement-later markers in Agent Fabric source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'agent-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes catalog, routes, pipelines, federation with sandbox honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/agent-fabric/products')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Agent Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.langGraphOs).toBe(false);
    expect(res.body.architecture.autoGptOs).toBe(false);
    expect(res.body.architecture.openToolExecution).toBe(false);
    expect(res.body.architecture.sandboxed).toBe(true);
    expect(res.body.architecture.policyRuntimeHardGate).toBe(true);
    expect(res.body.architecture.regeneratesAgentRuntime).toBe(false);
    expect(res.body.architecture.extendsAgentRuntime).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.safety.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/AGENT_FABRIC.md');
    expect(res.body.pipelines.length).toBeGreaterThanOrEqual(2);

    const hub = res.body.products.find((p: { id: string }) => p.id === 'agent-fabric');
    expect(hub.status).toBe('shipped');

    const routes = await request(app.getHttpServer())
      .get('/v1/agent-fabric/routes')
      .expect(200);
    expect(routes.body.routes.some((r: { kind: string }) => r.kind === 'discover')).toBe(true);

    const plan = await request(app.getHttpServer())
      .post('/v1/agent-fabric/route')
      .send({ kinds: ['discover', 'collaborate', 'nope'] })
      .expect(200);
    expect(plan.body.plan.map((p: { kind: string }) => p.kind)).toEqual(
      expect.arrayContaining(['discover', 'collaborate']),
    );
    expect(plan.body.missing).toContain('nope');

    const pipeline = await request(app.getHttpServer())
      .post('/v1/agent-fabric/pipeline')
      .send({ pipelineId: 'discover-collaborate' })
      .expect(200);
    expect(pipeline.body.pipeline.steps).toEqual(['discover', 'collaborate']);
    expect(pipeline.body.plan.length).toBe(2);

    const fed = await request(app.getHttpServer())
      .post('/v1/agent-fabric/federate')
      .send({ kinds: ['policy', 'marketplace'] })
      .expect(200);
    expect(fed.body.federation.length).toBe(2);
  });

  it('discovers agents, distributes same-org peers, and streams SSE ticks', async () => {
    bus.resetForTests();
    fabric.resetCounters();
    const org = await seedOrg(prisma, `af_${Date.now()}`);
    const primary = org.workspaces.find((w) => w.name === 'Default')!;
    const peer = org.workspaces.find((w) => w.name === 'Peer')!;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: primary.id,
      userId: org.memberships[0]!.userId,
      name: 'af-key',
    });

    const discover = await request(app.getHttpServer())
      .get('/v1/agent-fabric/discover')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(Array.isArray(discover.body.agents)).toBe(true);
    expect(discover.body.honesty.sandboxed).toBe(true);

    const dist = await request(app.getHttpServer())
      .post('/v1/agent-fabric/distribute')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kinds: ['discover', 'collaborate'],
        publishEvent: true,
        topic: 'agent-fabric-test',
      })
      .expect(200);
    expect(dist.body.distribution.targets).toContain(peer.id);
    expect(dist.body.event.type).toBe('com.lugemi.agent.distributed');

    const stream = await request(app.getHttpServer())
      .get('/v1/agent-fabric/stream')
      .expect(200);
    expect(stream.headers['content-type']).toMatch(/text\/event-stream/);
    expect(stream.text).toContain('agent-fabric');

    const marketplace = await request(app.getHttpServer())
      .get('/v1/agent-fabric/marketplace')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(marketplace.body.kind).toBe('agent');

    const monitoring = await request(app.getHttpServer())
      .get('/v1/agent-fabric/monitoring')
      .expect(200);
    expect(monitoring.body.counters.distributions).toBeGreaterThan(0);
    expect(monitoring.body.counters.discoveries).toBeGreaterThan(0);
  });

  it('exposes overview and GraphQL CQRS façades', async () => {
    const org = await seedOrg(prisma, `af_ov_${Date.now()}`);
    const overview = await fabric.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_af',
      role: 'owner',
    });
    expect(overview.deferred.policyFabric).toBe(false);
    expect(overview.links.agentFabric).toBe('/agent-fabric');
    expect(overview.honesty.extendsAgentRuntime).toBe(true);
    expect(overview.safety.sandboxed).toBe(true);

    const caps = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ agentFabricCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(caps.body.errors).toBeUndefined();
    expect(caps.body.data.agentFabricCapabilities.length).toBeGreaterThan(5);

    const routes = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ agentFabricRoutes { kind name target api cloud notes } }',
      })
      .expect(200);
    expect(routes.body.errors).toBeUndefined();
    expect(
      routes.body.data.agentFabricRoutes.some((r: { kind: string }) => r.kind === 'discover'),
    ).toBe(true);
  });
});
