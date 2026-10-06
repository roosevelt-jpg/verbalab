export function languageKitsCatalog() {
  return {
    product: 'Lugemi Language Kit',
    model_id: 'lugemi-language-kit',
    model_version: 'pilot-1',
    family: 'Baobab + Echo + Translate',
    note:
      'Evidence-gated onboarding for underserved languages. A registry entry is not a model release. Stages: draft → data_ready → trained → evaluated → preview → released → withdrawn.',
    stages: ['draft', 'data_ready', 'trained', 'evaluated', 'preview', 'released', 'withdrawn'],
    apis: {
      engine: 'GET /v1/language-kits/engine',
      create: 'POST /v1/language-kits',
      list: 'GET /v1/language-kits',
      get: 'GET /v1/language-kits/:id',
      coverage: 'GET /v1/language-kits/:id/coverage',
      advance: 'POST /v1/language-kits/:id/advance',
    },
    console: '/language-kits',
    docs: '/docs/models/05_LANGUAGE_KIT.md',
  };
}
