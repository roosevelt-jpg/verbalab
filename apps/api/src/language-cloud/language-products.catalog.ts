export type LanguageProductStatus = 'shipped' | 'partial' | 'deferred';

export type LanguageProductRow = {
  id: string;
  name: string;
  status: LanguageProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 6 product map. */
export function languageProductCatalog: LanguageProductRow[] {
  return [
    {
      id: 'translate',
      name: 'Lugemi Translate',
      status: 'shipped',
      api: 'POST /v1/translate',
      console: '/translate',
      notes: 'Google MT via gateway; glossary/TM/locale DNT; formats + SSE.',
    },
    {
      id: 'detect',
      name: 'Language Detection',
      status: 'shipped',
      api: 'POST /v1/detect',
      console: '/playground',
      notes: 'Google detect + franc offline fallback; source=auto on translate.',
    },
    {
      id: 'dialect',
      name: 'Dialect Detection',
      status: 'shipped',
      api: 'POST /v1/dialects/detect',
      console: '/dialects',
      notes: 'Curated registry + cue scoring. Optional LLM assist. Not accent detection.',
    },
    {
      id: 'accent',
      name: 'Accent Detection',
      status: 'shipped',
      api: 'POST /v1/accents/detect',
      console: '/accents',
      notes:
        'Spoken accent profiles + STT/text cue scoring. Not acoustic phonetics ID.',
    },
    {
      id: 'grammar',
      name: 'Grammar AI',
      status: 'shipped',
      api: 'POST /v1/grammar/check',
      console: '/grammar',
      notes: 'Rules + optional LLM; spell/correct/suggest. Not Grammarly parity.',
    },
    {
      id: 'style',
      name: 'Writing Style AI',
      status: 'shipped',
      api: 'POST /v1/style/rewrite',
      console: '/style',
      notes: 'Bounded profiles + rules/LLM rewrite. Not legal/medical style OS.',
    },
    {
      id: 'language-intelligence',
      name: 'Language Intelligence',
      status: 'shipped',
      api: 'POST /v1/language-intelligence/analyze',
      console: '/language-intelligence',
      notes:
        'Detect + dialect/accent façade + heuristic intent/sentiment/emotion/readability/complexity/confidence. Not NLP research OS.',
    },
    {
      id: 'localize',
      name: 'Localization',
      status: 'shipped',
      api: 'POST /v1/localize',
      console: '/localize',
      notes: 'JSON/YAML key-stable MT; ICU passthrough.',
    },
    {
      id: 'tm',
      name: 'Translation Memory',
      status: 'shipped',
      api: '/v1/tm',
      console: '/tm',
      notes:
        'Scoped TM + similarity/versioning. Exact hit on translate; not Phrase/MemoQ.',
    },
    {
      id: 'glossary',
      name: 'Glossary / Terminology',
      status: 'shipped',
      api: '/v1/glossary',
      console: '/glossary',
      notes: 'Workspace terms + vertical packs. No separate termbase IDs.',
    },
    {
      id: 'analytics',
      name: 'Language Analytics',
      status: 'shipped',
      api: 'GET /v1/analytics',
      console: '/analytics',
      notes:
        'Usage, quality, latency, costs, dialect/country reports. Not a BI cloud.',
    },
    {
      id: 'quality',
      name: 'Quality Assessment',
      status: 'shipped',
      api: '/v1/reviews',
      console: '/reviews',
      notes: 'Heuristic quality score; accept→TM / reject.',
    },
    {
      id: 'locales',
      name: 'Locale / language packs',
      status: 'shipped',
      api: 'GET /v1/locales',
      console: '/locales',
      notes: 'Cultural notes + DNT entities (en/fr/sw/yo/am).',
    },
    {
      id: 'country-packs',
      name: 'Country / regional packs',
      status: 'shipped',
      api: 'GET /v1/country-packs',
      console: '/countries',
      notes: 'ISO country guidance composing locale packs. Not billing SKUs.',
    },
    {
      id: 'registry',
      name: 'Language registry',
      status: 'shipped',
      api: 'GET /v1/registry',
      console: '/registry',
      notes:
        'Enterprise catalog: languages, families, scripts/alphabets, locales, rule kinds. Curated — not Ethnologue.',
    },
    {
      id: 'coverage',
      name: 'Coverage / eval',
      status: 'shipped',
      api: 'GET /v1/coverage',
      console: '/coverage',
      notes: 'Golden EN→sw/yo/am reference metrics.',
    },
  ];
}

export function languageArchitectureNotes {
  return {
    style: 'nest_modular_monolith',
    rest: true,
    graphql: true,
    cqrs: true,
    hexagonalRewrite: false,
    eventDriven: 'audit_and_jobs_only',
    sdk: '@lugemi/sdk',
    cli: '@lugemi/cli',
    openapi: '/v1/openapi.json',
    infra: ['docker', 'fly', 'github_actions', 'terraform', 'eks'],
    terraform: true,
    kubernetes: true,
    cloudProvider: 'aws',
    primaryRegion: 'af-south-1',
  };
}
