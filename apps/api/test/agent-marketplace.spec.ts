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
import { AgentRuntimeService } from '../src/agent-runtime/agent-runtime.service';
import { AgentMarketplaceService } from '../src/agent-marketplace/agent-marketplace.service';
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
              clerkUserId: `clerk_am_${name}_${Date.now()}_${Math.random()}`,
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

describe('Agent Marketplace', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let billing: BillingService;
  let agents: AgentRuntimeService;
  let marketplace: AgentMarketplaceService;
  const prevMode = process.env.LUGEMI_AGENT_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.LUGEMI_AGENT_RUNTIME_MODE = 'sandbox';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    billing = app.get(BillingService);
    agents = app.get(AgentRuntimeService);
    marketplace = app.get(AgentMarketplaceService);
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_AGENT_RUNTIME_MODE;
    else process.env.LUGEMI_AGENT_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Agent Marketplace honesty (sandbox + Policy; not open agent-orchestration OS)', () => {
    const doc = join(root, 'docs/AGENT_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0156-agent-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/sandbox/i);
    expect(text).toMatch(/Policy/i);
    expect(text).toMatch(/liveToolExecution/i);
    expect(text).toMatch(/open agent-orchestration|sandbox/i);
    expect(text).toMatch(/Stripe|storesRawCardData/i);
  });

  it('has no TODO/FIXME markers in Agent Marketplace source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'agent-marketplace'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with sandbox + Policy hard-gate honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/agent-marketplace/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Agent Marketplace');
    expect(res.body.honesty.liveToolExecution).toBe(false);
    expect(res.body.honesty.sandboxRequired).toBe(true);
    expect(res.body.honesty.agentPolicyHardGateRequired).toBe(true);
    expect(res.body.honesty.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.honesty.langGraphOs).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);
    expect(res.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.safety.liveToolExecutionForbidden).toBe(true);
    expect(res.body.docs).toBe('/docs/AGENT_MARKETPLACE.md');
    expect(res.body.categories.some((c: { id: string }) => c.id === 'support')).toBe(true);
  });

  it('exposes agentMarketplaceEngine via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ agentMarketplaceEngine { product liveToolExecution sandboxRequired agentPolicyHardGateRequired storesRawCardData stripeOrEquivalentRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.agentMarketplaceEngine.product).toContain('Agent Marketplace');
    expect(res.body.data.agentMarketplaceEngine.liveToolExecution).toBe(false);
    expect(res.body.data.agentMarketplaceEngine.sandboxRequired).toBe(true);
    expect(res.body.data.agentMarketplaceEngine.agentPolicyHardGateRequired).toBe(true);
    expect(res.body.data.agentMarketplaceEngine.storesRawCardData).toBe(false);
  });

  it('publishes, installs, runs via sandbox Policy gate; denies live actions', async () => {
    const publisher = await seedOrg(prisma, `ampub_${Date.now()}`);
    const buyer = await seedOrg(prisma, `ambuy_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const created = await agents.createAgent({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      name: 'Support Copilot',
      permissions: ['reason.plan', 'memory.search', 'agent.message'],
      goal: 'Help with support triage',
    });
    await agents.lifecycle({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      id: created.agent.id,
      status: 'active',
    });

    const published = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      agentId: created.agent.id,
      title: 'Support Copilot Pro',
      category: 'support',
      priceCents: 500,
    });
    expect(published.listing.kind).toBe('agent');
    expect(published.listing.verified).toBe(true);
    expect(published.listing.sandboxOnly).toBe(true);
    expect(published.listing.liveToolExecution).toBe(false);
    expect(published.listing.category).toBe('support');

    const installed = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(installed.agent.status).toBe('active');
    expect(installed.sale?.amountCents).toBe(500);
    expect(installed.sale?.applicationFeeCents).toBe(75);

    const runOk = await marketplace.run({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
      actions: [{ action: 'reason.plan', input: { problem: 'triage ticket' } }],
    });
    expect(runOk.run.sandbox).toBe(true);
    expect(runOk.run.liveToolExecution).toBe(false);
    expect(runOk.run.status).toBe('completed');

    const runDenied = await marketplace.run({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
      actions: [{ action: 'shell.exec' }],
    });
    expect(runDenied.run.status).toBe('denied');
    expect(runDenied.run.steps[0]?.allowed).toBe(false);

    const buyerKey = await apiKeys.create({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      name: 'am-test',
    });
    const httpRun = await request(app.getHttpServer())
      .post(`/v1/agent-marketplace/listings/${published.listing.id}/run`)
      .set('Authorization', `Bearer ${buyerKey.secret}`)
      .send({ actions: [{ action: 'external.execute' }] })
      .expect(200);
    expect(httpRun.body.run.status).toBe('denied');

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
    const free = await seedOrg(prisma, `amfree_${Date.now()}`);
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        agentId: 'missing',
        title: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
