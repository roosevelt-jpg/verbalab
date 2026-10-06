export type ModelMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type ModelMarketplaceCapability = {
  id: string;
  name: string;
  status: ModelMarketplaceStatus;
  api: string | null;
  notes: string;
};

export const MODEL_MARKETPLACE_CATEGORIES = [
  'foundation',
  'finetuned',
  'private',
  'enterprise',
  'community',
  'commercial',
] as const;

export type ModelMarketplaceCategory = (typeof MODEL_MARKETPLACE_CATEGORIES)[number];

export const MODEL_LICENSE_TYPES = [
  'research',
  'commercial',
  'enterprise',
  'internal',
  'open_weight',
  'subscription',
] as const;

/**
 * Model Marketplace.
 * Buy/sell/publish model listings over Model Registry — not a public model-hub OS.
 * Platform docs: real-money honesty — Stripe (or equivalent); never store raw cards.
 */
export function modelMarketplaceEngineCatalog() {
  return {
    product: 'Lugemi Model Marketplace',
    note:
      'Model Marketplace. Publish/license model SKUs over Model Registry cards. Entitlements on install — not weight hosting, public model-hub, or traffic-mesh deploy OS. Monetization records MarketplaceSale receipts; Stripe Connect via existing.',
    capabilities: [
      {
        id: 'foundation-models',
        name: 'Foundation Models',
        status: 'shipped',
        api: 'POST /v1/model-marketplace/listings',
        notes: 'category=foundation listings from registry cards.',
      },
      {
        id: 'fine-tuned-models',
        name: 'Fine Tuned Models',
        status: 'shipped',
        api: 'POST /v1/model-marketplace/listings',
        notes: 'category=finetuned for org fine-tune / promoted packs.',
      },
      {
        id: 'private-models',
        name: 'Private Models',
        status: 'shipped',
        api: 'POST /v1/model-marketplace/listings',
        notes: 'category=private — org-scoped listings; still Pro-gated.',
      },
      {
        id: 'enterprise-models',
        name: 'Enterprise Models',
        status: 'shipped',
        api: 'POST /v1/model-marketplace/listings',
        notes: 'category=enterprise + enterprise license type.',
      },
      {
        id: 'community-models',
        name: 'Community Models',
        status: 'shipped',
        api: 'POST /v1/model-marketplace/listings',
        notes: 'category=community — no SOTA claims; metadata listings only.',
      },
      {
        id: 'commercial-models',
        name: 'Commercial Models',
        status: 'shipped',
        api: 'POST /v1/model-marketplace/listings/:id/install',
        notes: 'Paid listings record sales; Stripe Connect path shared with Creator Economy.',
      },
      {
        id: 'versioning',
        name: 'Versioning',
        status: 'shipped',
        api: 'POST /v1/model-marketplace/listings/:id/update',
        notes: 'Listing snapshot carries modelVersion string from publisher.',
      },
      {
        id: 'licensing',
        name: 'Licensing',
        status: 'shipped',
        api: 'POST /v1/model-marketplace/listings/:id/install',
        notes: 'Install grants workspace license entitlement — not weight download.',
      },
      {
        id: 'revenue-sharing',
        name: 'Revenue Sharing',
        status: 'shipped',
        api: 'GET /v1/model-marketplace/sales',
        notes:
          '15% platform fee recorded on paid installs. Creator Economy deepens payout math — hand-check before live creators.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/model-marketplace/analytics',
        notes: 'Listing/install/sale/review aggregates.',
      },
    ] satisfies ModelMarketplaceCapability[],
    categories: MODEL_MARKETPLACE_CATEGORIES.map((id) => ({ id })),
    licenseTypes: MODEL_LICENSE_TYPES.map((id) => ({ id })),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsModelRegistry: true,
      extendsVl110: true,
      regeneratesModelRegistry: false,
      regeneratesVl110: false,
      huggingFaceOs: false,
      weightHostingOs: false,
      trafficMeshOs: false,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      fabricPolicyHardGateRequired: true,
      realMoneyRiskCategory: true,
    },
    honesty: {
      huggingFaceOs: false,
      weightHostingOs: false,
      trainsCompetitiveFoundationWeights: false,
      sotaClaims: false,
      regeneratesModelRegistry: false,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      rollsOwnCardVault: false,
      fabricPolicyHardGateRequired: true,
      realMoneyRiskCategory: true,
      creatorPayoutMathVerifiedLive: false,
    },
    safety: {
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      fabricPolicyHardGateRequired: true,
      realMoneyRiskCategory: true,
      note:
        'Real-money volume. Use Stripe (or equivalent); never store raw card data. Listings are license entitlements over registry metadata — not a weight CDN.',
    },
    docs: '/docs/MODEL_MARKETPLACE.md',
  };
}
