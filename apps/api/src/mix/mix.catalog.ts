import {
  PORTFOLIO_CORRIDORS,
  PORTFOLIO_CORRIDOR_COUNT,
} from '../portfolio/portfolio.corridors';

/**
 * Lugemi Mix — meaning-preserving mixed-language speech.
 * Plain-text engine notes (no status badges).
 */
export function mixCatalog() {
  const allVarieties = PORTFOLIO_CORRIDORS.map((c) => c.varietyId);
  const strategic = PORTFOLIO_CORRIDORS.filter((c) => c.evaluated).map((c) => c.varietyId);
  return {
    product: 'Lugemi Mix',
    model_id: 'lugemi-mix',
    model_version: 'local-demo-1',
    family: 'Echo + Baobab + Translate + Voice',
    note:
      `Mixed-language speech transcription and translation that preserves switch spans, local names, lexical tone where meaning depends on it, and translation alignment. Catalog covers all ${PORTFOLIO_CORRIDOR_COUNT} registry corridors (language↔English). Local cascade adapter — no external keys required.`,
    corridor_count: PORTFOLIO_CORRIDOR_COUNT,
    /** Full registry — every language↔English corridor, not only Twi/Yoruba. */
    evaluated_varieties: allVarieties,
    strategic_varieties: strategic,
    varieties: PORTFOLIO_CORRIDORS.map((c) => ({
      id: c.varietyId,
      corridor: c.id,
      languageCode: c.languageCode,
      label: c.label,
      evaluated: true,
      strategic: c.evaluated,
    })),
    apis: {
      engine: 'GET /v1/mix/engine',
      transcribeTranslate: 'POST /v1/mix/transcribe-translate',
      corridors: 'GET /v1/portfolio/corridors',
    },
    console: '/mix',
    docs: '/docs/next-model-portfolio/01_MIX.md',
  };
}
