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
import { VoiceLanguageMarketplaceService } from '../src/voice-language-marketplace/voice-language-marketplace.service';
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
              clerkUserId: `clerk_vlm_${name}_${Date.now()}_${Math.random()}`,
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

describe('Voice & Language Marketplace (VL-257)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let billing: BillingService;
  let marketplace: VoiceLanguageMarketplaceService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    billing = app.get(BillingService);
    marketplace = app.get(VoiceLanguageMarketplaceService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Voice & Language Marketplace honesty (not ElevenLabs OS; Stripe-only)', () => {
    const doc = join(root, 'docs/VOICE_LANGUAGE_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0159-voice-language-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-257');
    expect(text).toMatch(/ElevenLabs|elevenLabsOs/i);
    expect(text).toMatch(/Stripe|storesRawCardData/i);
    expect(text).toMatch(/celebrityWithoutRights/i);
  });

  it('has no TODO/FIXME markers in Voice & Language Marketplace source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'voice-language-marketplace'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with real-money + anti-CDN honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/voice-language-marketplace/engine')
      .expect(200);
    expect(res.body.product).toBe('VerbaLab Voice & Language Marketplace');
    expect(res.body.honesty.elevenLabsOs).toBe(false);
    expect(res.body.honesty.voiceCdnOs).toBe(false);
    expect(res.body.honesty.celebrityWithoutRights).toBe(false);
    expect(res.body.honesty.crossTenantCloneSynthesis).toBe(false);
    expect(res.body.honesty.storesRawCardData).toBe(false);
    expect(res.body.honesty.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.honesty.fabricPolicyHardGateRequired).toBe(true);
    expect(res.body.safety.storesRawCardData).toBe(false);
    expect(res.body.docs).toBe('/docs/VOICE_LANGUAGE_MARKETPLACE.md');
    expect(res.body.packTypes.some((c: { id: string }) => c.id === 'language')).toBe(true);
    expect(res.body.packs.some((c: { key: string }) => c.key === 'language.sw')).toBe(true);
  });

  it('exposes voiceLanguageMarketplaceEngine via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ voiceLanguageMarketplaceEngine { product elevenLabsOs voiceCdnOs celebrityWithoutRights crossTenantCloneSynthesis storesRawCardData stripeOrEquivalentRequired capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.voiceLanguageMarketplaceEngine.product).toContain(
      'Voice & Language Marketplace',
    );
    expect(res.body.data.voiceLanguageMarketplaceEngine.elevenLabsOs).toBe(false);
    expect(res.body.data.voiceLanguageMarketplaceEngine.voiceCdnOs).toBe(false);
    expect(res.body.data.voiceLanguageMarketplaceEngine.celebrityWithoutRights).toBe(false);
    expect(res.body.data.voiceLanguageMarketplaceEngine.crossTenantCloneSynthesis).toBe(false);
    expect(res.body.data.voiceLanguageMarketplaceEngine.storesRawCardData).toBe(false);
    expect(res.body.data.voiceLanguageMarketplaceEngine.stripeOrEquivalentRequired).toBe(true);
  });

  it('publishes, installs with revenue share, rejects celebrity + free plan', async () => {
    const publisher = await seedOrg(prisma, `vlmpub_${Date.now()}`);
    const buyer = await seedOrg(prisma, `vlmbuy_${Date.now()}`);
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    await expect(
      marketplace.publish({
        organizationId: publisher.id,
        workspaceId: publisher.workspaces[0]!.id,
        userId: publisher.memberships[0]!.userId,
        role: 'owner',
        packKey: 'language.sw',
        celebrityClaim: true,
      }),
    ).rejects.toMatchObject({ code: 'celebrity_without_rights' });

    const published = await marketplace.publish({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      packKey: 'language.sw',
      title: 'Swahili Pack SKU',
      packType: 'language',
      packVersion: 'v1',
      priceCents: 1000,
    });
    expect(published.listing.kind).toBe('voice_language');
    expect(published.listing.packKey).toBe('language.sw');
    expect(published.listing.verified).toBe(true);
    expect(published.listing.voiceCdnHosted).toBe(false);
    expect(published.listing.celebrityWithoutRights).toBe(false);
    expect(published.listing.packType).toBe('language');

    const installed = await marketplace.install({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
    });
    expect(installed.entitlement.voiceCdnHosted).toBe(false);
    expect(installed.entitlement.storesRawCardData).toBe(false);
    expect(installed.sale?.amountCents).toBe(1000);
    expect(installed.sale?.applicationFeeCents).toBe(150);

    const updated = await marketplace.updateListing({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      role: 'owner',
      listingId: published.listing.id,
      packVersion: 'v2',
    });
    expect(updated.listing.packVersion).toBe('v2');

    await marketplace.upsertReview({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      listingId: published.listing.id,
      userId: buyer.memberships[0]!.userId,
      rating: 5,
      body: 'Useful language pack entitlement',
    });
    const reviews = await marketplace.listReviews(published.listing.id);
    expect(reviews.reviews.length).toBe(1);

    const sales = await marketplace.listSales(publisher.id);
    expect(sales.sales.length).toBeGreaterThanOrEqual(1);
    expect(sales.honesty.storesRawCardData).toBe(false);
    expect(sales.honesty.stripeOrEquivalentRequired).toBe(true);

    const free = await seedOrg(prisma, `vlmfree_${Date.now()}`);
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        packKey: 'language.sw',
        title: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });
  });
});
