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
import { PromptFabricService } from '../src/prompt-fabric/prompt-fabric.service';
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

describe('Prompt Fabric (VL-243)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let fabric: PromptFabricService;
  let bus: EventFabricBus;
  const prevMode = process.env.LUGEMI_PROMPT_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.EVENT_FABRIC_MEMORY = '1';
    process.env.LUGEMI_PROMPT_RUNTIME_MODE = 'sandbox';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    fabric = app.get(PromptFabricService);
    bus = app.get(EventFabricBus);
    bus.resetForTests();
    fabric.resetCounters();
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_PROMPT_RUNTIME_MODE;
    else process.env.LUGEMI_PROMPT_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Prompt Fabric honesty (extends Prompt Runtime; not prompt mesh)', () => {
    const doc = join(root, 'docs/PROMPT_FABRIC.md');
    const adr = join(root, 'docs/adr/0145-prompt-fabric.md');
    const phase = join(
      root,
      'docs/roadmap/volume10-ai-fabric/phases/phase_04_110_Prompt_Fabric.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(phase)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-243');
    expect(text).toMatch(/Prompt Runtime/i);
    expect(text).toMatch(/prompt mesh/i);
    expect(text).toMatch(/research lab/i);
    expect(text).toMatch(/hard gate|hard-gate/i);
  });

  it('has no TODO/FIXME/implement-later markers in Prompt Fabric source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'prompt-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes catalog, routes, router, and policies with honesty', async () => {
    const res = await request(app.getHttpServer()).get('/v1/prompt-fabric/products').expect(200);
    expect(res.body.product).toBe('Lugemi Prompt Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.promptMeshOs).toBe(false);
    expect(res.body.architecture.autoPromptResearchLab).toBe(false);
    expect(res.body.architecture.regeneratesPromptRuntime).toBe(false);
    expect(res.body.architecture.extendsPromptRuntime).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.honesty.promptPoliciesViaPolicyRuntime).toBe(true);
    expect(res.body.safety.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/PROMPT_FABRIC.md');
    expect(res.body.policyRuntime.product).toContain('Policy Runtime');

    const hub = res.body.products.find((p: { id: string }) => p.id === 'prompt-fabric');
    expect(hub.status).toBe('shipped');

    const routes = await request(app.getHttpServer()).get('/v1/prompt-fabric/routes').expect(200);
    expect(routes.body.routes.length).toBeGreaterThanOrEqual(7);
    expect(routes.body.runtimeRoutes.some((r: { feature: string }) => r.feature === 'rag')).toBe(
      true,
    );

    const plan = await request(app.getHttpServer())
      .post('/v1/prompt-fabric/route')
      .send({ feature: 'rag' })
      .expect(200);
    expect(plan.body.runtimeRoute.key).toBe('rag');
    expect(plan.body.runtimeRoute.honesty.promptMeshOs).toBe(false);

    const policies = await request(app.getHttpServer())
      .get('/v1/prompt-fabric/policies')
      .expect(200);
    expect(policies.body.fabric.policyFabricDeferred).toBe(false);
    expect(policies.body.policies.target).toBe('policy-runtime');
  });

  it('validates, distributes, and syncs same-org peers with Event Fabric events', async () => {
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

    const validated = await request(app.getHttpServer())
      .post('/v1/prompt-fabric/validate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        key: 'chat',
        body: 'You are helpful. Locale={{locale}}.',
        variables: { locale: 'sw' },
      })
      .expect(200);
    expect(validated.body.honesty.regeneratesPromptRuntime).toBe(false);

    const dist = await request(app.getHttpServer())
      .post('/v1/prompt-fabric/distribute')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        keys: ['chat', 'rag'],
        publishEvent: true,
        topic: 'prompt-fabric-test',
      })
      .expect(200);
    expect(dist.body.distribution.targets).toContain(peer.id);
    expect(dist.body.event.type).toBe('com.lugemi.prompt.distributed');

    const sync = await request(app.getHttpServer())
      .post('/v1/prompt-fabric/sync')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        targetWorkspaceId: peer.id,
        keys: ['chat'],
        publishEvent: true,
      })
      .expect(200);
    expect(sync.body.sync.cursor).toMatch(/^pf:/);
    expect(sync.body.event.type).toBe('com.lugemi.prompt.synced');

    const monitoring = await request(app.getHttpServer())
      .get('/v1/prompt-fabric/monitoring')
      .expect(200);
    expect(monitoring.body.counters.validations).toBeGreaterThan(0);
    expect(monitoring.body.counters.distributions).toBeGreaterThan(0);
    expect(monitoring.body.counters.syncs).toBeGreaterThan(0);
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
    expect(overview.deferred.reasoningFabric).toBe(false);
    expect(overview.deferred.policyFabric).toBe(false);
    expect(overview.links.promptFabric).toBe('/prompt-fabric');
    expect(overview.honesty.extendsPromptRuntime).toBe(true);

    const caps = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ promptFabricCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(caps.body.errors).toBeUndefined();
    expect(caps.body.data.promptFabricCapabilities.length).toBeGreaterThan(5);

    const routes = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ promptFabricRoutes { kind name target api cloud notes } }',
      })
      .expect(200);
    expect(routes.body.errors).toBeUndefined();
    expect(
      routes.body.data.promptFabricRoutes.some((r: { kind: string }) => r.kind === 'chat'),
    ).toBe(true);
  });
});
