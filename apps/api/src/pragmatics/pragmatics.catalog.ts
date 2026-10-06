import {
  PORTFOLIO_CORRIDOR_COUNT,
  PORTFOLIO_COUNTRIES_COVERED,
} from '../portfolio/portfolio.corridors';
import { TOTAL_LANGUAGE_COUNT } from '../languages/language-seeds';

export function pragmaticsCatalog() {
  return {
    product: 'Lugemi Pragmatics',
    model_id: 'lugemi-pragmatics',
    model_version: 'local-demo-1',
    family: 'Baobab + Translate + Voice',
    note: `Preserve speech acts, register, and interpersonal meaning across languages. Modes: faithful (default), literal, localized. Target language picker covers all ${TOTAL_LANGUAGE_COUNT} registry languages (${PORTFOLIO_CORRIDOR_COUNT} country-pack ↔English corridors across ${PORTFOLIO_COUNTRIES_COVERED} countries). Does not infer personality, ethnicity, sincerity, or emotion from voice.`,
    modes: ['faithful', 'literal', 'localized'],
    language_count: TOTAL_LANGUAGE_COUNT,
    corridor_count: PORTFOLIO_CORRIDOR_COUNT,
    countries_covered: PORTFOLIO_COUNTRIES_COVERED,
    apis: {
      engine: 'GET /v1/pragmatics/engine',
      translate: 'POST /v1/pragmatics/translate',
    },
    console: '/pragmatics',
    docs: '/docs/next-model-portfolio/04_PRAGMATICS.md',
  };
}
