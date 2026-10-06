import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BillingService } from '../src/billing/billing.service';
import { PromptMarketplaceService } from '../src/prompt-marketplace/prompt-marketplace.service';
import { PromptsService } from '../src/prompts/prompts.service';
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

describe('Prompt Marketplace', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let marketplace: PromptMarketplaceService;
  let prompts: PromptsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    marketplace = app.get(PromptMarketplaceService);
    prompts = app.get(PromptsService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Prompt Marketplace honesty (not prompt mesh; Stripe-only)', () => {
    const doc = join(root, 'docs/PROMPT_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0155-prompt-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/prompt mesh|promptMeshOs/i);
    expect(text).toMatch(/Stripe|storesRawCardData/i);
  });

  it('has no TODO/FIXME markers in Prompt Marketplace source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'prompt-marketplace'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with real-money + anti-mesh honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/prompt-marketplace/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Prompt Marketplace');
    expect(res.body.honesty.promptMeshOs).toBe(false);
    expect(res.body.honesty.autoPromptResearchOs).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);
    expect(res.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.honesty.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.safety.storesRawCardData).toBe(false);
    expect(res.body.docs).toBe('/docs/PROMPT_MARKETPLACE.md');
    expect(res.body.categories.some((c: { id: string }) => c.id === 'packs')).toBe(true);
  });

  it('exposes promptMarketplaceEngine via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ promptMarketplaceEngine { product promptMeshOs autoPromptResearchOs storesRawCardData stripeOrEquivalentRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.promptMarketplaceEngine.product).toContain('Prompt Marketplace');
    expect(res.body.data.promptMarketplaceEngine.promptMeshOs).toBe(false);
    expect(res.body.data.promptMarketplaceEngine.autoPromptResearchOs).toBe(false);
    expect(res.body.data.promptMarketplaceEngine.storesRawCardData).toBe(false);
    expect(res.body.data.promptMarketplaceEngine.stripeOrEquivalentRequired).toBe(true);
  });

  it('publishes pack, tests, installs with revenue share, reviews; rejects free plan', async () => {
    const publisher = await seedOrg(prisma, `pmpub_${Date.now()}`);
    const buyer = await seedOrg(prisma, `pmbuy_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const pubWs = publisher.workspaces[0]!.id;
    const buyWs = buyer.workspaces[0]!.id;
    const pubUser = publisher.memberships[0]!.userId;
    const buyUser = buyer.memberships[0]!.userId;

    await prompts.createVersion({
      organizationId: publisher.id,
      workspaceId: pubWs,
      key: 'chat',
      body: 'PROMPT_MARKET_CHAT_SYSTEM_UNIQUE',
      role: 'owner',
      userId: pubUser,
      activate: true,
    });
    await prompts.createVersion({
      organizationId: publisher.id,
      workspaceId: pubWs,
      key: 'rag',
      body: 'PROMPT_MARKET_RAG_SYSTEM_UNIQUE',
      role: 'owner',
      userId: pubUser,
      activate: true,
    });

    const published = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: pubUser,
      role: 'owner',
      title: 'Support prompt pack',
      category: 'packs',
      licenseType: 'commercial',
      promptVersion: 'v1',
      priceCents: 1000,
    });
    expect(published.listing.kind).toBe('prompt');
    expect(published.listing.verified).toBe(true);
    expect(published.listing.promptMeshOs).toBe(false);
    expect(published.listing.category).toBe('packs');
    expect(published.listing.promptCount).toBe(2);

    const tested = await marketplace.testListing({
      organizationId: buyer.id,
      listingId: published.listing.id,
    });
    expect(tested.passed).toBe(true);
    expect(tested.honesty.dryRunOnly).toBe(true);

    const installed = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyWs,
      userId: buyUser,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(installed.entitlement.promptsCopied).toBe(2);
    expect(installed.sale?.amountCents).toBe(1000);
    expect(installed.sale?.applicationFeeCents).toBe(150);

    const chat = await prompts.resolve({
      organizationId: buyer.id,
      workspaceId: buyWs,
      key: 'chat',
    });
    expect(chat.body).toBe('PROMPT_MARKET_CHAT_SYSTEM_UNIQUE');

    const updated = await marketplace.updateListing({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: pubUser,
      role: 'owner',
      listingId: published.listing.id,
      promptVersion: 'v2',
    });
    expect(updated.listing.promptVersion).toBe('v2');

    await marketplace.upsertReview({
      organizationId: buyer.id,
      workspaceId: buyWs,
      listingId: published.listing.id,
      userId: buyUser,
      rating: 5,
      body: 'Useful prompt pack',
    });
    const reviews = await marketplace.listReviews(published.listing.id);
    expect(reviews.reviews.length).toBe(1);

    const sales = await marketplace.listSales(publisher.id);
    expect(sales.sales.length).toBeGreaterThanOrEqual(1);
    expect(sales.honesty.storesRawCardData).toBe(false);
    expect(sales.honesty.stripeOrEquivalentRequired).toBe(true);

    const free = await seedOrg(prisma, `pmfree_${Date.now()}`);
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        title: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
