export function pragmaticsCatalog() {
  return {
    product: 'Lugemi Pragmatics',
    model_id: 'lugemi-pragmatics',
    model_version: 'pilot-1',
    family: 'Baobab + Translate + Voice',
    note:
      'Preserve speech acts, register, and interpersonal meaning across languages. Modes: faithful (default), literal, localized. Does not infer personality, ethnicity, sincerity, or emotion from voice.',
    modes: ['faithful', 'literal', 'localized'],
    apis: {
      engine: 'GET /v1/pragmatics/engine',
      translate: 'POST /v1/pragmatics/translate',
    },
    console: '/pragmatics',
    docs: '/docs/next-model-portfolio/04_PRAGMATICS.md',
  };
}
