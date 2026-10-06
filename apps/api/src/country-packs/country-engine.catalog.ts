export type CountryCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type CountryCapability = {
  id: string;
  name: string;
  status: CountryCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Country Engine (country / regional packs). */
export function countryEngineCatalog() {
  return {
    product: 'Lugemi Country Engine',
    note:
      'Full ISO country catalog with Africa-first guidance. Each pack composes language locale packs from the registry where seeded — curated composition, not a CLDR dump of every dialect, and not a billing SKU catalog.',
    capabilities: [
      {
        id: 'list',
        name: 'List country packs',
        status: 'shipped',
        api: 'GET /v1/country-packs',
        notes: 'Full ISO set; optional ?region= filter. Alias: GET /v1/countries.',
      },
      {
        id: 'get',
        name: 'Get country pack',
        status: 'shipped',
        api: 'GET /v1/country-packs/:code',
        notes: 'ISO 3166-1 alpha-2 keyed packs.',
      },
      {
        id: 'compose-locales',
        name: 'Compose locale packs',
        status: 'shipped',
        api: 'GET /v1/country-packs/:code?includeLocales=true',
        notes: 'Embeds linked language locale packs where seeded.',
      },
      {
        id: 'graphql',
        name: 'GraphQL countryPacks',
        status: 'shipped',
        api: 'query countryPacks',
        notes: 'Language Cloud GraphQL slice.',
      },
      {
        id: 'cldr-sync',
        name: 'Auto CLDR sync',
        status: 'deferred',
        api: null,
        notes: 'No automatic Unicode CLDR ingest.',
      },
      {
        id: 'billing-skus',
        name: 'Paid country SKUs',
        status: 'deferred',
        api: null,
        notes: 'Guidance packs only — not commerce SKUs.',
      },
      {
        id: 'worldwide',
        name: 'Worldwide country list',
        status: 'shipped',
        api: 'GET /v1/country-packs',
        notes:
          'All ISO countries listed (Africa-first order). Locale composition is curated where seeded — not every dialect/variant.',
      },
    ] satisfies CountryCapability[],
    honesty: {
      cldrOs: false,
      billingSkuCatalog: false,
      /** Full ISO country list is shipped; full CLDR dialect completeness is not. */
      worldwideCoverage: true,
      worldwideDialectCompleteness: false,
      regeneratesLocalePacks: false,
    },
    links: {
      console: '/countries',
      language: '/language',
      locales: '/locales',
      openapi: '/v1/openapi.json',
      docs: '/docs/LANGUAGE_CLOUD.md',
      adr: '/docs/adr/0056-country-regional-packs.md',
    },
  };
}
