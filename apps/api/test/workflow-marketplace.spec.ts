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
import { WorkflowRuntimeService } from '../src/workflow-runtime/workflow-runtime.service';
import { WorkflowMarketplaceService } from '../src/workflow-marketplace/workflow-marketplace.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { GatewayService } from '../src/gateway/gateway.service';

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
              clerkUserId: `clerk_wm_${name}_${Date.now}_${Math.random}`,
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

describe('Workflow Marketplace',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let billing: BillingService;
  let workflows: WorkflowRuntimeService;
  let marketplace: WorkflowMarketplaceService;
  const prevMode = process.env.LUGEMI_WORKFLOW_RUNTIME_MODE;

  beforeAll(async  => {
    process.env.LUGEMI_WORKFLOW_RUNTIME_MODE = 'sandbox';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    billing = app.get(BillingService);
    workflows = app.get(WorkflowRuntimeService);
    marketplace = app.get(WorkflowMarketplaceService);

    app.get(GatewayService).setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        const user = [...input.messages].reverse.find((m) => m.role === 'user');
        return {
          message: {
            role: 'assistant',
            content: `Sandbox workflow plan for ${user?.content.slice(0, 40) ?? 'goal'}`,
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

  afterAll(async  => {
    if (prevMode === undefined) delete process.env.LUGEMI_WORKFLOW_RUNTIME_MODE;
    else process.env.LUGEMI_WORKFLOW_RUNTIME_MODE = prevMode;
    await app.close;
  });

  it('documents Workflow Marketplace honesty (sandbox + Policy; not Zapier OS)',  => {
    const doc = join(root, 'docs/WORKFLOW_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0157-workflow-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('');
    expect(text).toMatch(/sandbox/i);
    expect(text).toMatch(/Policy/i);
    expect(text).toMatch(/liveStepExecution/i);
    expect(text).toMatch(/Zapier|Temporal|Airflow/i);
    expect(text).toMatch(/Stripe|storesRawCardData/i);
  });

  it('has no TODO/FIXME markers in Workflow Marketplace source',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'workflow-marketplace'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with sandbox + Policy hard-gate honesty', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/workflow-marketplace/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Workflow Marketplace');
    expect(res.body.honesty.liveStepExecution).toBe(false);
    expect(res.body.honesty.sandboxRequired).toBe(true);
    expect(res.body.honesty.workflowPolicyHardGateRequired).toBe(true);
    expect(res.body.honesty.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.honesty.zapierOs).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);
    expect(res.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.safety.liveStepExecutionForbidden).toBe(true);
    expect(res.body.docs).toBe('/docs/WORKFLOW_MARKETPLACE.md');
    expect(res.body.categories.some((c: { id: string }) => c.id === 'approval')).toBe(true);
  });

  it('exposes workflowMarketplaceEngine via GraphQL CQRS façade', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ workflowMarketplaceEngine { product liveStepExecution sandboxRequired workflowPolicyHardGateRequired storesRawCardData stripeOrEquivalentRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.workflowMarketplaceEngine.product).toContain('Workflow Marketplace');
    expect(res.body.data.workflowMarketplaceEngine.liveStepExecution).toBe(false);
    expect(res.body.data.workflowMarketplaceEngine.sandboxRequired).toBe(true);
    expect(res.body.data.workflowMarketplaceEngine.workflowPolicyHardGateRequired).toBe(true);
    expect(res.body.data.workflowMarketplaceEngine.storesRawCardData).toBe(false);
  });

  it('publishes, installs, runs via sandbox Policy gate; denies live actions', async  => {
    const publisher = await seedOrg(prisma, `wmpub_${Date.now}`);
    const buyer = await seedOrg(prisma, `wmbuy_${Date.now}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const created = await workflows.createWorkflow({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      name: 'Approval Chain',
      permissions: ['reason.plan', 'memory.search', 'workflow.approve'],
      mode: 'sequential',
      steps: [
        { action: 'reason.plan', input: { problem: 'route request' } },
        { action: 'memory.search', input: { query: 'prior approvals' } },
      ],
      requiresApproval: false,
    });
    await workflows.lifecycle({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      id: created.workflow.id,
      status: 'active',
    });

    const published = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      workflowId: created.workflow.id,
      title: 'Approval Chain Pro',
      category: 'approval',
      priceCents: 500,
    });
    expect(published.listing.kind).toBe('workflow');
    expect(published.listing.verified).toBe(true);
    expect(published.listing.sandboxOnly).toBe(true);
    expect(published.listing.liveStepExecution).toBe(false);
    expect(published.listing.category).toBe('approval');
    expect(published.listing.stepCount).toBe(2);

    const installed = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(installed.workflow.status).toBe('active');
    expect(installed.sale?.amountCents).toBe(500);
    expect(installed.sale?.applicationFeeCents).toBe(75);

    const runOk = await marketplace.run({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(runOk.run.sandbox).toBe(true);
    expect(runOk.run.liveStepExecution).toBe(false);
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
      name: 'wm-test',
    });
    const httpRun = await request(app.getHttpServer)
      .post(`/v1/workflow-marketplace/listings/${published.listing.id}/run`)
      .set('Authorization', `Bearer ${buyerKey.secret}`)
      .send({ actions: [{ action: 'workflow.execute_live' }] })
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

  it('rejects free-plan publish', async  => {
    const free = await seedOrg(prisma, `wmfree_${Date.now}`);
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        workflowId: 'missing',
        title: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
