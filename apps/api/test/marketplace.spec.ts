import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BillingService } from '../src/billing/billing.service';
import { MarketplaceService } from '../src/marketplace/marketplace.service';
import { PromptsService } from '../src/prompts/prompts.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { ApiException } from '../src/common/errors/api-exception';
import { hashTmSegment, normalizeTmSegment } from '../src/tm/tm-hash';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_mkt_${name}_${Date.now}_${Math.random}`,
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

describe('Marketplace',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let marketplace: MarketplaceService;
  let prompts: PromptsService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    marketplace = app.get(MarketplaceService);
    prompts = app.get(PromptsService);
  });

  afterAll(async  => {
    await app.close;
  });

  it('rejects free plan publish and install', async  => {
    const org = await seedOrg(prisma, `mfree_${Date.now}`);
    const workspaceId = org.workspaces[0].id;
    const userId = org.memberships[0].userId;

    await prisma.glossaryTerm.create({
      data: {
        organizationId: org.id,
        workspaceId,
        sourceLang: 'en',
        targetLang: 'sw',
        sourceTerm: 'hello',
        targetTerm: 'habari',
      },
    });

    await expect(
      marketplace.publish({
        organizationId: org.id,
        workspaceId,
        userId,
        role: 'owner',
        title: 'Free pack',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });

  it('publishes a glossary snapshot and installs into another Pro workspace', async  => {
    const publisher = await seedOrg(prisma, `mpub_${Date.now}`);
    const buyer = await seedOrg(prisma, `mbuy_${Date.now}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const pubWs = publisher.workspaces[0].id;
    const buyWs = buyer.workspaces[0].id;
    const pubUser = publisher.memberships[0].userId;
    const buyUser = buyer.memberships[0].userId;

    await prisma.glossaryTerm.createMany({
      data: [
        {
          organizationId: publisher.id,
          workspaceId: pubWs,
          sourceLang: 'en',
          targetLang: 'sw',
          sourceTerm: 'clinic',
          targetTerm: 'kliniki',
        },
        {
          organizationId: publisher.id,
          workspaceId: pubWs,
          sourceLang: 'en',
          targetLang: 'sw',
          sourceTerm: 'nurse',
          targetTerm: 'muuguzi',
        },
      ],
    });

    const listing = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: pubUser,
      role: 'owner',
      title: 'Health EN→SW',
      description: 'Clinical terms',
    });
    expect(listing.kind).toBe('glossary');
    expect(listing.termCount).toBe(2);
    expect(listing.status).toBe('published');

    const catalog = await marketplace.listPublished(buyer.id);
    expect(catalog.some((l) => l.id === listing.id)).toBe(true);

    const install = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyWs,
      listingId: listing.id,
      userId: buyUser,
      role: 'owner',
    });
    expect(install.termsInstalled).toBe(2);

    const buyerTerms = await prisma.glossaryTerm.findMany({
      where: { organizationId: buyer.id, workspaceId: buyWs },
      orderBy: { sourceTerm: 'asc' },
    });
    expect(buyerTerms.map((t) => t.sourceTerm)).toEqual(['clinic', 'nurse']);
    expect(buyerTerms.map((t) => t.targetTerm)).toEqual(['kliniki', 'muuguzi']);

    await expect(
      marketplace.install({
        organizationId: buyer.id,
        workspaceId: buyWs,
        listingId: listing.id,
        userId: buyUser,
        role: 'owner',
      }),
    ).rejects.toBeInstanceOf(ApiException);

    await marketplace.unpublish({
      organizationId: publisher.id,
      listingId: listing.id,
      userId: pubUser,
      role: 'owner',
    });

    const after = await marketplace.listPublished(buyer.id);
    expect(after.some((l) => l.id === listing.id)).toBe(false);

    const installs = await marketplace.listInstalls(buyer.id, buyWs);
    expect(installs.some((i) => i.listingId === listing.id)).toBe(true);
  });

  it('overwrites conflicting buyer terms from the snapshot', async  => {
    const publisher = await seedOrg(prisma, `mover_${Date.now}`);
    const buyer = await seedOrg(prisma, `mbovr_${Date.now}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const pubWs = publisher.workspaces[0].id;
    const buyWs = buyer.workspaces[0].id;

    await prisma.glossaryTerm.create({
      data: {
        organizationId: publisher.id,
        workspaceId: pubWs,
        sourceLang: 'en',
        targetLang: 'fr',
        sourceTerm: 'hello',
        targetTerm: 'bonjour',
      },
    });
    await prisma.glossaryTerm.create({
      data: {
        organizationId: buyer.id,
        workspaceId: buyWs,
        sourceLang: 'en',
        targetLang: 'fr',
        sourceTerm: 'hello',
        targetTerm: 'salut',
      },
    });

    const listing = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: publisher.memberships[0].userId,
      role: 'owner',
      title: 'Greetings',
    });

    await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyWs,
      listingId: listing.id,
      userId: buyer.memberships[0].userId,
      role: 'owner',
    });

    const term = await prisma.glossaryTerm.findFirst({
      where: {
        workspaceId: buyWs,
        sourceLang: 'en',
        targetLang: 'fr',
        sourceTerm: 'hello',
      },
    });
    expect(term?.targetTerm).toBe('bonjour');
  });

  it('publishes and installs prompt listings', async  => {
    const publisher = await seedOrg(prisma, `mprom_${Date.now}`);
    const buyer = await seedOrg(prisma, `mbprm_${Date.now}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const pubWs = publisher.workspaces[0].id;
    const buyWs = buyer.workspaces[0].id;
    const pubUser = publisher.memberships[0].userId;
    const buyUser = buyer.memberships[0].userId;

    await prompts.createVersion({
      organizationId: publisher.id,
      workspaceId: pubWs,
      key: 'chat',
      body: 'MARKETPLACE_CHAT_SYSTEM_UNIQUE',
      role: 'owner',
      userId: pubUser,
      activate: true,
    });
    await prompts.createVersion({
      organizationId: publisher.id,
      workspaceId: pubWs,
      key: 'rag',
      body: 'MARKETPLACE_RAG_SYSTEM_UNIQUE',
      role: 'owner',
      userId: pubUser,
      activate: true,
    });

    const listing = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: pubUser,
      role: 'owner',
      title: 'Support prompts',
      kind: 'prompt',
    });
    expect(listing.kind).toBe('prompt');
    expect(listing.itemCount).toBe(2);

    const filtered = await marketplace.listPublished(buyer.id, 'prompt');
    expect(filtered.every((l) => l.kind === 'prompt')).toBe(true);
    expect(filtered.some((l) => l.id === listing.id)).toBe(true);

    await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyWs,
      listingId: listing.id,
      userId: buyUser,
      role: 'owner',
    });

    const chat = await prompts.resolve({
      organizationId: buyer.id,
      workspaceId: buyWs,
      key: 'chat',
    });
    const rag = await prompts.resolve({
      organizationId: buyer.id,
      workspaceId: buyWs,
      key: 'rag',
    });
    expect(chat.body).toBe('MARKETPLACE_CHAT_SYSTEM_UNIQUE');
    expect(rag.body).toBe('MARKETPLACE_RAG_SYSTEM_UNIQUE');
  });

  it('publishes and installs dataset listings from TM', async  => {
    const publisher = await seedOrg(prisma, `mdat_${Date.now}`);
    const buyer = await seedOrg(prisma, `mbdat_${Date.now}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const pubWs = publisher.workspaces[0].id;
    const buyWs = buyer.workspaces[0].id;
    const sourceText = normalizeTmSegment('The clinic is open');
    const sourceHash = hashTmSegment(sourceText);

    await prisma.translationMemoryEntry.create({
      data: {
        organizationId: publisher.id,
        workspaceId: pubWs,
        sourceLang: 'en',
        targetLang: 'sw',
        sourceText,
        targetText: 'Kliniki iko wazi',
        sourceHash,
        approved: true,
      },
    });

    const listing = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: publisher.memberships[0].userId,
      role: 'owner',
      title: 'Clinic TM pack',
      kind: 'dataset',
    });
    expect(listing.kind).toBe('dataset');
    expect(listing.itemCount).toBe(1);

    await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyWs,
      listingId: listing.id,
      userId: buyer.memberships[0].userId,
      role: 'owner',
    });

    const entries = await prisma.translationMemoryEntry.findMany({
      where: { organizationId: buyer.id, workspaceId: buyWs },
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].targetText).toBe('Kliniki iko wazi');
  });

  it('records a paid install with platform fee when Stripe is offline', async  => {
    const publisher = await seedOrg(prisma, `mpaid_${Date.now}`);
    const buyer = await seedOrg(prisma, `mbpaid_${Date.now}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });
    await billing.setConnectForTests({ organizationId: publisher.id });

    const pubWs = publisher.workspaces[0].id;
    const buyWs = buyer.workspaces[0].id;

    await prisma.glossaryTerm.create({
      data: {
        organizationId: publisher.id,
        workspaceId: pubWs,
        sourceLang: 'en',
        targetLang: 'sw',
        sourceTerm: 'fee',
        targetTerm: 'ada',
      },
    });

    const listing = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: publisher.memberships[0].userId,
      role: 'owner',
      title: 'Paid glossary',
      kind: 'glossary',
      priceCents: 500,
    });
    expect(listing.priceCents).toBe(500);

    expect(billing.isMarketplacePaymentsConfigured).toBe(false);

    const result = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyWs,
      listingId: listing.id,
      userId: buyer.memberships[0].userId,
      role: 'owner',
    });
    expect(result.requiresPayment).toBe(false);
    if (result.requiresPayment) throw new Error('expected free-path install');
    expect(result.saleStatus).toBe('recorded');
    expect(result.termsInstalled).toBe(1);

    const sales = await marketplace.listSales(publisher.id);
    expect(sales).toHaveLength(1);
    expect(sales[0].amountCents).toBe(500);
    expect(sales[0].applicationFeeCents).toBe(billing.applicationFeeCents(500));
    expect(sales[0].status).toBe('recorded');
    expect(sales[0].role).toBe('publisher');
  });
});
