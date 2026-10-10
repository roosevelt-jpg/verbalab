import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import {
  planFromId,
  planHasFeature,
  isProOrAbove,
  listPlans,
  normalizePlanId,
  BASE_PLAN_IDS,
  PLANS,
  type PlanId,
  type PlanFeature,
  type PlanDefinition,
} from './plans';
import { TOP_UP_PACKS, getTopUpPack, type TopUpPack } from './top-up-packs';
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

  getAvailableTopUpPacks(): TopUpPack[] {
    return TOP_UP_PACKS;
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

  async listAllPlans(): Promise<PlanDefinition[]> {
    const dbPlans = await this.prisma.planCatalogEntry.findMany({
      where: { active: true },
    });
    const customMap = new Map(dbPlans.map((p) => [p.id, p]));
    const base = listPlans().map((p) => {
      const override = customMap.get(p.id);
      if (!override) return p;
      return {
        ...p,
        name: override.name,
        rank: override.rank,
        characterQuota: override.characterQuota,
        sttMinutesQuota: override.sttMinutesQuota,
        ttsCharsQuota: override.ttsCharsQuota,
        translateCharsQuota: override.translateCharsQuota,
        chatTokensQuota: override.chatTokensQuota,
        ocrPagesQuota: override.ocrPagesQuota,
        workspaceLimit: override.workspaceLimit,
        priceMonthlyUsd: override.priceMonthlyUsd,
        priceLabel: override.priceLabel,
        blurb: override.blurb,
        features: (override.features as PlanFeature[]) ?? p.features,
      };
    });

    const customs = dbPlans
      .filter((p) => p.isCustom)
      .map((override) => ({
        id: override.id,
        name: override.name,
        rank: override.rank,
        characterQuota: override.characterQuota,
        sttMinutesQuota: override.sttMinutesQuota,
        ttsCharsQuota: override.ttsCharsQuota,
        translateCharsQuota: override.translateCharsQuota,
        chatTokensQuota: override.chatTokensQuota,
        ocrPagesQuota: override.ocrPagesQuota,
        workspaceLimit: override.workspaceLimit,
        priceMonthlyUsd: override.priceMonthlyUsd,
        priceLabel: override.priceLabel,
        blurb: override.blurb,
        features: (override.features as PlanFeature[]) ?? ['speech', 'translate', 'playground'],
        rateLimitPerKey: 300,
        rateLimitPerOrg: 1000,
        isCustom: true,
      }));

    return [...base, ...customs];
  }

  async resolvePlan(id: string): Promise<PlanDefinition> {
    const dbEntry = await this.prisma.planCatalogEntry.findUnique({
      where: { id: normalizePlanId(id) },
    });
    const fallback = planFromId(id);
    if (!dbEntry) return fallback;
    return {
      ...fallback,
      name: dbEntry.name,
      rank: dbEntry.rank,
      characterQuota: dbEntry.characterQuota,
      sttMinutesQuota: dbEntry.sttMinutesQuota,
      ttsCharsQuota: dbEntry.ttsCharsQuota,
      translateCharsQuota: dbEntry.translateCharsQuota,
      chatTokensQuota: dbEntry.chatTokensQuota,
      ocrPagesQuota: dbEntry.ocrPagesQuota,
      workspaceLimit: dbEntry.workspaceLimit,
      priceMonthlyUsd: dbEntry.priceMonthlyUsd,
      priceLabel: dbEntry.priceLabel,
      blurb: dbEntry.blurb,
      features: (dbEntry.features as PlanFeature[]) ?? fallback.features,
      isCustom: dbEntry.isCustom,
    };
  }

  async listPublicPlans() {
    const all = await this.listAllPlans();
    return all.map((p) => ({
      id: p.id,
      name: p.name,
      rank: p.rank,
      characterQuota: p.characterQuota,
      sttMinutesQuota: p.sttMinutesQuota,
      ttsCharsQuota: p.ttsCharsQuota,
      translateCharsQuota: p.translateCharsQuota,
      chatTokensQuota: p.chatTokensQuota,
      ocrPagesQuota: p.ocrPagesQuota,
      workspaceLimit: p.workspaceLimit,
      priceLabel: p.priceLabel,
      priceMonthlyUsd: p.priceMonthlyUsd,
      blurb: p.blurb,
      features: p.features,
      highlight: Boolean(p.highlight),
      isCustom: Boolean(p.isCustom),
      checkoutAvailable: Boolean(
        (p.stripePriceEnv && process.env[p.stripePriceEnv]?.trim() && this.stripe) ||
          p.id === 'free',
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

  /**
   * Persist legacy starter/creator/scale (and other unknown) plan ids onto the
   * four-plan catalog so UI current-plan matching and admin filters stay consistent.
   */
  async ensureCanonicalPlan(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const canonical = normalizePlanId(org.plan);
    if (org.plan === canonical) {
      return org;
    }
    const plan = planFromId(canonical);
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan: canonical,
        characterQuota: org.characterQuota ? org.characterQuota : plan.characterQuota,
      },
    });
  }

  async getTopUpCredits(organizationId: string) {
    const purchases = await this.prisma.topUpPurchase.findMany({
      where: { organizationId, status: 'completed' },
    });
    const credits: Record<string, number> = {
      tts: 0,
      stt: 0,
      translate: 0,
      chat: 0,
      general: 0,
    };
    for (const p of purchases) {
      credits[p.productKind] = (credits[p.productKind] ?? 0) + p.unitsGranted;
    }
    return credits;
  }

  async getSummary(organizationId: string) {
    const org = await this.ensureCanonicalPlan(organizationId);
    const usage = await this.usage.summary(organizationId);
    const plan = await this.resolvePlan(org.plan);
    const topUps = await this.getTopUpCredits(organizationId);

    const totalTtsQuota = plan.ttsCharsQuota + (topUps.tts ?? 0) + (topUps.general ?? 0);
    const totalSttMinutesQuota = plan.sttMinutesQuota + (topUps.stt ?? 0);
    const totalTranslateQuota =
      (org.characterQuota !== (PLANS.free?.characterQuota ?? 50_000) ? org.characterQuota : plan.translateCharsQuota) +
      (topUps.translate ?? 0) +
      (topUps.general ?? 0);
    const totalCharQuota = totalTranslateQuota;
    const totalChatTokensQuota = plan.chatTokensQuota + (topUps.chat ?? 0);

    return {
      // Always return normalized PlanId so clients never match legacy SKUs (starter/creator/scale).
      plan: plan.id,
      planName: plan.name,
      planRank: plan.rank,
      features: plan.features,
      workspaceLimit: plan.workspaceLimit,
      billingStatus: org.billingStatus,
      characterQuota: totalCharQuota,
      baseCharacterQuota: org.characterQuota,
      charactersUsed: usage.characters,
      charactersRemaining: Math.max(totalCharQuota - usage.characters, 0),
      quotas: {
        tts: {
          quotaChars: totalTtsQuota,
          usedChars: usage.tts.characters,
          remainingChars: Math.max(totalTtsQuota - usage.tts.characters, 0),
        },
        stt: {
          quotaMinutes: totalSttMinutesQuota,
          usedMinutes: usage.stt.minutes,
          remainingMinutes: Math.max(totalSttMinutesQuota - usage.stt.minutes, 0),
        },
        translate: {
          quotaChars: totalTranslateQuota,
          usedChars: usage.translate.characters,
          remainingChars: Math.max(totalTranslateQuota - usage.translate.characters, 0),
        },
        chat: {
          quotaTokens: totalChatTokensQuota,
          usedTokens: usage.chat.tokens,
          remainingTokens: Math.max(totalChatTokensQuota - usage.chat.tokens, 0),
        },
      },
      topUps,
      availableTopUpPacks: TOP_UP_PACKS,
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

  async assertProductQuota(
    organizationId: string,
    productKind: 'tts' | 'stt' | 'translate' | 'chat',
    units: number,
  ) {
    const org = await this.ensureCanonicalPlan(organizationId);
    const usage = await this.usage.summary(organizationId);
    const plan = await this.resolvePlan(org.plan);
    const topUps = await this.getTopUpCredits(organizationId);

    if (productKind === 'tts') {
      const allowed = plan.ttsCharsQuota + (topUps.tts ?? 0) + (topUps.general ?? 0);
      if (usage.tts.characters + units > allowed) {
        throw new ApiException(
          'quota_exceeded',
          `Voice/TTS character quota exceeded (${usage.tts.characters}/${allowed}). Top-up characters or upgrade plan under Billing.`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    } else if (productKind === 'stt') {
      const allowed = plan.sttMinutesQuota + (topUps.stt ?? 0);
      const minutesNeeded = Math.ceil(units / 60);
      if (usage.stt.minutes + minutesNeeded > allowed) {
        throw new ApiException(
          'quota_exceeded',
          `Speech recognition (STT) quota exceeded (${usage.stt.minutes}/${allowed} mins). Top-up minutes or upgrade plan under Billing.`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    } else if (productKind === 'translate') {
      const allowed =
        (org.characterQuota !== (PLANS.free?.characterQuota ?? 50_000) ? org.characterQuota : plan.translateCharsQuota) +
        (topUps.translate ?? 0) +
        (topUps.general ?? 0);
      if (usage.translate.characters + units > allowed) {
        throw new ApiException(
          'quota_exceeded',
          `Translation character quota exceeded (${usage.translate.characters}/${allowed}). Top-up characters or upgrade plan under Billing.`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    } else if (productKind === 'chat') {
      const allowed = plan.chatTokensQuota + (topUps.chat ?? 0);
      if (usage.chat.tokens + units > allowed) {
        throw new ApiException(
          'quota_exceeded',
          `Chat token quota exceeded (${usage.chat.tokens}/${allowed}). Top-up tokens or upgrade plan under Billing.`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }
  }

  async assertWithinQuota(organizationId: string, upcomingCharacters: number) {
    return this.assertProductQuota(organizationId, 'translate', upcomingCharacters);
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

  async purchaseTopUp(input: {
    organizationId: string;
    userId: string;
    packId: string;
    email?: string;
    ip?: string;
  }) {
    const pack = getTopUpPack(input.packId);
    if (!pack) {
      throw new ApiException('not_found', `Top-up pack '${input.packId}' not found`, HttpStatus.NOT_FOUND);
    }

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
    });

    // Check if Stripe is configured and Stripe pack price exists
    const priceId = pack.stripePriceEnv ? process.env[pack.stripePriceEnv]?.trim() : undefined;
    if (this.stripe && priceId && process.env.STRIPE_WEBHOOK_SECRET) {
      const customerId = await this.ensureCustomer(input.organizationId, input.email);
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.BILLING_SUCCESS_URL ?? ''}?topup=success`,
        cancel_url: `${process.env.BILLING_CANCEL_URL ?? ''}?topup=canceled`,
        client_reference_id: input.organizationId,
        metadata: {
          type: 'topup_purchase',
          organizationId: input.organizationId,
          packId: pack.id,
          productKind: pack.productKind,
          units: String(pack.units),
          userId: input.userId,
        },
      });

      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'billing.topup_checkout_started',
        route: 'POST /v1/billing/topups/purchase',
        ip: input.ip,
        metadata: { packId: pack.id, sessionId: session.id },
      });

      return {
        url: session.url,
        mode: 'stripe' as const,
        sessionId: session.id,
        pack,
      };
    }

    // Mock/direct dev credit fulfillment (when Stripe keys not present)
    const purchase = await this.prisma.topUpPurchase.create({
      data: {
        organizationId: input.organizationId,
        packId: pack.id,
        productKind: pack.productKind,
        unitsGranted: pack.units,
        amountCents: pack.priceCents,
        currency: 'usd',
        status: 'completed',
        stripeSessionId: `mock_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'billing.topup_purchased',
      route: 'POST /v1/billing/topups/purchase',
      ip: input.ip,
      metadata: { packId: pack.id, units: pack.units, productKind: pack.productKind, mode: 'mock' },
    });

    return {
      url: null,
      mode: 'mock' as const,
      purchaseId: purchase.id,
      unitsGranted: pack.units,
      productKind: pack.productKind,
      pack,
    };
  }

  // --- Platform Admin Plans CRUD ---
  async adminListPlans() {
    return this.listAllPlans();
  }

  async adminCreatePlan(input: {
    id: string;
    name: string;
    rank?: number;
    characterQuota?: number;
    sttMinutesQuota?: number;
    ttsCharsQuota?: number;
    translateCharsQuota?: number;
    chatTokensQuota?: number;
    ocrPagesQuota?: number;
    workspaceLimit?: number;
    priceMonthlyUsd?: number | null;
    priceLabel?: string;
    blurb?: string;
    features?: PlanFeature[];
    actorUserId: string;
    ip?: string;
  }) {
    const slug = input.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!slug) {
      throw new ApiException('validation_error', 'Plan id (slug) is required', HttpStatus.BAD_REQUEST);
    }
    const existing = await this.prisma.planCatalogEntry.findUnique({ where: { id: slug } });
    if (existing) {
      throw new ApiException('conflict', `Plan '${slug}' already exists`, HttpStatus.CONFLICT);
    }

    const created = await this.prisma.planCatalogEntry.create({
      data: {
        id: slug,
        name: input.name.trim(),
        rank: input.rank ?? 1,
        characterQuota: input.characterQuota ?? 2_000_000,
        sttMinutesQuota: input.sttMinutesQuota ?? 300,
        ttsCharsQuota: input.ttsCharsQuota ?? 2_000_000,
        translateCharsQuota: input.translateCharsQuota ?? 2_000_000,
        chatTokensQuota: input.chatTokensQuota ?? 1_000_000,
        ocrPagesQuota: input.ocrPagesQuota ?? 500,
        workspaceLimit: input.workspaceLimit ?? 1,
        priceMonthlyUsd: input.priceMonthlyUsd ?? 99,
        priceLabel: input.priceLabel ?? '$99',
        blurb: input.blurb ?? '',
        features: input.features ?? ['speech', 'translate', 'playground'],
        isCustom: !BASE_PLAN_IDS.includes(slug as any),
        active: true,
      },
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        action: 'admin.plan_created',
        route: 'POST /v1/admin/plans',
        ip: input.ip,
        metadata: { planId: created.id, name: created.name },
      },
    });

    return created;
  }

  async adminUpdatePlan(
    id: string,
    input: Partial<{
      name: string;
      rank: number;
      characterQuota: number;
      sttMinutesQuota: number;
      ttsCharsQuota: number;
      translateCharsQuota: number;
      chatTokensQuota: number;
      ocrPagesQuota: number;
      workspaceLimit: number;
      priceMonthlyUsd: number | null;
      priceLabel: string;
      blurb: string;
      features: PlanFeature[];
      active: boolean;
    }>,
    actorUserId: string,
    ip?: string,
  ) {
    const slug = id.trim().toLowerCase();
    const existing = await this.prisma.planCatalogEntry.findUnique({ where: { id: slug } });
    const fallback = planFromId(slug);

    const data = {
      name: input.name ?? existing?.name ?? fallback.name,
      rank: input.rank ?? existing?.rank ?? fallback.rank,
      characterQuota: input.characterQuota ?? existing?.characterQuota ?? fallback.characterQuota,
      sttMinutesQuota: input.sttMinutesQuota ?? existing?.sttMinutesQuota ?? fallback.sttMinutesQuota,
      ttsCharsQuota: input.ttsCharsQuota ?? existing?.ttsCharsQuota ?? fallback.ttsCharsQuota,
      translateCharsQuota: input.translateCharsQuota ?? existing?.translateCharsQuota ?? fallback.translateCharsQuota,
      chatTokensQuota: input.chatTokensQuota ?? existing?.chatTokensQuota ?? fallback.chatTokensQuota,
      ocrPagesQuota: input.ocrPagesQuota ?? existing?.ocrPagesQuota ?? fallback.ocrPagesQuota,
      workspaceLimit: input.workspaceLimit ?? existing?.workspaceLimit ?? fallback.workspaceLimit,
      priceMonthlyUsd: input.priceMonthlyUsd !== undefined ? input.priceMonthlyUsd : (existing?.priceMonthlyUsd ?? fallback.priceMonthlyUsd),
      priceLabel: input.priceLabel ?? existing?.priceLabel ?? fallback.priceLabel,
      blurb: input.blurb ?? existing?.blurb ?? fallback.blurb,
      features: (input.features ?? existing?.features ?? fallback.features) as any,
      active: input.active ?? existing?.active ?? true,
      isCustom: !BASE_PLAN_IDS.includes(slug as any),
    };

    const saved = await this.prisma.planCatalogEntry.upsert({
      where: { id: slug },
      create: { id: slug, ...data },
      update: data,
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        actorUserId,
        action: 'admin.plan_updated',
        route: 'PATCH /v1/admin/plans/:id',
        ip,
        metadata: { planId: saved.id },
      },
    });

    return saved;
  }

  // --- Platform Admin User/Org Plan Change (Upgrade / Downgrade) ---
  async adminAssignPlan(input: {
    organizationId: string;
    planId: string;
    actorUserId: string;
    characterQuota?: number;
    billingStatus?: string;
    ip?: string;
  }) {
    const plan = await this.resolvePlan(input.planId);
    const updated = await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        plan: plan.id,
        characterQuota: input.characterQuota ?? plan.characterQuota,
        billingStatus: input.billingStatus ?? 'active',
      },
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        action: 'admin.plan_assigned',
        targetOrganizationId: input.organizationId,
        route: 'POST /v1/admin/workspaces/:id/plan',
        ip: input.ip,
        metadata: {
          plan: updated.plan,
          characterQuota: updated.characterQuota,
        },
      },
    });

    return updated;
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

        if (session.mode === 'payment' && session.metadata?.type === 'topup_purchase') {
          const orgId = session.metadata.organizationId;
          const packId = session.metadata.packId;
          const productKind = session.metadata.productKind;
          const units = Number(session.metadata.units ?? '0');
          if (orgId && packId) {
            await this.prisma.topUpPurchase.create({
              data: {
                organizationId: orgId,
                packId,
                productKind: productKind ?? 'tts',
                unitsGranted: units,
                amountCents: session.amount_total ?? 0,
                currency: session.currency ?? 'usd',
                status: 'completed',
                stripeSessionId: session.id,
                stripePaymentIntentId:
                  typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id,
              },
            });
            await this.audit.record({
              organizationId: orgId,
              action: 'billing.topup_fulfilled',
              route: 'stripe.webhook',
              metadata: { packId, units, sessionId: session.id },
            });
          }
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
