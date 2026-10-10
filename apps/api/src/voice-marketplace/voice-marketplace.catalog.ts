import {
  LANGUAGE_SEEDS,
  TOTAL_LANGUAGE_COUNT,
} from '../languages/language-seeds';

export type VmCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type VmCapability = {
  id: string;
  name: string;
  status: VmCapabilityStatus;
  api: string | null;
  notes: string;
};

export type LanguagePackEntry = {
  title: string;
  language: string;
  voices: string[];
  description: string;
  nameEn: string;
  nameNative?: string;
};

const CURATED_OWN_VOICES: Record<string, string[]> = {
  sw: ['own:sw-aisha', 'own:sw-ke-female'],
  yo: ['own:yo-tunde', 'own:yo-ng-male'],
  am: ['own:am-hanna', 'own:am-et-female'],
  en: [
    'own:en-us-female',
    'own:en-us-male',
    'own:en-gb-female',
    'own:en-gb-male',
    'own:en-ca-female',
    'own:en-ca-male',
    'own:en-au-female',
    'own:en-au-male',
    'own:en-nz-female',
    'own:en-nz-male',
    'own:en-kofi',
    'own:en-gh-female',
    'own:en-gh-male',
    'own:en-ng-female',
    'own:en-ng-male',
    'own:en-ke-female',
    'own:en-ke-male',
    'own:en-ph-female',
    'own:en-ph-male',
    'own:en-za-female',
    'own:en-za-male',
  ],
  zu: ['own:zu-za-female'],
  ar: ['own:ar-eg-male'],
  fr: ['own:fr-sn-female'],
  ha: ['own:ha-ng-male'],
  ak: ['own:ak-gh-female'],
  ig: ['own:ig-ng-female'],
  so: ['own:so-so-male'],
  wo: ['own:wo-sn-male'],
  lg: ['own:lg-ug-female'],
  ln: ['own:ln-cd-male'],
  om: ['own:om-et-female'],
  rw: ['own:rw-rw-female'],
  xh: ['own:xh-za-male'],
  pcm: ['own:pcm-ng-female'],
  bm: ['own:bm-ml-male'],
  ee: ['own:ee-gh-female'],
  ti: ['own:ti-et-male'],
  sn: ['own:sn-zw-female'],
  ny: ['own:ny-mw-male'],
  ff: ['own:ff-sn-female'],
  pt: ['own:pt-ao-male'],
  af: ['own:af-za-female'],
  tn: ['own:tn-bw-male'],
};

export function voicesForLanguagePack(code: string): string[] {
  return CURATED_OWN_VOICES[code] ?? [`own:${code}-pack`];
}

export function buildLanguagePackCatalog(): Record<string, LanguagePackEntry> {
  const out: Record<string, LanguagePackEntry> = {};
  for (const lang of LANGUAGE_SEEDS) {
    out[lang.code] = {
      title: `${lang.nameEn} Pack`,
      language: lang.code,
      voices: voicesForLanguagePack(lang.code),
      description: `Curated ${lang.nameEn}${
        lang.nameNative ? ` (${lang.nameNative})` : ''
      } language pack — own:* voices for Lugemi Voice Marketplace.`,
      nameEn: lang.nameEn,
      nameNative: lang.nameNative,
    };
  }
  return out;
}

export const LANGUAGE_PACK_CATALOG: Record<string, LanguagePackEntry> = buildLanguagePackCatalog();

export const LANGUAGE_PACK_COUNT = Object.keys(LANGUAGE_PACK_CATALOG).length;

export function assertLanguagePackCatalogComplete() {
  if (LANGUAGE_PACK_COUNT !== TOTAL_LANGUAGE_COUNT) {
    throw new Error(
      `LANGUAGE_PACK_CATALOG has ${LANGUAGE_PACK_COUNT} packs; expected ${TOTAL_LANGUAGE_COUNT}`,
    );
  }
}

export const LANGUAGE_PACK_DEFAULT_PRICE_CENTS = 500;

export function voiceMarketplaceEngineCatalog() {
  assertLanguagePackCatalogComplete();
  return {
    product: 'Lugemi Voice Marketplace',
    note:
      'Publish/license/sell voice SKUs with ratings — distinct from localization Marketplace. Consent/rights attestation required for clones. Celebrity SKUs without a rights chain are forbidden. Not third-party voice library / generative-music OS parity.',
    capabilities: [
      { id: 'marketplace', name: 'Marketplace', status: 'shipped' as const, api: 'GET /v1/voice-marketplace/engine', notes: 'Voice SKU catalog hub.' },
      { id: 'voice-publishing', name: 'Voice Publishing', status: 'shipped' as const, api: 'POST /v1/voice-marketplace/listings', notes: 'Publish own/stock/approved-clone voices with rights attestation.' },
      { id: 'voice-licensing', name: 'Voice Licensing', status: 'shipped' as const, api: 'POST /v1/voice-marketplace/listings/:id/install', notes: 'Install grants workspace license entitlement (not cross-tenant clone synthesis).' },
      { id: 'voice-selling', name: 'Voice Selling', status: 'shipped' as const, api: 'POST /v1/voice-marketplace/listings/:id/install', notes: 'Paid listings record sales; Stripe Connect path shared with patterns when configured.' },
      { id: 'subscriptions', name: 'Subscriptions', status: 'shipped' as const, api: 'POST /v1/voice-marketplace/listings', notes: 'subscriptionInterval metadata on listings. Recurring Stripe billing deferred.' },
      { id: 'ratings', name: 'Ratings', status: 'shipped' as const, api: 'POST /v1/voice-marketplace/listings/:id/reviews', notes: '1–5 star ratings aggregated on listing.' },
      { id: 'reviews', name: 'Reviews', status: 'shipped' as const, api: 'GET /v1/voice-marketplace/listings/:id/reviews', notes: 'One review per org per listing.' },
      { id: 'voice-packs', name: 'Voice Packs', status: 'shipped' as const, api: 'POST /v1/voice-marketplace/listings', notes: 'kind=pack bundles member listing ids in snapshot.' },
      { id: 'celebrity-voices', name: 'Celebrity Voices', status: 'deferred' as const, api: null, notes: 'Forbidden without rights chain (celebrityClaim=true rejected). Legal review required.' },
      { id: 'enterprise-voices', name: 'Enterprise Voices', status: 'shipped' as const, api: 'POST /v1/voice-marketplace/listings', notes: 'Approved clones with ownership attestation + enterprise license type.' },
      { id: 'language-packs', name: 'Language Packs', status: 'shipped' as const, api: 'POST /v1/voice-marketplace/listings', notes: `kind=language_pack — one commercial pack per registry language (${LANGUAGE_PACK_COUNT}).` },
      { id: 'analytics', name: 'Analytics', status: 'shipped' as const, api: 'GET /v1/voice-marketplace/analytics', notes: 'Listing/install/rating aggregates. Full Voice Analytics lives in the Voice Analytics hub.' },
      { id: 'billing', name: 'Billing', status: 'shipped' as const, api: 'shared Stripe + recorded sales', notes: 'Pro gate + recorded paid installs. Live Connect payouts via shared billing.' },
    ] satisfies VmCapability[],
    languagePackCount: LANGUAGE_PACK_COUNT,
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
      kubectl: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
      celebrityWithoutRights: false,
      crossTenantCloneSynthesis: false,
    },
  };
}
