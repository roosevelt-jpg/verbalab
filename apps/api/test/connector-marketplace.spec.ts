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
import { ConnectorMarketplaceService } from '../src/connector-marketplace/connector-marketplace.service';
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
              clerkUserId: `clerk_cm_${name}_${Date.now()}_${Math.random()}`,
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

describe('Connector Marketplace (VL-256)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let marketplace: ConnectorMarketplaceService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    marketplace = app.get(ConnectorMarketplaceService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Connector Marketplace honesty (not iPaaS OS; Stripe-only)', () => {
    const doc = join(root, 'docs/CONNECTOR_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0158-connector-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-256');
    expect(text).toMatch(/Zapier|iPaaS|ipaasOs/i);
    expect(text).toMatch(/Stripe|storesRawCardData/i);
    expect(text).toMatch(/liveConnectorExecution/i);
  });

  it('has no TODO/FIXME markers in Connector Marketplace source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'connector-marketplace'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with real-money + anti-iPaaS honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/connector-marketplace/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Connector Marketplace');
    expect(res.body.honesty.liveConnectorExecution).toBe(false);
    expect(res.body.honesty.ipaasOs).toBe(false);
    expect(res.body.honesty.zapierOs).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);
    expect(res.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.honesty.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.honesty.sandboxRequired).toBe(true);
    expect(res.body.safety.storesRawCardData).toBe(false);
    expect(res.body.docs).toBe('/docs/CONNECTOR_MARKETPLACE.md');
    expect(res.body.categories.some((c: { id: string }) => c.id === 'crm')).toBe(true);
    expect(res.body.connectors.some((c: { key: string }) => c.key === 'slack')).toBe(true);
  });

  it('exposes connectorMarketplaceEngine via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ connectorMarketplaceEngine { product liveConnectorExecution sandboxRequired fabricPolicyHardGateRequired ipaasOs storesRawCardData stripeOrEquivalentRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.connectorMarketplaceEngine.product).toContain('Connector Marketplace');
    expect(res.body.data.connectorMarketplaceEngine.liveConnectorExecution).toBe(false);
    expect(res.body.data.connectorMarketplaceEngine.sandboxRequired).toBe(true);
    expect(res.body.data.connectorMarketplaceEngine.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.data.connectorMarketplaceEngine.ipaasOs).toBe(false);
    expect(res.body.data.connectorMarketplaceEngine.storesRawCardData).toBe(false);
    expect(res.body.data.connectorMarketplaceEngine.stripeOrEquivalentRequired).toBe(true);
  });

  it('publishes, installs with revenue share, reviews; rejects free plan', async () => {
    const publisher = await seedOrg(prisma, `cmpub_${Date.now()}`);
    const buyer = await seedOrg(prisma, `cmbuy_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const published = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      connectorKey: 'slack',
      title: 'Slack Connector SKU',
      category: 'cloud',
      connectorVersion: 'v1',
      priceCents: 1000,
    });
    expect(published.listing.kind).toBe('connector');
    expect(published.listing.connectorKey).toBe('slack');
    expect(published.listing.verified).toBe(true);
    expect(published.listing.liveConnectorExecution).toBe(false);
    expect(published.listing.storesRawCardData).toBe(false);
    expect(published.listing.category).toBe('cloud');

    const installed = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(installed.entitlement.liveConnectorExecution).toBe(false);
    expect(installed.entitlement.storesRawCardData).toBe(false);
    expect(installed.sale?.amountCents).toBe(1000);
    expect(installed.sale?.applicationFeeCents).toBe(150);

    const updated = await marketplace.updateListing({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
      connectorVersion: 'v2',
    });
    expect(updated.listing.connectorVersion).toBe('v2');

    await marketplace.upsertReview({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      listingId: published.listing.id,
      userId: buyer.memberships[0]!.userId,
      rating: 5,
      body: 'Useful connector entitlement',
    });
    const reviews = await marketplace.listReviews(published.listing.id);
    expect(reviews.reviews.length).toBe(1);

    const sales = await marketplace.listSales(publisher.id);
    expect(sales.sales.length).toBeGreaterThanOrEqual(1);
    expect(sales.honesty.storesRawCardData).toBe(false);
    expect(sales.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(sales.honesty.liveConnectorExecution).toBe(false);

    const payments = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      connectorKey: 'payments.generic',
      title: 'Payments Metadata SKU',
      priceCents: 0,
    });
    expect(payments.listing.storesRawCardData).toBe(false);
    expect(payments.listing.category).toBe('payments');

    const free = await seedOrg(prisma, `cmfree_${Date.now()}`);
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        connectorKey: 'slack',
        title: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
