export type CreatorEconomyStatus = 'shipped' | 'partial' | 'deferred';

export type CreatorEconomyCapability = {
  id: string;
  name: string;
  status: CreatorEconomyStatus;
  api: string | null;
  notes: string;
};

/** ecosystem hub listings use 15% platform fee (1500 bps). */
export const ECOSYSTEM_HUB_PLATFORM_FEE_BPS = 1500;

/**
 * Pure royalty split — hand-check before live creators.
 * fee = min(amount, floor(amount * bps / 10000)); net = amount - fee.
 */
export function splitRevenue(input: {
  amountCents: number;
  feeBps: number;
}): {
  amountCents: number;
  feeBps: number;
  applicationFeeCents: number;
  publisherNetCents: number;
} {
  const amountCents = Math.max(0, Math.floor(Number(input.amountCents) || 0));
  const feeBps = Math.max(0, Math.min(10_000, Math.floor(Number(input.feeBps) || 0)));
  const applicationFeeCents = Math.min(
    amountCents,
    Math.floor((amountCents * feeBps) / 10_000),
  );
  return {
    amountCents,
    feeBps,
    applicationFeeCents,
    publisherNetCents: amountCents - applicationFeeCents,
  };
}

/** Canonical hand-check scenarios (documented + tested). */
export const ROYALTY_HAND_CHECK_SCENARIOS = [
  { id: 'hub-1000-15pct', amountCents: 1000, feeBps: 1500, fee: 150, net: 850 },
  { id: 'hub-500-15pct', amountCents: 500, feeBps: 1500, fee: 75, net: 425 },
  { id: 'content-1000-20pct', amountCents: 1000, feeBps: 2000, fee: 200, net: 800 },
  { id: 'floor-1-cent-15pct', amountCents: 1, feeBps: 1500, fee: 0, net: 1 },
  { id: 'zero-15pct', amountCents: 0, feeBps: 1500, fee: 0, net: 0 },
  { id: 'hub-999-15pct', amountCents: 999, feeBps: 1500, fee: 149, net: 850 },
] as const;

/**
 * Creator Economy.
 * Extends existing Stripe Connect Express + MarketplaceSale — not a payment-processor OS.
 *: Stripe-only; never store raw cards; hand-check payout math.
 */
export function creatorEconomyEngineCatalog() {
  return {
    product: 'Lugemi Creator Economy',
    note:
      'Creator Economy. Extends existing Stripe Connect Express + MarketplaceSale receipts with royalty math, creator/org profiles, invoice-style sale receipts, and honest tax/dispute gaps. Not a payment-processor OS, tax engine, or card vault. Hand-check royalty scenarios before live creators.',
    capabilities: [
      {
        id: 'revenue-sharing',
        name: 'Revenue Sharing',
        status: 'shipped',
        api: 'POST /v1/creator-economy/royalty/preview',
        notes:
          'Hub listings 15% (1500 bps); content marketplace Connect uses MARKETPLACE_PLATFORM_FEE_BPS (default 20%).',
      },
      {
        id: 'subscriptions',
        name: 'Subscriptions',
        status: 'partial',
        api: 'GET /v1/billing/summary',
        notes: 'Pro plan + listing subscriptionInterval metadata. Recurring Connect subscriptions deferred.',
      },
      {
        id: 'licensing',
        name: 'Licensing',
        status: 'partial',
        api: 'GET /v1/creator-economy/licensing',
        notes: 'Aggregates entitlement installs across marketplace hubs — not a license server OS.',
      },
      {
        id: 'royalties',
        name: 'Royalties',
        status: 'shipped',
        api: 'GET /v1/creator-economy/royalty/scenarios',
        notes: 'Hand-checkable splitRevenue scenarios; creatorPayoutMathVerifiedLive=false until ops sign-off.',
      },
      {
        id: 'creator-profiles',
        name: 'Creator Profiles',
        status: 'shipped',
        api: 'GET /v1/creator-economy/profiles/creator',
        notes: 'Org-scoped publisher profile over Connect + sales aggregates.',
      },
      {
        id: 'organization-profiles',
        name: 'Organization Profiles',
        status: 'shipped',
        api: 'GET /v1/creator-economy/profiles/organization',
        notes: 'Buyer/publisher org summary — not a CRM OS.',
      },
      {
        id: 'partner-accounts',
        name: 'Partner Accounts',
        status: 'partial',
        api: 'GET /v1/creator-economy/profiles/partner',
        notes: 'Connect Express partner readiness. Full partner program deferred.',
      },
      {
        id: 'payouts',
        name: 'Payouts',
        status: 'partial',
        api: 'GET /v1/marketplace/connect/status',
        notes:
          'Stripe Connect Express via existing. Live payouts blocked until Stripe env configured. Hub surfaces status + preview.',
      },
      {
        id: 'invoices',
        name: 'Invoices',
        status: 'partial',
        api: 'GET /v1/creator-economy/invoices',
        notes: 'Invoice-style views over MarketplaceSale receipts — not a full invoicing OS.',
      },
      {
        id: 'tax-reporting',
        name: 'Tax Reporting',
        status: 'deferred',
        api: null,
        notes: '1099 / VAT / tax forms are explicit gaps — taxHandlingComplete=false.',
      },
      {
        id: 'creator-portal',
        name: 'Creator Portal',
        status: 'shipped',
        api: 'GET /v1/creator-economy/engine',
        notes: 'Console /creator-economy + REST hub.',
      },
      {
        id: 'rest-apis',
        name: 'REST APIs',
        status: 'shipped',
        api: '/v1/creator-economy/*',
        notes: 'Engine, royalty, profiles, invoices, sales, analytics, monitoring.',
      },
      {
        id: 'billing',
        name: 'Billing',
        status: 'partial',
        api: 'GET /v1/billing/summary',
        notes: 'Shared Stripe billing + Connect — extends 092.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'partial',
        api: 'GET /v1/creator-economy/analytics',
        notes: 'Sale/install aggregates for publisher org.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/creator-economy/monitoring',
        notes: 'Capability + honesty snapshot.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: null,
        notes: '/docs/CREATOR_ECONOMY.md.',
      },
    ] satisfies CreatorEconomyCapability[],
    royalty: {
      ecosystemHubFeeBps: ECOSYSTEM_HUB_PLATFORM_FEE_BPS,
      contentMarketplaceFeeBpsDefault: 2000,
      contentMarketplaceFeeBpsEnv: 'MARKETPLACE_PLATFORM_FEE_BPS',
      voiceMarketplaceVl177FeePct: 10,
      formula: 'applicationFeeCents = min(amount, floor(amount * feeBps / 10000)); publisherNetCents = amount - fee',
      handCheckScenarios: ROYALTY_HAND_CHECK_SCENARIOS.map((s) => ({
        id: s.id,
        amountCents: s.amountCents,
        feeBps: s.feeBps,
        expectedApplicationFeeCents: s.fee,
        expectedPublisherNetCents: s.net,
      })),
      note:
        'Ecosystem hubs (model→voice-language) record 15%. Content marketplace Checkout uses billing.platformFeeBps() (default 20%). Voice marketplace still uses 10% — not regenerated here.',
    },
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsVl092StripeConnect: true,
      extendsMarketplaceSales: true,
      regeneratesBilling: false,
      regeneratesMarketplaceVl090: false,
      paymentProcessorOs: false,
      taxEngineOs: false,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      realMoneyRiskCategory: true,
    },
    honesty: {
      paymentProcessorOs: false,
      taxEngineOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      regeneratesBilling: false,
      regeneratesMarketplaceVl090: false,
      taxHandlingComplete: false,
      disputeChargebackComplete: false,
      refundsUiComplete: false,
      creatorPayoutMathVerifiedLive: false,
      creatorPayoutMathHandCheckedInTests: true,
      realMoneyRiskCategory: true,
      pciSelfAssessmentRequiredBeforeLiveCards: true,
      liveConnectBlockedWithoutStripeEnv: true,
    },
    safety: {
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      taxHandlingComplete: false,
      disputeChargebackComplete: false,
      creatorPayoutMathVerifiedLive: false,
      note:
        'Real-money volume. Use Stripe Connect (or equivalent); never store raw card data. Hand-check royalty scenarios before paying live creators. Tax (1099/VAT) and dispute/chargeback flows are documented gaps — not a tax engine or payment-processor OS.',
    },
    docs: '/docs/CREATOR_ECONOMY.md',
    links: {
      console: '/creator-economy',
      marketplace: '/marketplace',
      billing: '/billing',
      connectStatus: '/v1/marketplace/connect/status',
      sales: '/v1/marketplace/sales',
      priorAdr: '/docs/adr/0033-marketplace-creator-payouts.md',
    },
  };
}
