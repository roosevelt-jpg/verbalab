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
import { CreatorEconomyService } from '../src/creator-economy/creator-economy.service';
import {
  ROYALTY_HAND_CHECK_SCENARIOS,
  splitRevenue,
} from '../src/creator-economy/creator-economy.catalog';
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
              clerkUserId: `clerk_ce_${name}_${Date.now()}_${Math.random()}`,
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

describe('Creator Economy', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let economy: CreatorEconomyService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    economy = app.get(CreatorEconomyService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Creator Economy honesty (Stripe-only; tax/dispute gaps)', () => {
    const doc = join(root, 'docs/CREATOR_ECONOMY.md');
    const adr = join(root, 'docs/adr/0160-creator-economy.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('');
    expect(text).toMatch(/Stripe|storesRawCardData/i);
    expect(text).toMatch(/taxHandlingComplete/i);
    expect(text).toMatch(/hand-check|splitRevenue/i);
  });

  it('has no TODO/FIXME markers in Creator Economy source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'creator-economy'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('hand-checks all royalty scenarios (pure math)', () => {
    for (const s of ROYALTY_HAND_CHECK_SCENARIOS) {
      const split = splitRevenue({ amountCents: s.amountCents, feeBps: s.feeBps });
      expect(split.applicationFeeCents).toBe(s.fee);
      expect(split.publisherNetCents).toBe(s.net);
      expect(split.applicationFeeCents + split.publisherNetCents).toBe(s.amountCents);
    }
    const scenarios = economy.royaltyScenarios();
    expect(scenarios.allHandChecksPassed).toBe(true);
  });

  it('exposes engine with real-money + tax/dispute honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/creator-economy/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Creator Economy');
    expect(res.body.honesty.paymentProcessorOs).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);
    expect(res.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.honesty.taxHandlingComplete).toBe(false);
    expect(res.body.honesty.disputeChargebackComplete).toBe(false);
    expect(res.body.honesty.creatorPayoutMathVerifiedLive).toBe(false);
    expect(res.body.honesty.creatorPayoutMathHandCheckedInTests).toBe(true);
    expect(res.body.royalty.ecosystemHubFeeBps).toBe(1500);
    expect(res.body.docs).toBe('/docs/CREATOR_ECONOMY.md');
  });

  it('exposes creatorEconomyEngine via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ creatorEconomyEngine { product paymentProcessorOs taxHandlingComplete disputeChargebackComplete creatorPayoutMathVerifiedLive creatorPayoutMathHandCheckedInTests storesRawCardData stripeOrEquivalentRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.creatorEconomyEngine.product).toContain('Creator Economy');
    expect(res.body.data.creatorEconomyEngine.paymentProcessorOs).toBe(false);
    expect(res.body.data.creatorEconomyEngine.taxHandlingComplete).toBe(false);
    expect(res.body.data.creatorEconomyEngine.disputeChargebackComplete).toBe(false);
    expect(res.body.data.creatorEconomyEngine.creatorPayoutMathVerifiedLive).toBe(false);
    expect(res.body.data.creatorEconomyEngine.creatorPayoutMathHandCheckedInTests).toBe(true);
    expect(res.body.data.creatorEconomyEngine.storesRawCardData).toBe(false);
  });

  it('previews royalty, profiles, tax gaps; rejects free plan', async () => {
    const org = await seedOrg(prisma, `cepub_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: org.id, plan: 'pro' });

    const preview = await economy.previewRoyalty({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      role: 'owner',
      amountCents: 1000,
      schedule: 'ecosystem_hub',
    });
    expect(preview.applicationFeeCents).toBe(150);
    expect(preview.publisherNetCents).toBe(850);

    const content = await economy.previewRoyalty({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      role: 'owner',
      amountCents: 1000,
      schedule: 'content_marketplace',
    });
    expect(content.feeBps).toBe(billing.platformFeeBps());
    expect(content.applicationFeeCents).toBe(billing.applicationFeeCents(1000));

    const creator = await economy.creatorProfile(org.id);
    expect(creator.profile.organizationId).toBe(org.id);

    const tax = await economy.taxReporting();
    expect(tax.honesty.taxHandlingComplete).toBe(false);
    const disputes = await economy.disputes();
    expect(disputes.honesty.disputeChargebackComplete).toBe(false);

    const free = await seedOrg(prisma, `cefree_${Date.now()}`);
    await expect(
      economy.previewRoyalty({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        amountCents: 1000,
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
