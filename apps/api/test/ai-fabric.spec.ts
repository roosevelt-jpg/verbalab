import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AiFabricService } from '../src/ai-fabric/ai-fabric.service';
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
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('AI Fabric Foundation', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let fabric: AiFabricService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    fabric = app.get(AiFabricService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents AI Fabric honesty (internal hub, not Kafka OS)', () => {
    const doc = join(root, 'docs/AI_FABRIC.md');
    const adr = join(root, 'docs/adr/0141-ai-fabric-foundation.md');
    const readme = join(root, 'docs/roadmap/volume10-ai-fabric/README_VOLUME10.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/not\*\* a customer-facing|NOT a customer|not a customer/i);
    expect(text).toContain('');
    expect(text).toContain('CQRS');
    expect(text).toMatch(/hard gate|hard-gate/i);
    expect(text).toMatch(/Kafka|broker/i);
    const readmeText = readFileSync(readme, 'utf8');
    expect(readmeText).toMatch(/Policy Fabric|hard gate|enforced gate/i);
    expect(readmeText).toMatch(/Kafka|NATS|Redis Streams/i);
  });

  it('has no TODO/FIXME/implement-later markers in AI Fabric source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'ai-fabric'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes public bus catalog with honest architecture + safety', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-fabric/products').expect(200);
    expect(res.body.product).toBe('Lugemi AI Fabric');
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.kafkaHyperscalerOs).toBe(false);
    expect(res.body.architecture.serviceMeshOs).toBe(false);
    expect(res.body.architecture.regeneratesPriorLayers).toBe(false);
    expect(res.body.architecture.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.architecture.policyLogOnlyForbidden).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.honesty.brokerBackendsDeferred).toBe(false);
    expect(res.body.honesty.redisStreamsActive).toBe(true);
    expect(res.body.safety.fabricWidePolicyHardGateRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/AI_FABRIC.md');

    const hub = res.body.products.find((p: { id: string }) => p.id === 'ai-fabric');
    expect(hub.status).toBe('shipped');
    expect(hub.console).toBe('/ai-fabric');

    const event = res.body.products.find((p: { id: string }) => p.id === 'event-fabric');
    expect(event.status).toBe('shipped');
    expect(event.console).toBe('/event-fabric');

    const policy = res.body.products.find((p: { id: string }) => p.id === 'policy-fabric');
    expect(policy.status).toBe('shipped');
    expect(policy.console).toBe('/policy-fabric');
    expect(policy.notes).toMatch(/hard gate|enforce|FabricPolicyGate/i);
  });

  it('exposes routing table and org overview', async () => {
    const routing = await request(app.getHttpServer()).get('/v1/ai-fabric/routing').expect(200);
    expect(routing.body.routes.length).toBeGreaterThan(5);
    expect(routing.body.routes.some((r: { cloud: string }) => r.cloud === 'ai-kernel')).toBe(true);

    const org = await seedOrg(prisma, `af_${Date.now()}`);
    const overview = await fabric.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_af',
      role: 'owner',
    });
    expect(overview.deferred.eventFabric).toBe(false);
    expect(overview.deferred.contextFabric).toBe(false);
    expect(overview.deferred.knowledgeFabric).toBe(false);
    expect(overview.deferred.promptFabric).toBe(false);
    expect(overview.deferred.reasoningFabric).toBe(false);
    expect(overview.deferred.memoryFabric).toBe(false);
    expect(overview.deferred.agentFabric).toBe(false);
    expect(overview.deferred.policyFabric).toBe(false);
    expect(overview.deferred.regeneratesPriorLayers).toBe(false);
    expect(overview.links.aiFabric).toBe('/ai-fabric');
    expect(overview.safety.policyLogOnlyForbidden).toBe(true);
  });

  it('exposes aiFabricBuses via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ aiFabricBuses { id name status api console notes } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.aiFabricBuses.length).toBeGreaterThan(8);
    expect(
      res.body.data.aiFabricBuses.some((b: { id: string }) => b.id === 'ai-fabric'),
    ).toBe(true);
  });
});
