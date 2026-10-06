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
      'Curated ISO country packs that compose language locale packs. African-priority guidance — not a CLDR dump, billing SKU catalog, or worldwide coverage claim.',
    capabilities: [
      {
        id: 'list',
        name: 'List country packs',
        status: 'shipped',
        api: 'GET /v1/country-packs',
        notes: 'Optional ?region= filter.',
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
        name: 'Worldwide coverage',
        status: 'deferred',
        api: null,
        notes: 'Curated African-priority set; not every ISO country.',
      },
    ] satisfies CountryCapability[],
    honesty: {
      cldrOs: false,
      billingSkuCatalog: false,
      worldwideCoverage: false,
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
