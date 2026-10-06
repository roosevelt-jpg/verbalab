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
import { ModelMarketplaceService } from '../src/model-marketplace/model-marketplace.service';
import { ModelsService } from '../src/models/models.service';
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
              clerkUserId: `clerk_mm_${name}_${Date.now()}_${Math.random()}`,
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

describe('Model Marketplace (VL-251)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let marketplace: ModelMarketplaceService;
  let models: ModelsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    marketplace = app.get(ModelMarketplaceService);
    models = app.get(ModelsService);
    await models.ensureVendorDefaults();
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Model Marketplace honesty (not HF OS; Stripe-only)', () => {
    const doc = join(root, 'docs/MODEL_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0153-model-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-251');
    expect(text).toMatch(/Hugging Face|huggingFaceOs/i);
    expect(text).toMatch(/Stripe|storesRawCardData/i);
    expect(text).toMatch(/weight/i);
  });

  it('has no TODO/FIXME markers in Model Marketplace source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'model-marketplace'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with real-money + anti-HF honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/model-marketplace/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Model Marketplace');
    expect(res.body.honesty.huggingFaceOs).toBe(false);
    expect(res.body.honesty.weightHostingOs).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);
    expect(res.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.honesty.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.safety.storesRawCardData).toBe(false);
    expect(res.body.docs).toBe('/docs/MODEL_MARKETPLACE.md');
    expect(res.body.categories.some((c: { id: string }) => c.id === 'foundation')).toBe(true);
  });

  it('exposes modelMarketplaceEngine via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ modelMarketplaceEngine { product huggingFaceOs weightHostingOs storesRawCardData stripeOrEquivalentRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.modelMarketplaceEngine.product).toContain('Model Marketplace');
    expect(res.body.data.modelMarketplaceEngine.huggingFaceOs).toBe(false);
    expect(res.body.data.modelMarketplaceEngine.weightHostingOs).toBe(false);
    expect(res.body.data.modelMarketplaceEngine.storesRawCardData).toBe(false);
    expect(res.body.data.modelMarketplaceEngine.stripeOrEquivalentRequired).toBe(true);
  });

  it('publishes, installs with revenue share, reviews; rejects free plan', async () => {
    const publisher = await seedOrg(prisma, `mmpub_${Date.now()}`);
    const buyer = await seedOrg(prisma, `mmbuy_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const published = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      modelSlug: 'vendor-chat-openai',
      title: 'Chat OpenAI Commercial',
      category: 'commercial',
      licenseType: 'commercial',
      modelVersion: 'v1',
      priceCents: 1000,
    });
    expect(published.listing.kind).toBe('model');
    expect(published.listing.modelSlug).toBe('vendor-chat-openai');
    expect(published.listing.verified).toBe(true);
    expect(published.listing.weightHosted).toBe(false);
    expect(published.listing.category).toBe('commercial');

    const installed = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(installed.entitlement.weightDownload).toBe(false);
    expect(installed.sale?.amountCents).toBe(1000);
    expect(installed.sale?.applicationFeeCents).toBe(150);

    const updated = await marketplace.updateListing({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
      modelVersion: 'v2',
    });
    expect(updated.listing.modelVersion).toBe('v2');

    await marketplace.upsertReview({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      listingId: published.listing.id,
      userId: buyer.memberships[0]!.userId,
      rating: 4,
      body: 'Useful license SKU',
    });
    const reviews = await marketplace.listReviews(published.listing.id);
    expect(reviews.reviews.length).toBe(1);

    const sales = await marketplace.listSales(publisher.id);
    expect(sales.sales.length).toBeGreaterThanOrEqual(1);
    expect(sales.honesty.storesRawCardData).toBe(false);
    expect(sales.honesty.stripeOrEquivalentRequired).toBe(true);

    const free = await seedOrg(prisma, `mmfree_${Date.now()}`);
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        modelSlug: 'vendor-chat-openai',
        title: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
