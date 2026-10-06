export type LanguageCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type LanguageCapability = {
  id: string;
  name: string;
  status: LanguageCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Language Engine (registry + detection hub surface). */
export function languageEngineCatalog() {
  return {
    product: 'Lugemi Language Engine',
    note:
      'Curated language registry with family, dialect, accent, and locale links. Detection runs through the AI Gateway. Not Ethnologue, not unlimited language coverage.',
    capabilities: [
      {
        id: 'registry-list',
        name: 'Language registry list',
        status: 'shipped',
        api: 'GET /v1/languages',
        notes: 'Seeded ISO codes with tier + script + family.',
      },
      {
        id: 'registry-get',
        name: 'Language detail',
        status: 'shipped',
        api: 'GET /v1/languages/:code',
        notes: 'Includes dialects, accents, locale pack, linguistic rules.',
      },
      {
        id: 'detect',
        name: 'Language detection',
        status: 'shipped',
        api: 'POST /v1/detect',
        notes: 'Gateway detect + franc offline fallback.',
      },
      {
        id: 'cloud-hub',
        name: 'Language Cloud hub',
        status: 'shipped',
        api: 'GET /v1/language/products',
        notes: 'Parent product map for Translate, dialects, accents, locales, country packs.',
      },
      {
        id: 'enterprise-registry',
        name: 'Enterprise Language Registry',
        status: 'shipped',
        api: 'GET /v1/registry',
        notes: 'Families, scripts, rules — curated, not Ethnologue.',
      },
      {
        id: 'graphql',
        name: 'GraphQL languages',
        status: 'shipped',
        api: 'query languages',
        notes: 'Language Cloud GraphQL slice.',
      },
      {
        id: 'ethnologue',
        name: 'Ethnologue / full typology',
        status: 'deferred',
        api: null,
        notes: 'Curated seeds only — no Ethnologue parity claim.',
      },
      {
        id: 'unlimited-coverage',
        name: 'Unlimited language coverage',
        status: 'deferred',
        api: null,
        notes: 'Bounded strategic African + vendor set.',
      },
    ] satisfies LanguageCapability[],
    honesty: {
      ethnologueParity: false,
      unlimitedCoverage: false,
      regeneratesTranslate: false,
    },
    links: {
      console: '/language',
      registry: '/registry',
      dialects: '/dialects',
      accents: '/accents',
      locales: '/locales',
      countries: '/countries',
      openapi: '/v1/openapi.json',
      docs: '/docs/LANGUAGE_CLOUD.md',
    },
  };
}
