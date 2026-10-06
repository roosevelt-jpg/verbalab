export type DialectCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type DialectCapability = {
  id: string;
  name: string;
  status: DialectCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Language Cloud → Dialect Detection engine. */
export function dialectEngineCatalog() {
  return {
    product: 'Lugemi Dialect Engine',
    note:
      'Curated dialect registry with cue-based detection. Optional LLM assist. Not accent detection and not unlimited dialect coverage.',
    capabilities: [
      {
        id: 'list',
        name: 'List dialects',
        status: 'shipped',
        api: 'GET /v1/dialects',
        notes: 'Optional ?language= filter.',
      },
      {
        id: 'get',
        name: 'Get dialect',
        status: 'shipped',
        api: 'GET /v1/dialects/:code',
        notes: 'Registry detail with cue terms.',
      },
      {
        id: 'detect',
        name: 'Dialect detection',
        status: 'shipped',
        api: 'POST /v1/dialects/detect',
        notes: 'Cue scoring (+ optional LLM assist).',
      },
      {
        id: 'graphql',
        name: 'GraphQL dialects / detectDialect',
        status: 'shipped',
        api: 'query dialects / mutation detectDialect',
        notes: 'Language Cloud GraphQL slice.',
      },
      {
        id: 'unlimited-coverage',
        name: 'Unlimited dialect coverage',
        status: 'deferred',
        api: null,
        notes: 'Curated African-priority seeds only.',
      },
      {
        id: 'acoustic-id',
        name: 'Acoustic dialect ID',
        status: 'deferred',
        api: null,
        notes: 'Text/cue scoring — not acoustic phonetics.',
      },
    ] satisfies DialectCapability[],
    honesty: {
      unlimitedCoverage: false,
      acousticPhoneticsId: false,
      isAccentDetection: false,
    },
    links: {
      console: '/dialects',
      accents: '/accents',
      language: '/language',
      openapi: '/v1/openapi.json',
      docs: '/docs/LANGUAGE_CLOUD.md',
    },
  };
}
