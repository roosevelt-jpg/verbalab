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
import { ContextFabricService } from '../src/context-fabric/context-fabric.service';
import { EventFabricBus } from '../src/event-fabric/event-fabric.bus';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory) out.push(...walkTsFiles(full));
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
              clerkUserId: `clerk_cf_${name}_${Date.now}_${Math.random}`,
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

describe('Context Fabric',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let fabric: ContextFabricService;
  let bus: EventFabricBus;
  const prevMode = process.env.LUGEMI_CONTEXT_RUNTIME_MODE;

  beforeAll(async  => {
    process.env.LUGEMI_CONTEXT_RUNTIME_MODE = 'sandbox';
    process.env.EVENT_FABRIC_MEMORY = '1';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    fabric = app.get(ContextFabricService);
    bus = app.get(EventFabricBus);
    bus.resetForTests;
    fabric.resetCounters;
  });

  afterAll(async  => {
    if (prevMode === undefined) delete process.env.LUGEMI_CONTEXT_RUNTIME_MODE;
    else process.env.LUGEMI_CONTEXT_RUNTIME_MODE = prevMode;
    await app.close;
  });

  it('documents Context Fabric honesty (extends Context Runtime; not infinite window)',  => {
    const doc = join(root, 'docs/CONTEXT_FABRIC.md');
    const adr = join(root, 'docs/adr/0143-context-fabric.md');
    const phase = join(
      root,
      'docs/roadmap/volume10-ai-fabric/phases/phase_02_108_Context_Fabric.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(phase)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('');
    expect(text).toMatch(/Context Runtime/i);
    expect(text).toMatch(/infinite context/i);
    expect(text).toMatch(/WebSocket|websocket/i);
    expect(text).toMatch(/hard gate|hard-gate/i);
  });

  it('has no TODO/FIXME/implement-later markers in Context Fabric source',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'context-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes catalog, routes, and router plan with honesty', async  => {
    const res = await request(app.getHttpServer).get('/v1/context-fabric/products').expect(200);
    expect(res.body.product).toBe('Lugemi Context Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.infiniteContextWindow).toBe(false);
    expect(res.body.architecture.websocketOs).toBe(false);
    expect(res.body.architecture.regeneratesContextRuntime).toBe(false);
    expect(res.body.architecture.extendsContextRuntime).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.honesty.optionalEventFabricPropagation).toBe(true);
    expect(res.body.safety.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/CONTEXT_FABRIC.md');

    const hub = res.body.products.find((p: { id: string }) => p.id === 'context-fabric');
    expect(hub.status).toBe('shipped');

    const routes = await request(app.getHttpServer).get('/v1/context-fabric/routes').expect(200);
    expect(routes.body.routes.length).toBeGreaterThanOrEqual(8);
    expect(routes.body.routes.some((r: { kind: string }) => r.kind === 'knowledge')).toBe(true);

    const plan = await request(app.getHttpServer)
      .post('/v1/context-fabric/route')
      .send({ kinds: ['workspace', 'language', 'nope'] })
      .expect(200);
    expect(plan.body.plan.map((p: { kind: string }) => p.kind)).toEqual(
      expect.arrayContaining(['workspace', 'language']),
    );
    expect(plan.body.missing).toContain('nope');
    expect(plan.body.include.workspace).toBe(true);
  });

  it('propagates via Context Runtime and optionally publishes Event Fabric event', async  => {
    bus.resetForTests;
    fabric.resetCounters;
    const org = await seedOrg(prisma, 'cf');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'cf-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/context-fabric/propagate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kinds: ['workspace', 'language', 'model'],
        modelHint: 'sandbox-model',
        providerHint: 'gateway',
        publishEvent: true,
        topic: 'context-fabric-test',
      })
      .expect(200);

    expect(res.body.plan.length).toBe(3);
    expect(res.body.assembled).toBeTruthy;
    expect(res.body.event).toBeTruthy;
    expect(res.body.event.type).toBe('com.lugemi.context.propagated');
    expect(res.body.honesty.regeneratesContextRuntime).toBe(false);

    const monitoring = await request(app.getHttpServer)
      .get('/v1/context-fabric/monitoring')
      .expect(200);
    expect(monitoring.body.counters.propagations).toBeGreaterThan(0);
    expect(monitoring.body.counters.eventPublishes).toBeGreaterThan(0);
  });

  it('exposes overview, SSE stream, and GraphQL CQRS façades', async  => {
    const org = await seedOrg(prisma, `cf_ov_${Date.now}`);
    const overview = await fabric.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_cf',
      role: 'owner',
    });
    expect(overview.deferred.knowledgeFabric).toBe(false);
    expect(overview.deferred.promptFabric).toBe(false);
    expect(overview.deferred.reasoningFabric).toBe(false);
    expect(overview.deferred.policyFabric).toBe(false);
    expect(overview.links.contextFabric).toBe('/context-fabric');
    expect(overview.honesty.extendsContextRuntime).toBe(true);

    const stream = await request(app.getHttpServer)
      .get('/v1/context-fabric/stream')
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.from(c)));
        res.on('end',  => cb(null, Buffer.concat(chunks).toString('utf8')));
      })
      .expect(200);
    expect(String(stream.body)).toMatch(/event: context-fabric/);
    expect(String(stream.body)).toMatch(/websocketOs/);

    const caps = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: '{ contextFabricCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(caps.body.errors).toBeUndefined;
    expect(caps.body.data.contextFabricCapabilities.length).toBeGreaterThan(5);

    const routes = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: '{ contextFabricRoutes { kind name target api cloud notes } }',
      })
      .expect(200);
    expect(routes.body.errors).toBeUndefined;
    expect(
      routes.body.data.contextFabricRoutes.some((r: { kind: string }) => r.kind === 'model'),
    ).toBe(true);
  });
});
