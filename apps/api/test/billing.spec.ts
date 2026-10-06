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


  it('exposes exactly four public plans', () => {
    const plans = listPlans();
    expect(plans.map((p) => p.id)).toEqual(['free', 'pro', 'business', 'enterprise']);
    expect(billing.listPublicPlans()).toHaveLength(4);
  });

  it('maps legacy starter/creator/scale ids onto the four-plan catalog', () => {
    expect(normalizePlanId('starter')).toBe('pro');
    expect(normalizePlanId('creator')).toBe('pro');
    expect(normalizePlanId('scale')).toBe('business');
    expect(PLANS.business.workspaceLimit).toBe(3);
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
});
