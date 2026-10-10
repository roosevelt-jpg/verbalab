export type LocaleCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type LocaleCapability = {
  id: string;
  name: string;
  status: LocaleCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Language Cloud → Locale / language packs engine. */
export function localeEngineCatalog() {
  return {
    product: 'Lugemi Locale Engine',
    note:
      'Language-keyed locale packs with cultural notes, honorifics, DNT entities, and format helpers. Not full CLDR or a localization TMS.',
    capabilities: [
      {
        id: 'list',
        name: 'List locale packs',
        status: 'shipped',
        api: 'GET /v1/locales',
        notes: 'Seeded packs linked to language registry.',
      },
      {
        id: 'get',
        name: 'Get locale pack',
        status: 'shipped',
        api: 'GET /v1/locales/:code',
        notes: 'By language code.',
      },
      {
        id: 'format',
        name: 'Format helpers',
        status: 'shipped',
        api: 'POST /v1/locales/format',
        notes: 'Date/number/currency formatting for a pack.',
      },
      {
        id: 'examples',
        name: 'Format examples',
        status: 'shipped',
        api: 'GET /v1/locales/:code/examples',
        notes: 'Sample formatted outputs.',
      },
      {
        id: 'layout',
        name: 'Layout hints',
        status: 'shipped',
        api: 'GET /v1/locales/:code/layout',
        notes: 'RTL / script layout guidance.',
      },
      {
        id: 'graphql',
        name: 'GraphQL localePacks',
        status: 'shipped',
        api: 'query localePacks',
        notes: 'Language Cloud GraphQL slice.',
      },
      {
        id: 'full-cldr',
        name: 'Full CLDR parity',
        status: 'deferred',
        api: null,
        notes: 'Curated packs — not Unicode CLDR dump.',
      },
      {
        id: 'tms',
        name: 'Localization TMS',
        status: 'deferred',
        api: null,
        notes: 'Localize JSON/YAML is separate; not Phrase/Crowdin OS.',
      },
    ] satisfies LocaleCapability[],
    honesty: {
      fullCldrParity: false,
      localizationTmsOs: false,
      regeneratesCountryPacks: false,
    },
    links: {
      console: '/locales',
      countries: '/countries',
      localize: '/localize',
      language: '/language',
      openapi: '/v1/openapi.json',
      docs: '/docs/LANGUAGE_CLOUD.md',
    },
  };
}
