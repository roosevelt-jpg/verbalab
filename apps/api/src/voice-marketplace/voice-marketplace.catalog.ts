export type VmCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type VmCapability = {
  id: string;
  name: string;
  status: VmCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 34 → Voice Marketplace (VL-177). Distinct from VL-090 localization marketplace. */
export function voiceMarketplaceEngineCatalog() {
  return {
    product: 'Lugemi Voice Marketplace',
    note:
      'Publish/license/sell voice SKUs with ratings — distinct from localization Marketplace (VL-090). Consent/rights attestation required for clones. Celebrity SKUs without a rights chain are forbidden. Not third-party voice library / Soundraw parity.',
    capabilities: [
      {
        id: 'marketplace',
        name: 'Marketplace',
        status: 'shipped',
        api: 'GET /v1/voice-marketplace/engine',
        notes: 'Voice SKU catalog hub.',
      },
      {
        id: 'voice-publishing',
        name: 'Voice Publishing',
        status: 'shipped',
        api: 'POST /v1/voice-marketplace/listings',
        notes: 'Publish own/stock/approved-clone voices with rights attestation.',
      },
      {
        id: 'voice-licensing',
        name: 'Voice Licensing',
        status: 'shipped',
        api: 'POST /v1/voice-marketplace/listings/:id/install',
        notes: 'Install grants workspace license entitlement (not cross-tenant clone synthesis).',
      },
      {
        id: 'voice-selling',
        name: 'Voice Selling',
        status: 'partial',
        api: 'POST /v1/voice-marketplace/listings/:id/install',
        notes: 'Paid listings record sales; Stripe Connect path shared with VL-092 patterns when configured.',
      },
      {
        id: 'subscriptions',
        name: 'Subscriptions',
        status: 'partial',
        api: 'POST /v1/voice-marketplace/listings',
        notes: 'subscriptionInterval metadata on listings. Recurring Stripe billing deferred.',
      },
      {
        id: 'ratings',
        name: 'Ratings',
        status: 'shipped',
        api: 'POST /v1/voice-marketplace/listings/:id/reviews',
        notes: '1–5 star ratings aggregated on listing.',
      },
      {
        id: 'reviews',
        name: 'Reviews',
        status: 'shipped',
        api: 'GET /v1/voice-marketplace/listings/:id/reviews',
        notes: 'One review per org per listing.',
      },
      {
        id: 'voice-packs',
        name: 'Voice Packs',
        status: 'shipped',
        api: 'POST /v1/voice-marketplace/listings',
        notes: 'kind=pack bundles member listing ids in snapshot.',
      },
      {
        id: 'celebrity-voices',
        name: 'Celebrity Voices',
        status: 'deferred',
        api: null,
        notes: 'Forbidden without rights chain (celebrityClaim=true rejected). Legal review required.',
      },
      {
        id: 'enterprise-voices',
        name: 'Enterprise Voices',
        status: 'partial',
        api: 'POST /v1/voice-marketplace/listings',
        notes: 'Approved clones with ownership attestation + enterprise license type.',
      },
      {
        id: 'language-packs',
        name: 'Language Packs',
        status: 'shipped',
        api: 'POST /v1/voice-marketplace/listings',
        notes: 'kind=language_pack curated own:* voice ids by language.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'partial',
        api: 'GET /v1/voice-marketplace/analytics',
        notes: 'Listing/install/rating aggregates. Full Voice Analytics = Phase 35.',
      },
      {
        id: 'billing',
        name: 'Billing',
        status: 'partial',
        api: 'shared Stripe + recorded sales',
        notes: 'Pro gate + recorded paid installs. Live Connect payouts via shared billing.',
      },
    ] satisfies VmCapability[],
    honesty: {
      localizationMarketplace: false,
      celebrityWithoutRights: false,
      crossTenantCloneSynthesis: false,
      extendsVl090Patterns: true,
      requiresVl172ConsentForClones: true,
    },
    links: {
      console: '/voice-marketplace',
      localizationMarketplace: '/marketplace',
      voiceCloning: '/voice-cloning',
      hub: '/voice-cloud',
      openapi: '/v1/openapi.json',
      docs: '/docs/VOICE_MARKETPLACE.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@lugemi/sdk',
      cli: '@lugemi/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
      celebrityWithoutRights: false,
      crossTenantCloneSynthesis: false,
    },
  };
}

export const LANGUAGE_PACK_CATALOG: Record<
  string,
  { title: string; language: string; voices: string[]; description: string }
> = {
  sw: {
    title: 'Swahili Voice Pack',
    language: 'sw',
    voices: ['own:sw-aisha'],
    description: 'Curated own:* Swahili voice for African studio.',
  },
  yo: {
    title: 'Yoruba Voice Pack',
    language: 'yo',
    voices: ['own:yo-tunde'],
    description: 'Curated own:* Yoruba voice.',
  },
  am: {
    title: 'Amharic Voice Pack',
    language: 'am',
    voices: ['own:am-hanna'],
    description: 'Curated own:* Amharic voice.',
  },
  en: {
    title: 'English African Voice Pack',
    language: 'en',
    voices: ['own:en-kofi'],
    description: 'Curated own:* English (African) voice.',
  },
};
