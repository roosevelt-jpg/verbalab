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
 * Library Phase 118 → Model Marketplace (VL-251).
 * Buy/sell/publish model listings over Model Registry / VL-110 — not Hugging Face OS.
 * Volume 11 README: real-money honesty — Stripe (or equivalent); never store raw cards.
 */
export function modelMarketplaceEngineCatalog() {
  return {
    product: 'VerbaLab Model Marketplace',
    note:
      'Model Marketplace (VL-251). Publish/license model SKUs over Model Registry cards (VL-237 / VL-110). Entitlements on install — not weight hosting, Hugging Face hub, or traffic-mesh deploy OS. Monetization records MarketplaceSale receipts; Stripe Connect via VL-092.',
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
        status: 'partial',
        api: 'POST /v1/model-marketplace/listings/:id/install',
        notes: 'Paid listings record sales; Stripe Connect path shared with VL-092.',
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
        status: 'partial',
        api: 'GET /v1/model-marketplace/sales',
        notes:
          '15% platform fee recorded on paid installs. Creator Economy (VL-258) deepens payout math — hand-check before live creators.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'partial',
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
        'Volume 11 real-money volume. Use Stripe (or equivalent); never store raw card data. Listings are license entitlements over registry metadata — not a weight CDN.',
    },
    docs: '/docs/MODEL_MARKETPLACE.md',
  };
}
