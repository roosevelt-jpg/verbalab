export type VoiceLanguageMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type VoiceLanguageMarketplaceCapability = {
  id: string;
  name: string;
  status: VoiceLanguageMarketplaceStatus;
  api: string | null;
  notes: string;
};

export const VOICE_LANGUAGE_PACK_TYPES = [
  'voice',
  'language',
  'dialect',
  'accent',
  'grammar',
  'terminology',
  'localization',
] as const;

export type VoiceLanguagePackType = (typeof VOICE_LANGUAGE_PACK_TYPES)[number];

export type VoiceLanguageCatalogEntry = {
  key: string;
  name: string;
  packType: VoiceLanguagePackType;
  status: VoiceLanguageMarketplaceStatus;
  extendsApi: string | null;
  notes: string;
};

/** Built-in pack SKUs — extend voice marketplace + Volume 1 language surfaces. */
export const VOICE_LANGUAGE_PACK_CATALOG: VoiceLanguageCatalogEntry[] = [
  {
    key: 'voice.pack',
    name: 'Voice Pack',
    packType: 'voice',
    status: 'shipped',
    extendsApi: '/v1/voice-marketplace/listings',
    notes: 'Entitlement over existing kind=pack listings — not a voice CDN OS.',
  },
  {
    key: 'language.sw',
    name: 'Swahili Language Pack',
    packType: 'language',
    status: 'shipped',
    extendsApi: '/v1/voice-marketplace/language-packs',
    notes: 'Extends existing LANGUAGE_PACK_CATALOG sw + own:* voices.',
  },
  {
    key: 'language.yo',
    name: 'Yoruba Language Pack',
    packType: 'language',
    status: 'shipped',
    extendsApi: '/v1/voice-marketplace/language-packs',
    notes: 'Extends existing LANGUAGE_PACK_CATALOG yo.',
  },
  {
    key: 'language.am',
    name: 'Amharic Language Pack',
    packType: 'language',
    status: 'shipped',
    extendsApi: '/v1/voice-marketplace/language-packs',
    notes: 'Extends existing LANGUAGE_PACK_CATALOG am.',
  },
  {
    key: 'language.en',
    name: 'English African Language Pack',
    packType: 'language',
    status: 'shipped',
    extendsApi: '/v1/voice-marketplace/language-packs',
    notes: 'Extends existing LANGUAGE_PACK_CATALOG en.',
  },
  {
    key: 'dialect.generic',
    name: 'Dialect Pack',
    packType: 'dialect',
    status: 'partial',
    extendsApi: '/v1/dialects',
    notes: 'Metadata entitlement over dialect registry — not a dialect detection OS.',
  },
  {
    key: 'accent.generic',
    name: 'Accent Pack',
    packType: 'accent',
    status: 'partial',
    extendsApi: '/v1/voice-marketplace/listings',
    notes: 'Metadata entitlement for accent tags — acoustic models deferred.',
  },
  {
    key: 'grammar.generic',
    name: 'Grammar Pack',
    packType: 'grammar',
    status: 'partial',
    extendsApi: null,
    notes: 'Metadata entitlement only — grammar OS deferred in Language Cloud.',
  },
  {
    key: 'terminology.generic',
    name: 'Terminology Pack',
    packType: 'terminology',
    status: 'shipped',
    extendsApi: '/v1/vertical-glossaries',
    notes: 'Entitlement over vertical glossaries / glossary marketplace patterns.',
  },
  {
    key: 'localization.generic',
    name: 'Localization Pack',
    packType: 'localization',
    status: 'shipped',
    extendsApi: '/v1/country-packs',
    notes: 'Entitlement over locales + country packs — not a localization CMS OS.',
  },
];

export function findVoiceLanguagePackEntry(key: string): VoiceLanguageCatalogEntry | undefined {
  const normalized = key.trim.toLowerCase;
  return VOICE_LANGUAGE_PACK_CATALOG.find((c) => c.key === normalized);
}

/**
 * Library Phase 124 → Voice & Language Marketplace.
 * Buy/sell/publish voice + language pack entitlements — not a third-party voice CDN OS.
 * Extends existing voice marketplace + Volume 1 language packs. Volume 11: Stripe-only.
 */
export function voiceLanguageMarketplaceEngineCatalog {
  return {
    product: 'Lugemi Voice & Language Marketplace',
    note:
      'Voice & Language Marketplace. Publish/license pack SKUs over existing voice marketplace + Volume 1 language/dialect/glossary/locale surfaces. Install grants workspace entitlements — not voice CDN hosting, celebrity without rights, or cross-tenant clone synthesis. Monetization records MarketplaceSale receipts; Stripe Connect via existing.',
    capabilities: [
      {
        id: 'voice-packs',
        name: 'Voice Packs',
        status: 'shipped',
        api: 'POST /v1/voice-language-marketplace/listings',
        notes: 'packType=voice entitlement listings over existing packs.',
      },
      {
        id: 'language-packs',
        name: 'Language Packs',
        status: 'shipped',
        api: 'POST /v1/voice-language-marketplace/listings',
        notes: 'packType=language — extends existing language packs (sw/yo/am/en).',
      },
      {
        id: 'dialect-packs',
        name: 'Dialect Packs',
        status: 'shipped',
        api: 'POST /v1/voice-language-marketplace/listings',
        notes: 'packType=dialect metadata entitlements over dialect registry.',
      },
      {
        id: 'accent-packs',
        name: 'Accent Packs',
        status: 'shipped',
        api: 'POST /v1/voice-language-marketplace/listings',
        notes: 'packType=accent metadata entitlements.',
      },
      {
        id: 'grammar-packs',
        name: 'Grammar Packs',
        status: 'partial',
        api: 'POST /v1/voice-language-marketplace/listings',
        notes: 'packType=grammar metadata only — not a grammar OS.',
      },
      {
        id: 'terminology-packs',
        name: 'Terminology Packs',
        status: 'shipped',
        api: 'POST /v1/voice-language-marketplace/listings',
        notes: 'packType=terminology over vertical glossaries.',
      },
      {
        id: 'localization-packs',
        name: 'Localization Packs',
        status: 'shipped',
        api: 'POST /v1/voice-language-marketplace/listings',
        notes: 'packType=localization over locales/country packs.',
      },
      {
        id: 'marketplace',
        name: 'Marketplace',
        status: 'shipped',
        api: 'GET /v1/voice-language-marketplace/engine',
        notes: 'Hub over Volume 1 — regeneratesVoiceCloud=false.',
      },
      {
        id: 'rest-apis',
        name: 'REST APIs',
        status: 'shipped',
        api: '/v1/voice-language-marketplace/*',
        notes: 'Publish/install/reviews/sales/analytics.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'voiceLanguageMarketplaceEngine',
        notes: '@lugemi/sdk + CLI.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'partial',
        api: 'GET /v1/voice-language-marketplace/analytics',
        notes: 'Listing/install/review aggregates. Commerce depth deferred to Creator Economy.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/voice-language-marketplace/monitoring',
        notes: 'Capability status snapshot.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: null,
        notes: '/docs/VOICE_LANGUAGE_MARKETPLACE.md + ADR-0159.',
      },
    ] satisfies VoiceLanguageMarketplaceCapability[],
    packTypes: VOICE_LANGUAGE_PACK_TYPES.map((id) => ({ id })),
    packs: VOICE_LANGUAGE_PACK_CATALOG.map((c) => ({
      key: c.key,
      name: c.name,
      packType: c.packType,
      status: c.status,
      extendsApi: c.extendsApi,
    })),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsVoiceMarketplaceVl177: true,
      extendsVolume1LanguagePacks: true,
      regeneratesVoiceCloud: false,
      regeneratesVoiceMarketplace: false,
      thirdPartyVoiceOs: false,
      voiceCdnOs: false,
      celebrityWithoutRights: false,
      crossTenantCloneSynthesis: false,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      realMoneyRiskCategory: true,
    },
    honesty: {
      thirdPartyVoiceOs: false,
      voiceCdnOs: false,
      celebrityWithoutRights: false,
      crossTenantCloneSynthesis: false,
      regeneratesVoiceCloud: false,
      regeneratesVoiceMarketplace: false,
      fabricPolicyHardGateRequired: true,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      realMoneyRiskCategory: true,
      creatorPayoutMathVerifiedLive: false,
    },
    safety: {
      celebrityWithoutRightsForbidden: true,
      crossTenantCloneSynthesisForbidden: true,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      note:
        'Volume 11 real-money volume. Pack listings are entitlements over Volume 1 surfaces — not voice CDN hosting or celebrity without rights. Use Stripe (or equivalent); never store raw card data. Not a third-party voice OS.',
    },
    docs: '/docs/VOICE_LANGUAGE_MARKETPLACE.md',
  };
}
