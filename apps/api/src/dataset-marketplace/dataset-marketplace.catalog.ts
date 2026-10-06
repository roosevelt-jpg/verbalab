export type DatasetMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type DatasetMarketplaceCapability = {
  id: string;
  name: string;
  status: DatasetMarketplaceStatus;
  api: string | null;
  notes: string;
};

export const DATASET_MARKETPLACE_CATEGORIES = [
  'public',
  'enterprise',
  'research',
  'translation',
  'speech',
  'ocr',
  'vision',
] as const;

export type DatasetMarketplaceCategory = (typeof DATASET_MARKETPLACE_CATEGORIES)[number];

export const DATASET_MARKETPLACE_LICENSE_TYPES = [
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'cc0-1.0',
  'research',
  'commercial',
  'enterprise',
  'proprietary',
] as const;

/**
 * Dataset Marketplace.
 * Extends existing dataset listings + DatasetAsset — not Label Studio / Dataset Cloud OS.
 * Volume 11 README: real-money honesty — Stripe (or equivalent); never store raw cards.
 */
export function datasetMarketplaceEngineCatalog() {
  return {
    product: 'Lugemi Dataset Marketplace',
    note:
      'Dataset Marketplace. Publish/license dataset SKUs over content-marketplace dataset kind + Dataset Asset program. TM corpora install copy pairs; DatasetAsset listings grant license entitlements — not Label Studio, annotation OS, or Dataset Cloud.',
    capabilities: [
      {
        id: 'public-datasets',
        name: 'Public Datasets',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings',
        notes: 'category=public listings.',
      },
      {
        id: 'enterprise-datasets',
        name: 'Enterprise Datasets',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings',
        notes: 'category=enterprise.',
      },
      {
        id: 'research-datasets',
        name: 'Research Datasets',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings',
        notes: 'category=research.',
      },
      {
        id: 'translation-corpora',
        name: 'Translation Corpora',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings',
        notes: 'category=translation — from approved TM pairs or DatasetAsset.',
      },
      {
        id: 'speech-corpora',
        name: 'Speech Corpora',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings',
        notes: 'category=speech metadata listings over DatasetAsset — not speech OS.',
      },
      {
        id: 'ocr-corpora',
        name: 'OCR Corpora',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings',
        notes: 'category=ocr metadata listings.',
      },
      {
        id: 'vision-datasets',
        name: 'Vision Datasets',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings',
        notes: 'category=vision metadata listings — not vision company OS.',
      },
      {
        id: 'licensing',
        name: 'Licensing',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings/:id/install',
        notes: 'TM install copies pairs; asset install is entitlement-only.',
      },
      {
        id: 'versioning',
        name: 'Versioning',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings/:id/update',
        notes: 'Listing snapshot carries datasetVersion.',
      },
      {
        id: 'reviews',
        name: 'Reviews',
        status: 'shipped',
        api: 'POST /v1/dataset-marketplace/listings/:id/reviews',
        notes: '1–5 star reviews via MemoryRecords.',
      },
      {
        id: 'revenue-sharing',
        name: 'Revenue Sharing',
        status: 'partial',
        api: 'GET /v1/dataset-marketplace/sales',
        notes:
          '15% platform fee on paid installs. Creator Economy deepens payout math — hand-check before live creators.',
      },
    ] satisfies DatasetMarketplaceCapability[],
    categories: DATASET_MARKETPLACE_CATEGORIES.map((id) => ({ id })),
    licenseTypes: DATASET_MARKETPLACE_LICENSE_TYPES.map((id) => ({ id })),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsContentMarketplaceDatasetKind: true,
      extendsDatasetAssetVl101: true,
      regeneratesMarketplaceVl090: false,
      labelStudioOs: false,
      datasetCloudOs: false,
      annotationOs: false,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      fabricPolicyHardGateRequired: true,
      realMoneyRiskCategory: true,
    },
    honesty: {
      labelStudioOs: false,
      datasetCloudOs: false,
      annotationOs: false,
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
        'Volume 11 real-money volume. Use Stripe (or equivalent); never store raw card data. Not Label Studio / Dataset Cloud.',
    },
    docs: '/docs/DATASET_MARKETPLACE.md',
  };
}
