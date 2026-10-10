import {
  PORTFOLIO_CORRIDOR_COUNT,
  PORTFOLIO_COUNTRIES_COVERED,
} from '../portfolio/portfolio.corridors';
import { TOTAL_LANGUAGE_COUNT } from '../languages/language-seeds';

export function groundedCatalog() {
  return {
    product: 'Lugemi Grounded',
    model_id: 'lugemi-grounded',
    model_version: 'local-demo-1',
    family: 'Fusion + Vision + Vector + Translate',
    note: `Speech plus the user-selected visual referent. Returns document_evidence, speaker_claim, and translation separately. Target language covers all ${TOTAL_LANGUAGE_COUNT} registry languages (${PORTFOLIO_CORRIDOR_COUNT} country-pack ↔English corridors across ${PORTFOLIO_COUNTRIES_COVERED} countries). Assistive document communication — not automated diagnosis, contract approval, or financial advice.`,
    language_count: TOTAL_LANGUAGE_COUNT,
    corridor_count: PORTFOLIO_CORRIDOR_COUNT,
    countries_covered: PORTFOLIO_COUNTRIES_COVERED,
    apis: {
      engine: 'GET /v1/grounded/engine',
      interpret: 'POST /v1/grounded/interpret',
    },
    console: '/grounded',
    docs: '/docs/next-model-portfolio/07_GROUNDED.md',
  };
}
