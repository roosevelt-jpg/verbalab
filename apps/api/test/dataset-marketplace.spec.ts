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
import { DatasetMarketplaceService } from '../src/dataset-marketplace/dataset-marketplace.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { hashTmSegment, normalizeTmSegment } from '../src/tm/tm-hash';

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
              clerkUserId: `clerk_dm_${name}_${Date.now()}_${Math.random()}`,
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

describe('Dataset Marketplace (VL-252)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let marketplace: DatasetMarketplaceService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    marketplace = app.get(DatasetMarketplaceService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Dataset Marketplace honesty (not Label Studio; Stripe-only)', () => {
    const doc = join(root, 'docs/DATASET_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0154-dataset-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-252');
    expect(text).toMatch(/Label Studio|labelStudioOs/i);
    expect(text).toMatch(/Stripe|storesRawCardData/i);
    expect(text).toMatch(/Dataset Cloud|datasetCloudOs/i);
  });

  it('has no TODO/FIXME markers in Dataset Marketplace source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'dataset-marketplace'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with real-money + anti-Label-Studio honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/dataset-marketplace/engine')
      .expect(200);
    expect(res.body.product).toBe('VerbaLab Dataset Marketplace');
    expect(res.body.honesty.labelStudioOs).toBe(false);
    expect(res.body.honesty.datasetCloudOs).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);
    expect(res.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.honesty.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.safety.storesRawCardData).toBe(false);
    expect(res.body.docs).toBe('/docs/DATASET_MARKETPLACE.md');
    expect(res.body.categories.some((c: { id: string }) => c.id === 'translation')).toBe(true);
  });

  it('exposes datasetMarketplaceEngine via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ datasetMarketplaceEngine { product labelStudioOs datasetCloudOs storesRawCardData stripeOrEquivalentRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.datasetMarketplaceEngine.product).toContain('Dataset Marketplace');
    expect(res.body.data.datasetMarketplaceEngine.labelStudioOs).toBe(false);
    expect(res.body.data.datasetMarketplaceEngine.datasetCloudOs).toBe(false);
    expect(res.body.data.datasetMarketplaceEngine.storesRawCardData).toBe(false);
    expect(res.body.data.datasetMarketplaceEngine.stripeOrEquivalentRequired).toBe(true);
  });

  it('publishes TM corpus, installs with revenue share, reviews; rejects free plan', async () => {
    const publisher = await seedOrg(prisma, `dmpub_${Date.now()}`);
    const buyer = await seedOrg(prisma, `dmbuy_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const pubWs = publisher.workspaces[0]!.id;
    const buyWs = buyer.workspaces[0]!.id;
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

    const published = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      source: 'tm_corpus',
      title: 'Clinic TM pack',
      category: 'translation',
      licenseType: 'commercial',
      datasetVersion: 'v1',
      priceCents: 1000,
    });
    expect(published.listing.kind).toBe('dataset');
    expect(published.listing.source).toBe('tm_corpus');
    expect(published.listing.verified).toBe(true);
    expect(published.listing.labelStudioOs).toBe(false);
    expect(published.listing.datasetCloudOs).toBe(false);
    expect(published.listing.category).toBe('translation');
    expect(published.listing.pairCount).toBe(1);

    const installed = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyWs,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(installed.entitlement.pairsCopied).toBe(1);
    expect(installed.entitlement.labelStudioOs).toBe(false);
    expect(installed.sale?.amountCents).toBe(1000);
    expect(installed.sale?.applicationFeeCents).toBe(150);

    const buyerTm = await prisma.translationMemoryEntry.count({
      where: { workspaceId: buyWs, approved: true },
    });
    expect(buyerTm).toBeGreaterThanOrEqual(1);

    const updated = await marketplace.updateListing({
      organizationId: publisher.id,
      workspaceId: pubWs,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
      datasetVersion: 'v2',
    });
    expect(updated.listing.datasetVersion).toBe('v2');

    await marketplace.upsertReview({
      organizationId: buyer.id,
      workspaceId: buyWs,
      listingId: published.listing.id,
      userId: buyer.memberships[0]!.userId,
      rating: 5,
      body: 'Useful corpus SKU',
    });
    const reviews = await marketplace.listReviews(published.listing.id);
    expect(reviews.reviews.length).toBe(1);

    const sales = await marketplace.listSales(publisher.id);
    expect(sales.sales.length).toBeGreaterThanOrEqual(1);
    expect(sales.honesty.storesRawCardData).toBe(false);
    expect(sales.honesty.stripeOrEquivalentRequired).toBe(true);

    const free = await seedOrg(prisma, `dmfree_${Date.now()}`);
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        source: 'tm_corpus',
        title: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
