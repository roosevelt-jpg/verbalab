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
import { BillingService } from '../src/billing/billing.service';
import { PluginRuntimeService } from '../src/plugin-runtime/plugin-runtime.service';
import { PluginMarketplaceService } from '../src/plugin-marketplace/plugin-marketplace.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { GatewayService } from '../src/gateway/gateway.service';

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
              clerkUserId: `clerk_pm_${name}_${Date.now()}_${Math.random()}`,
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

describe('Plugin Marketplace', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let billing: BillingService;
  let plugins: PluginRuntimeService;
  let marketplace: PluginMarketplaceService;
  const prevMode = process.env.LUGEMI_PLUGIN_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.LUGEMI_PLUGIN_RUNTIME_MODE = 'sandbox';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    billing = app.get(BillingService);
    plugins = app.get(PluginRuntimeService);
    marketplace = app.get(PluginMarketplaceService);

    app.get(GatewayService).setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        const user = [...input.messages].reverse().find((m) => m.role === 'user');
        return {
          message: {
            role: 'assistant',
            content: `Sandbox plugin plan for ${user?.content.slice(0, 40) ?? 'goal'}`,
          },
          model: input.model ?? 'fixture-model',
          provider: 'fixture_chat',
          promptTokens: 10,
          completionTokens: 8,
          totalTokens: 18,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_PLUGIN_RUNTIME_MODE;
    else process.env.LUGEMI_PLUGIN_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Plugin Marketplace honesty (sandbox + Policy; not extension OS)', () => {
    const doc = join(root, 'docs/PLUGIN_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0152-plugin-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/sandbox/i);
    expect(text).toMatch(/Policy/i);
    expect(text).toMatch(/liveCodeExecution/i);
    expect(text).toMatch(/browser|VS Code|extension/i);
  });

  it('has no TODO/FIXME markers in Plugin Marketplace source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'plugin-marketplace'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with sandbox + Policy hard-gate honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/plugin-marketplace/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Plugin Marketplace');
    expect(res.body.honesty.liveCodeExecution).toBe(false);
    expect(res.body.honesty.sandboxRequired).toBe(true);
    expect(res.body.honesty.pluginPolicyHardGateRequired).toBe(true);
    expect(res.body.honesty.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.honesty.browserExtensionOs).toBe(false);
    expect(res.body.safety.liveCodeExecutionForbidden).toBe(true);
    expect(res.body.docs).toBe('/docs/PLUGIN_MARKETPLACE.md');
    const security = res.body.capabilities.find((c: { id: string }) => c.id === 'plugin-security');
    expect(security.status).toBe('shipped');
  });

  it('exposes pluginMarketplaceEngine via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ pluginMarketplaceEngine { product liveCodeExecution sandboxRequired pluginPolicyHardGateRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.pluginMarketplaceEngine.product).toContain('Plugin Marketplace');
    expect(res.body.data.pluginMarketplaceEngine.liveCodeExecution).toBe(false);
    expect(res.body.data.pluginMarketplaceEngine.sandboxRequired).toBe(true);
    expect(res.body.data.pluginMarketplaceEngine.pluginPolicyHardGateRequired).toBe(true);
  });

  it('publishes, installs, runs via sandbox Policy gate; denies live actions', async () => {
    const publisher = await seedOrg(prisma, `pmpub_${Date.now()}`);
    const buyer = await seedOrg(prisma, `pmbuy_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const registered = await plugins.register({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      name: 'Locale Helper',
      permissions: ['plugin.read', 'plugin.transform', 'memory.search'],
      description: 'Sandbox helper',
    });
    await plugins.lifecycle({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      id: registered.plugin.id,
      status: 'active',
    });

    const published = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      pluginId: registered.plugin.id,
      title: 'Locale Helper Pro',
      priceCents: 500,
    });
    expect(published.listing.kind).toBe('plugin');
    expect(published.listing.verified).toBe(true);
    expect(published.listing.sandboxOnly).toBe(true);
    expect(published.listing.liveCodeExecution).toBe(false);

    const installed = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(installed.plugin.status).toBe('active');
    expect(installed.sale?.amountCents).toBe(500);

    const runOk = await marketplace.run({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
      actions: [{ action: 'plugin.read' }],
    });
    expect(runOk.invocation.sandbox).toBe(true);
    expect(runOk.invocation.liveCodeExecution).toBe(false);
    expect(runOk.invocation.status).toBe('completed');

    const runDenied = await marketplace.run({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
      actions: [{ action: 'shell.exec' }],
    });
    expect(runDenied.invocation.status).toBe('denied');
    expect(runDenied.invocation.steps[0]?.allowed).toBe(false);

    const buyerKey = await apiKeys.create({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      name: 'pm-test',
    });
    const httpRun = await request(app.getHttpServer())
      .post(`/v1/plugin-marketplace/listings/${published.listing.id}/run`)
      .set('Authorization', `Bearer ${buyerKey.secret}`)
      .send({ actions: [{ action: 'plugin.invoke_live' }] })
      .expect(200);
    expect(httpRun.body.invocation.status).toBe('denied');

    await marketplace.upsertReview({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      listingId: published.listing.id,
      userId: buyer.memberships[0]!.userId,
      rating: 5,
      body: 'Works in sandbox',
    });
    const reviews = await marketplace.listReviews(published.listing.id);
    expect(reviews.reviews.length).toBe(1);
    expect(reviews.reviews[0]?.rating).toBe(5);
  });

  it('rejects free-plan publish', async () => {
    const free = await seedOrg(prisma, `pmfree_${Date.now()}`);
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        pluginId: 'missing',
        title: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
