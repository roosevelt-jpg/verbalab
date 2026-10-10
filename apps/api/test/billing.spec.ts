import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { BillingService } from '../src/billing/billing.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { PLANS, listPlans, normalizePlanId } from '../src/billing/plans';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_bill_${name}_${Date.now()}_${Math.random()}`,
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

describe('Billing', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let billing: BillingService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    billing = app.get(BillingService);

    app.get(GatewayService).setProviderForTests({
      name: 'fixture',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });


  it('exposes exactly four public plans', async () => {
    const plans = listPlans();
    expect(plans.map((p) => p.id)).toEqual(['free', 'pro', 'business', 'enterprise']);
    expect(await billing.listPublicPlans()).toHaveLength(4);
  });

  it('maps legacy starter/creator/scale ids onto the four-plan catalog', () => {
    expect(normalizePlanId('starter')).toBe('pro');
    expect(normalizePlanId('creator')).toBe('pro');
    expect(normalizePlanId('scale')).toBe('business');
    expect(PLANS.business.workspaceLimit).toBe(3);
  });

  it('normalizes legacy org.plan values in getSummary', async () => {
    const org = await seedOrg(prisma, 'legacyPlan');
    await prisma.organization.update({
      where: { id: org.id },
      data: { plan: 'starter', characterQuota: PLANS.pro.characterQuota },
    });
    const summary = await billing.getSummary(org.id);
    expect(summary.plan).toBe('pro');
    expect(summary.planName).toBe('Pro');
    const persisted = await prisma.organization.findUniqueOrThrow({ where: { id: org.id } });
    expect(persisted.plan).toBe('pro');
  });

  it('maps creator → pro and scale → business when summarizing', async () => {
    const creatorOrg = await seedOrg(prisma, 'legacyCreator');
    await prisma.organization.update({
      where: { id: creatorOrg.id },
      data: { plan: 'creator' },
    });
    expect((await billing.getSummary(creatorOrg.id)).plan).toBe('pro');

    const scaleOrg = await seedOrg(prisma, 'legacyScale');
    await prisma.organization.update({
      where: { id: scaleOrg.id },
      data: { plan: 'scale' },
    });
    expect((await billing.getSummary(scaleOrg.id)).plan).toBe('business');
  });

  it('defaults new orgs to free plan quota', async () => {
    const org = await seedOrg(prisma, 'freeDefault');
    const summary = await billing.getSummary(org.id);
    expect(summary.plan).toBe('free');
    expect(summary.characterQuota).toBe(PLANS.free.characterQuota);
    expect(summary.charactersUsed).toBe(0);
  });

  it('rejects translate when monthly quota is exceeded', async () => {
    const org = await seedOrg(prisma, 'quota');
    await billing.applyEntitlementForTests({
      organizationId: org.id,
      plan: 'free',
      characterQuota: 5,
    });

    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'quota-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hello!!', source: 'en', target: 'sw' })
      .expect(402);

    expect(res.body.error.code).toBe('quota_exceeded');
  });

  it('allows translate within quota and tracks usage against entitlement', async () => {
    const org = await seedOrg(prisma, 'within');
    await billing.applyEntitlementForTests({
      organizationId: org.id,
      plan: 'free',
      characterQuota: 100,
    });

    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ok-key',
    });

    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hi', source: 'en', target: 'sw' })
      .expect(200);

    const summary = await billing.getSummary(org.id);
    expect(summary.charactersUsed).toBe(2);
    expect(summary.charactersRemaining).toBe(98);
  });

  it('applies pro entitlement from webhook-style helper', async () => {
    const org = await seedOrg(prisma, 'pro');
    await billing.applyEntitlement({
      organizationId: org.id,
      plan: 'pro',
      stripeCustomerId: `cus_test_${org.id}`,
      stripeSubscriptionId: `sub_test_${org.id}`,
      billingStatus: 'active',
    });

    const summary = await billing.getSummary(org.id);
    expect(summary.plan).toBe('pro');
    expect(summary.characterQuota).toBe(PLANS.pro.characterQuota);
    expect(summary.hasCustomer).toBe(true);

    const events = await prisma.auditEvent.findMany({
      where: { organizationId: org.id, action: 'billing.plan_changed' },
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it('checkout returns billing_not_configured without Stripe env', async () => {
    // Without Clerk we cannot hit the guarded route; exercise the service directly.
    const org = await seedOrg(prisma, 'nocheckout');
    await expect(
      billing.createCheckoutSession({
        organizationId: org.id,
        userId: org.memberships[0]!.userId,
      }),
    ).rejects.toMatchObject({ code: 'billing_not_configured' });
  });

  it('webhook without signature fails', async () => {
    await request(app.getHttpServer()).post('/v1/billing/webhook').send({ hello: 'stripe' }).expect(400);
  });

  it('enforces product-level quotas on TTS, STT, and Chat', async () => {
    const org = await seedOrg(prisma, 'productQuotas');
    await billing.applyEntitlementForTests({
      organizationId: org.id,
      plan: 'free',
      characterQuota: 100,
    });

    // Should succeed within limits
    await expect(billing.assertProductQuota(org.id, 'tts', 100)).resolves.not.toThrow();

    // Over limits throws quota_exceeded
    await expect(billing.assertProductQuota(org.id, 'tts', 100_000_000)).rejects.toMatchObject({
      code: 'quota_exceeded',
    });
    await expect(billing.assertProductQuota(org.id, 'stt', 100_000)).rejects.toMatchObject({
      code: 'quota_exceeded',
    });
    await expect(billing.assertProductQuota(org.id, 'chat', 100_000_000)).rejects.toMatchObject({
      code: 'quota_exceeded',
    });
  });

  it('allows platform admin to create, update, and assign plans', async () => {
    const adminUserId = 'usr_admin_test_1';
    const planSlug = `custom-partner-${Date.now()}`;
    const plan = await billing.adminCreatePlan({
      id: planSlug,
      name: 'Custom Partner',
      rank: 2,
      characterQuota: 5_000_000,
      sttMinutesQuota: 800,
      ttsCharsQuota: 5_000_000,
      translateCharsQuota: 5_000_000,
      chatTokensQuota: 2_000_000,
      priceMonthlyUsd: 199,
      priceLabel: '$199',
      actorUserId: adminUserId,
    });

    expect(plan.id).toBe(planSlug);
    expect(plan.sttMinutesQuota).toBe(800);

    const updated = await billing.adminUpdatePlan(
      planSlug,
      { sttMinutesQuota: 1200 },
      adminUserId,
    );
    expect(updated.sttMinutesQuota).toBe(1200);

    const org = await seedOrg(prisma, 'adminAssign');
    const assigned = await billing.adminAssignPlan({
      organizationId: org.id,
      planId: planSlug,
      actorUserId: adminUserId,
    });
    expect(assigned.plan).toBe(planSlug);

    const summary = await billing.getSummary(org.id);
    expect(summary.plan).toBe(planSlug);
    expect(summary.quotas.stt.quotaMinutes).toBe(1200);

    // Clean up created plan so other tests see clean 4 base plans
    await prisma.planCatalogEntry.delete({ where: { id: planSlug } });
  });

  it('applies admin catalog feature edits to assertFeature for orgs on that plan', async () => {
    const adminUserId = 'usr_admin_features_1';
    const org = await seedOrg(prisma, 'adminFeaturesLive');
    await billing.applyEntitlementForTests({ organizationId: org.id, plan: 'free' });

    await expect(billing.assertFeature(org.id, 'marketplace')).rejects.toMatchObject({
      code: 'plan_required',
    });

    await billing.adminUpdatePlan(
      'free',
      {
        features: ['speech', 'translate', 'playground', 'marketplace', 'voiceClones'],
        priceLabel: '$0',
        priceMonthlyUsd: 0,
      },
      adminUserId,
    );

    await expect(billing.assertFeature(org.id, 'marketplace')).resolves.not.toThrow();
    await expect(billing.assertFeature(org.id, 'voiceClones')).resolves.not.toThrow();
    await expect(billing.assertFeature(org.id, 'sso')).rejects.toMatchObject({
      code: 'plan_required',
    });

    const resolved = await billing.resolvePlan('free');
    expect(resolved.features).toContain('marketplace');

    await prisma.planCatalogEntry.delete({ where: { id: 'free' } }).catch(() => undefined);
  });

  it('purchases and applies top-up credits upon plan quota exhaustion', async () => {
    const org = await seedOrg(prisma, 'topupTest');
    await billing.applyEntitlementForTests({
      organizationId: org.id,
      plan: 'free',
      characterQuota: 10,
    });

    // Verify mock purchase grants credits immediately
    const res = await billing.purchaseTopUp({
      organizationId: org.id,
      userId: org.memberships[0]!.userId,
      packId: 'topup_tts_100k',
    });

    expect(res.mode).toBe('mock');
    expect(res.unitsGranted).toBe(100_000);

    const credits = await billing.getTopUpCredits(org.id);
    expect(credits.tts).toBe(100_000);

    // Now assertProductQuota for 50,000 tts chars succeeds due to top-up
    await expect(billing.assertProductQuota(org.id, 'tts', 50_000)).resolves.not.toThrow();

    const summary = await billing.getSummary(org.id);
    expect(summary.topUps.tts).toBe(100_000);
    expect(summary.quotas.tts.quotaChars).toBeGreaterThanOrEqual(100_000);
  });
});
