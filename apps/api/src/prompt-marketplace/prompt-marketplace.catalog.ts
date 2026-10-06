export type PromptMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type PromptMarketplaceCapability = {
  id: string;
  name: string;
  status: PromptMarketplaceStatus;
  api: string | null;
  notes: string;
};

export const PROMPT_MARKETPLACE_CATEGORIES = [
  'packs',
  'templates',
  'libraries',
] as const;

export type PromptMarketplaceCategory = (typeof PROMPT_MARKETPLACE_CATEGORIES)[number];

export const PROMPT_MARKETPLACE_LICENSE_TYPES = [
  'cc-by-4.0',
  'cc0-1.0',
  'research',
  'commercial',
  'enterprise',
  'proprietary',
] as const;

/**
 * Library Phase 120 → Prompt Marketplace (VL-253).
 * Extends VL-091 prompt listings + Prompt Fabric / Prompt Runtime — not a prompt mesh OS.
 * Volume 11 README: real-money honesty — Stripe (or equivalent); never store raw cards.
 */
export function promptMarketplaceEngineCatalog() {
  return {
    product: 'Lugemi Prompt Marketplace',
    note:
      'Prompt Marketplace (VL-253). Publish/license prompt packs over content-marketplace prompt kind + Prompt Fabric (VL-243). Install copies managed prompt versions into buyer workspaces — not a prompt mesh OS or auto-prompt research lab.',
    capabilities: [
      {
        id: 'prompt-packs',
        name: 'Prompt Packs',
        status: 'shipped',
        api: 'POST /v1/prompt-marketplace/listings',
        notes: 'category=packs — bundled chat/rag/voice_faq snapshots.',
      },
      {
        id: 'prompt-templates',
        name: 'Prompt Templates',
        status: 'shipped',
        api: 'POST /v1/prompt-marketplace/listings',
        notes: 'category=templates — reusable system prompt bodies.',
      },
      {
        id: 'prompt-libraries',
        name: 'Prompt Libraries',
        status: 'shipped',
        api: 'POST /v1/prompt-marketplace/listings',
        notes: 'category=libraries — multi-key prompt collections.',
      },
      {
        id: 'prompt-testing',
        name: 'Prompt Testing',
        status: 'shipped',
        api: 'POST /v1/prompt-marketplace/listings/:id/test',
        notes: 'Dry-run validation of listing snapshot keys/bodies (no install).',
      },
      {
        id: 'prompt-reviews',
        name: 'Prompt Reviews',
        status: 'shipped',
        api: 'POST /v1/prompt-marketplace/listings/:id/reviews',
        notes: '1–5 star reviews via MemoryRecords.',
      },
      {
        id: 'prompt-analytics',
        name: 'Prompt Analytics',
        status: 'shipped',
        api: 'GET /v1/prompt-marketplace/analytics',
        notes: 'Publisher listing/install/sale/review aggregates.',
      },
      {
        id: 'prompt-licensing',
        name: 'Prompt Licensing',
        status: 'shipped',
        api: 'POST /v1/prompt-marketplace/listings/:id/install',
        notes: 'Install copies prompt versions into buyer workspace.',
      },
      {
        id: 'prompt-versioning',
        name: 'Prompt Versioning',
        status: 'shipped',
        api: 'POST /v1/prompt-marketplace/listings/:id/update',
        notes: 'Listing snapshot carries promptVersion; install creates new PromptVersion rows.',
      },
      {
        id: 'revenue-sharing',
        name: 'Revenue Sharing',
        status: 'partial',
        api: 'GET /v1/prompt-marketplace/sales',
        notes:
          '15% platform fee on paid installs. Creator Economy (VL-258) deepens payout math — hand-check before live creators.',
      },
    ] satisfies PromptMarketplaceCapability[],
    categories: PROMPT_MARKETPLACE_CATEGORIES.map((id) => ({ id })),
    licenseTypes: PROMPT_MARKETPLACE_LICENSE_TYPES.map((id) => ({ id })),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsContentMarketplacePromptKind: true,
      extendsPromptFabricVl243: true,
      regeneratesMarketplaceVl090: false,
      promptMeshOs: false,
      autoPromptResearchOs: false,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      fabricPolicyHardGateRequired: true,
      realMoneyRiskCategory: true,
    },
    honesty: {
      promptMeshOs: false,
      autoPromptResearchOs: false,
      regeneratesMarketplaceVl090: false,
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
        'Volume 11 real-money volume. Use Stripe (or equivalent); never store raw card data. Not a prompt mesh / auto-prompt research OS.',
    },
    docs: '/docs/PROMPT_MARKETPLACE.md',
  };
}
