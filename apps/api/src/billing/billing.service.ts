import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { planFromId, planHasFeature, isProOrAbove, listPlans, type PlanId, type PlanFeature } from './plans';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly moduleRef: ModuleRef,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.stripe &&
        (process.env.STRIPE_PRICE_ID_PRO || process.env.STRIPE_PRICE_ID_BUSINESS) &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.BILLING_SUCCESS_URL &&
        process.env.BILLING_CANCEL_URL,
    );
  }

  listPublicPlans() {
    return listPlans().map((p) => ({
      id: p.id,
      name: p.name,
      rank: p.rank,
      characterQuota: p.characterQuota,
      workspaceLimit: p.workspaceLimit,
      priceLabel: p.priceLabel,
      priceMonthlyUsd: p.priceMonthlyUsd,
      blurb: p.blurb,
      features: p.features,
      highlight: Boolean(p.highlight),
      checkoutAvailable: Boolean(
        p.stripePriceEnv && process.env[p.stripePriceEnv]?.trim() && this.stripe,
      ),
    }));
  }

  /** Live marketplace Checkout (destination charge + application fee). */
  isMarketplacePaymentsConfigured(): boolean {
    return Boolean(
      this.stripe &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        (process.env.MARKETPLACE_CHECKOUT_SUCCESS_URL || process.env.BILLING_SUCCESS_URL) &&
        (process.env.MARKETPLACE_CHECKOUT_CANCEL_URL || process.env.BILLING_CANCEL_URL),
    );
  }

  isConnectOnboardingConfigured(): boolean {
    return Boolean(
      this.stripe &&
        (process.env.STRIPE_CONNECT_RETURN_URL || process.env.BILLING_SUCCESS_URL) &&
        (process.env.STRIPE_CONNECT_REFRESH_URL || process.env.BILLING_CANCEL_URL),
    );
  }

  platformFeeBps(): number {
    const raw = Number(process.env.MARKETPLACE_PLATFORM_FEE_BPS ?? '2000');
    if (!Number.isFinite(raw) || raw < 0 || raw > 10_000) return 2000;
    return Math.floor(raw);
  }

  applicationFeeCents(amountCents: number): number {
    return Math.min(amountCents, Math.floor((amountCents * this.platformFeeBps()) / 10_000));
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new ApiException(
        'billing_not_configured',
        'STRIPE_SECRET_KEY is not set. Add Stripe keys to enable billing.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return this.stripe;
  }

  async getSummary(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const usage = await this.usage.summary(organizationId);
    const plan = planFromId(org.plan);

    return {
      // Always return normalized PlanId so clients never match legacy SKUs (starter/creator/scale).
      plan: plan.id,
      planName: plan.name,
      planRank: plan.rank,
      features: plan.features,
      workspaceLimit: plan.workspaceLimit,
      billingStatus: org.billingStatus,
      characterQuota: org.characterQuota,
      charactersUsed: usage.characters,
      charactersRemaining: Math.max(org.characterQuota - usage.characters, 0),
      periodStart: usage.periodStart,
      requests: usage.requests,
      stripeConfigured: this.isConfigured(),
      hasCustomer: Boolean(org.stripeCustomerId),
      connectAccountId: org.stripeConnectAccountId,
      connectChargesEnabled: org.stripeConnectChargesEnabled,
      marketplacePaymentsConfigured: this.isMarketplacePaymentsConfigured(),
      platformFeeBps: this.platformFeeBps(),
    };
  }

  async assertWithinQuota(organizationId: string, upcomingCharacters: number) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const usage = await this.usage.summary(organizationId);
    if (usage.characters + upcomingCharacters > org.characterQuota) {
      throw new ApiException(
        'quota_exceeded',
        `Monthly character quota exceeded (${usage.characters}/${org.characterQuota}). Upgrade to Pro.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /** Feature gate for Pro-and-above surfaces (marketplace publish/install). */
  async assertPro(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    if (!isProOrAbove(org.plan)) {
      throw new ApiException(
        'plan_required',
        'This feature requires a Pro plan or higher. Upgrade under Billing.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /** Gate by named entitlement feature on the org plan. */
  async assertFeature(organizationId: string, feature: PlanFeature, message?: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    if (!planHasFeature(org.plan, feature)) {
      throw new ApiException(
        'plan_required',
        message ?? `Plan does not include "${feature}". Upgrade under Billing.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async ensureCustomer(organizationId: string, email?: string) {
    const stripe = this.requireStripe();
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    if (org.stripeCustomerId) {
      return org.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      name: org.name,
      email: email || undefined,
      metadata: { organizationId: org.id },
    });

    await this.prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async getConnectStatus(organizationId: string) {
    await this.assertPro(organizationId);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    if (org.stripeConnectAccountId && this.stripe) {
      try {
        const account = await this.stripe.accounts.retrieve(org.stripeConnectAccountId);
        const chargesEnabled = Boolean(account.charges_enabled);
        if (chargesEnabled !== org.stripeConnectChargesEnabled) {
          await this.prisma.organization.update({
            where: { id: org.id },
            data: { stripeConnectChargesEnabled: chargesEnabled },
          });
        }
        return {
          connected: true,
          accountId: org.stripeConnectAccountId,
          chargesEnabled,
          detailsSubmitted: Boolean(account.details_submitted),
          onboardingConfigured: this.isConnectOnboardingConfigured(),
          marketplacePaymentsConfigured: this.isMarketplacePaymentsConfigured(),
          platformFeeBps: this.platformFeeBps(),
        };
      } catch {
        // fall through to DB cache
      }
    }

    return {
      connected: Boolean(org.stripeConnectAccountId),
      accountId: org.stripeConnectAccountId,
      chargesEnabled: org.stripeConnectChargesEnabled,
      detailsSubmitted: org.stripeConnectChargesEnabled,
      onboardingConfigured: this.isConnectOnboardingConfigured(),
      marketplacePaymentsConfigured: this.isMarketplacePaymentsConfigured(),
      platformFeeBps: this.platformFeeBps(),
    };
  }

  async createConnectOnboardingLink(input: {
    organizationId: string;
    userId: string;
    email?: string;
    ip?: string;
  }) {
    await this.assertPro(input.organizationId);
    if (!this.isConnectOnboardingConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Stripe Connect onboarding is not configured (secret + return/refresh URLs).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const stripe = this.requireStripe();
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
    });

    let accountId = org.stripeConnectAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: input.email || undefined,
        metadata: { organizationId: org.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await this.prisma.organization.update({
        where: { id: org.id },
        data: {
          stripeConnectAccountId: accountId,
          stripeConnectChargesEnabled: Boolean(account.charges_enabled),
        },
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url:
        process.env.STRIPE_CONNECT_REFRESH_URL ?? process.env.BILLING_CANCEL_URL!,
      return_url:
        process.env.STRIPE_CONNECT_RETURN_URL ?? process.env.BILLING_SUCCESS_URL!,
      type: 'account_onboarding',
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'marketplace.connect_onboarding_started',
      route: 'POST /v1/marketplace/connect/onboard',
      ip: input.ip,
      metadata: { accountId },
    });

    return { url: link.url, accountId };
  }

  async createMarketplaceCheckout(input: {
    organizationId: string;
    workspaceId: string;
    userId: string;
    listingId: string;
    listingTitle: string;
    amountCents: number;
    currency: string;
    destinationAccountId: string;
    ip?: string;
  }) {
    if (!this.isMarketplacePaymentsConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Marketplace payments are not configured.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (input.amountCents < 50) {
      throw new ApiException(
        'validation_error',
        'Paid listings must be at least 50 cents',
        HttpStatus.BAD_REQUEST,
      );
    }

    const stripe = this.requireStripe();
    const fee = this.applicationFeeCents(input.amountCents);
    const success =
      process.env.MARKETPLACE_CHECKOUT_SUCCESS_URL ??
      `${process.env.BILLING_SUCCESS_URL}&marketplace=1`;
    const cancel =
      process.env.MARKETPLACE_CHECKOUT_CANCEL_URL ??
      `${process.env.BILLING_CANCEL_URL}&marketplace=1`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency,
            unit_amount: input.amountCents,
            product_data: {
              name: input.listingTitle,
              metadata: { listingId: input.listingId },
            },
          },
        },
      ],
      success_url: success,
      cancel_url: cancel,
      client_reference_id: input.organizationId,
      metadata: {
        type: 'marketplace_listing',
        listingId: input.listingId,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
      },
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: {
          destination: input.destinationAccountId,
        },
        metadata: {
          type: 'marketplace_listing',
          listingId: input.listingId,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'marketplace.checkout_started',
      route: 'POST /v1/marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        sessionId: session.id,
        listingId: input.listingId,
        amountCents: input.amountCents,
        applicationFeeCents: fee,
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
      applicationFeeCents: fee,
    };
  }

  async createCheckoutSession(input: {
    organizationId: string;
    userId: string;
    email?: string;
    ip?: string;
    planId?: PlanId;
  }) {
    if (!this.isConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Stripe billing is not fully configured (secret, price, webhook, success/cancel URLs).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const targetPlan = planFromId(input.planId ?? 'pro');
    if (targetPlan.id === 'free' || targetPlan.id === 'enterprise' || !targetPlan.stripePriceEnv) {
      throw new ApiException(
        'validation_error',
        targetPlan.id === 'enterprise'
          ? 'Enterprise is sold via sales — talk to us.'
          : 'Select a paid plan to checkout.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const priceId = process.env[targetPlan.stripePriceEnv]?.trim();
    if (!priceId) {
      throw new ApiException(
        'billing_not_configured',
        `${targetPlan.stripePriceEnv} is not set for ${targetPlan.name}.`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const stripe = this.requireStripe();
    const customerId = await this.ensureCustomer(input.organizationId, input.email);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.BILLING_SUCCESS_URL!,
      cancel_url: process.env.BILLING_CANCEL_URL!,
      client_reference_id: input.organizationId,
      metadata: { organizationId: input.organizationId, planId: targetPlan.id },
      subscription_data: {
        metadata: { organizationId: input.organizationId, planId: targetPlan.id },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'billing.checkout_started',
      route: 'POST /v1/billing/checkout',
      ip: input.ip,
      metadata: { sessionId: session.id, planId: targetPlan.id },
    });

    return { url: session.url, planId: targetPlan.id };
  }

  async createPortalSession(input: { organizationId: string; userId: string; ip?: string }) {
    if (!this.isConfigured()) {
      throw new ApiException(
        'billing_not_configured',
        'Stripe billing is not fully configured.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const stripe = this.requireStripe();
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
    });

    if (!org.stripeCustomerId) {
      throw new ApiException(
        'billing_no_customer',
        'No Stripe customer yet. Start checkout first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: process.env.BILLING_PORTAL_RETURN_URL ?? process.env.BILLING_SUCCESS_URL!,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'billing.portal_opened',
      route: 'POST /v1/billing/portal',
      ip: input.ip,
    });

    return { url: portal.url };
  }

  async applyEntitlement(input: {
    organizationId: string;
    plan: PlanId;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    billingStatus?: string;
  }) {
    const plan = planFromId(input.plan);
    const updated = await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        plan: plan.id,
        characterQuota: plan.characterQuota,
        billingStatus: input.billingStatus ?? 'active',
        ...(input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {}),
        ...(input.stripeSubscriptionId !== undefined
          ? { stripeSubscriptionId: input.stripeSubscriptionId }
          : {}),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      action: 'billing.plan_changed',
      route: 'stripe.webhook',
      metadata: {
        plan: updated.plan,
        characterQuota: updated.characterQuota,
        billingStatus: updated.billingStatus,
      },
    });

    return updated;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.requireStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new ApiException(
        'billing_not_configured',
        'STRIPE_WEBHOOK_SECRET is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new ApiException('invalid_webhook', 'Invalid Stripe webhook signature', HttpStatus.BAD_REQUEST);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'payment' && session.metadata?.type === 'marketplace_listing') {
          const { MarketplaceService } = await import('../marketplace/marketplace.service');
          const marketplace = this.moduleRef.get(MarketplaceService, { strict: false });
          await marketplace.fulfillPaidCheckout({
            sessionId: session.id,
            listingId: session.metadata.listingId,
            organizationId: session.metadata.organizationId,
            workspaceId: session.metadata.workspaceId,
            userId: session.metadata.userId,
            amountTotal: session.amount_total ?? 0,
            currency: session.currency ?? 'usd',
          });
          break;
        }

        const organizationId =
          session.metadata?.organizationId ?? session.client_reference_id ?? undefined;
        if (organizationId && session.mode === 'subscription') {
          const planId = (session.metadata?.planId as PlanId | undefined) ?? 'pro';
          await this.applyEntitlement({
            organizationId,
            plan: planFromId(planId).id,
            stripeCustomerId:
              typeof session.customer === 'string' ? session.customer : session.customer?.id,
            stripeSubscriptionId:
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id,
            billingStatus: 'active',
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;
        if (!organizationId) break;

        if (event.type === 'customer.subscription.deleted' || subscription.status === 'canceled') {
          await this.applyEntitlement({
            organizationId,
            plan: 'free',
            stripeSubscriptionId: null,
            billingStatus: 'canceled',
          });
        } else {
          const status =
            subscription.status === 'active' || subscription.status === 'trialing'
              ? 'active'
              : subscription.status;
          const planId = (subscription.metadata?.planId as PlanId | undefined) ?? 'pro';
          await this.applyEntitlement({
            organizationId,
            plan: planFromId(planId).id,
            stripeSubscriptionId: subscription.id,
            billingStatus: status,
          });
        }
        break;
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await this.prisma.organization.updateMany({
          where: { stripeConnectAccountId: account.id },
          data: { stripeConnectChargesEnabled: Boolean(account.charges_enabled) },
        });
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  /** Test helper — apply entitlement without Stripe. */
  applyEntitlementForTests(input: {
    organizationId: string;
    plan: PlanId;
    characterQuota?: number;
  }) {
    const plan = planFromId(input.plan);
    return this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        plan: plan.id,
        characterQuota: input.characterQuota ?? plan.characterQuota,
        billingStatus: 'active',
      },
    });
  }

  /** Test helper — mark org as Connect-ready without Stripe. */
  setConnectForTests(input: {
    organizationId: string;
    accountId?: string;
    chargesEnabled?: boolean;
  }) {
    return this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        stripeConnectAccountId: input.accountId ?? `acct_test_${input.organizationId}`,
        stripeConnectChargesEnabled: input.chargesEnabled ?? true,
      },
    });
  }
}
