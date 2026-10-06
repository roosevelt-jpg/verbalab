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
import { PolicyFabricService } from '../src/policy-fabric/policy-fabric.service';
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
              clerkUserId: `clerk_pf_${name}_${Date.now()}_${Math.random()}`,
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

describe('Policy Fabric (VL-247)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let fabric: PolicyFabricService;
  let bus: EventFabricBus;
  const prevMode = process.env.LUGEMI_POLICY_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.EVENT_FABRIC_MEMORY = '1';
    process.env.LUGEMI_POLICY_RUNTIME_MODE = 'enforce';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    fabric = app.get(PolicyFabricService);
    bus = app.get(EventFabricBus);
    bus.resetForTests();
    fabric.resetCounters();
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_POLICY_RUNTIME_MODE;
    else process.env.LUGEMI_POLICY_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Policy Fabric honesty (hard gate; not log-only / OPA OS)', () => {
    const doc = join(root, 'docs/POLICY_FABRIC.md');
    const adr = join(root, 'docs/adr/0149-policy-fabric.md');
    const phase = join(
      root,
      'docs/roadmap/volume10-ai-fabric/phases/phase_08_114_Policy_Fabric.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(phase)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-247');
    expect(text).toMatch(/hard gate|hard-gate/i);
    expect(text).toMatch(/log-only|log only/i);
    expect(text).toMatch(/Policy Runtime/i);
  });

  it('has no TODO/FIXME/implement-later markers in Policy Fabric source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'policy-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes catalog with hard-gate honesty and routes/pipelines', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/policy-fabric/products')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Policy Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.hardGate).toBe(true);
    expect(res.body.architecture.logOnlyMode).toBe(false);
    expect(res.body.architecture.opaCedarOs).toBe(false);
    expect(res.body.architecture.regeneratesPolicyRuntime).toBe(false);
    expect(res.body.architecture.extendsPolicyRuntime).toBe(true);
    expect(res.body.honesty.wiredIntoFabricDistribute).toBe(true);
    expect(res.body.safety.policyLogOnlyForbidden).toBe(true);
    expect(res.body.docs).toBe('/docs/POLICY_FABRIC.md');
    expect(res.body.globalDenies.length).toBeGreaterThan(3);
    expect(res.body.buses.length).toBeGreaterThanOrEqual(8);

    const hub = res.body.products.find((p: { id: string }) => p.id === 'policy-fabric');
    expect(hub.status).toBe('shipped');

    const plan = await request(app.getHttpServer())
      .post('/v1/policy-fabric/route')
      .send({ kinds: ['security', 'assert', 'nope'] })
      .expect(200);
    expect(plan.body.plan.map((p: { kind: string }) => p.kind)).toEqual(
      expect.arrayContaining(['security', 'assert']),
    );
    expect(plan.body.missing).toContain('nope');

    const pipeline = await request(app.getHttpServer())
      .post('/v1/policy-fabric/pipeline')
      .send({ pipelineId: 'evaluate-assert' })
      .expect(200);
    expect(pipeline.body.pipeline.steps).toEqual(['evaluate', 'assert']);
  });

  it('hard-gates forbidden actions with 403 and allows distribute when permitted', async () => {
    bus.resetForTests();
    fabric.resetCounters();
    const org = await seedOrg(prisma, `pf_${Date.now()}`);
    const primary = org.workspaces.find((w) => w.name === 'Default')!;
    const peer = org.workspaces.find((w) => w.name === 'Peer')!;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: primary.id,
      userId: org.memberships[0]!.userId,
      name: 'pf-key',
    });

    const denied = await request(app.getHttpServer())
      .post('/v1/policy-fabric/assert')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ bus: 'agent-fabric', action: 'fabric.bypass_policy' })
      .expect(403);
    expect(denied.body.error?.code ?? denied.body.code).toMatch(/policy_fabric_denied|denied/i);

    const allowed = await request(app.getHttpServer())
      .post('/v1/policy-fabric/assert')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        bus: 'policy-fabric',
        action: 'fabric.distribute',
        permissions: ['fabric.distribute'],
      })
      .expect(200);
    expect(allowed.body.hardGate).toBe(true);
    expect(allowed.body.logOnly).toBe(false);

    const dist = await request(app.getHttpServer())
      .post('/v1/policy-fabric/distribute')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kinds: ['security', 'assert'],
        publishEvent: true,
        topic: 'policy-fabric-test',
      })
      .expect(200);
    expect(dist.body.distribution.targets).toContain(peer.id);
    expect(dist.body.event.type).toBe('com.lugemi.policy.distributed');

    const sync = await request(app.getHttpServer())
      .post('/v1/policy-fabric/sync')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(200);
    expect(typeof sync.body.synced).toBe('number');

    const monitoring = await request(app.getHttpServer())
      .get('/v1/policy-fabric/monitoring')
      .expect(200);
    expect(monitoring.body.counters.denies).toBeGreaterThan(0);
    expect(monitoring.body.counters.distributions).toBeGreaterThan(0);
  });

  it('exposes overview and GraphQL CQRS façades', async () => {
    const org = await seedOrg(prisma, `pf_ov_${Date.now()}`);
    const overview = await fabric.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_pf',
      role: 'owner',
    });
    expect(overview.links.policyFabric).toBe('/policy-fabric');
    expect(overview.honesty.hardGate).toBe(true);
    expect(overview.safety.logOnlyMode).toBe(false);

    const caps = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ policyFabricCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(caps.body.errors).toBeUndefined();
    expect(caps.body.data.policyFabricCapabilities.length).toBeGreaterThan(5);

    const routes = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ policyFabricRoutes { kind name target api cloud notes } }',
      })
      .expect(200);
    expect(routes.body.errors).toBeUndefined();
    expect(
      routes.body.data.policyFabricRoutes.some((r: { kind: string }) => r.kind === 'assert'),
    ).toBe(true);
  });
});
