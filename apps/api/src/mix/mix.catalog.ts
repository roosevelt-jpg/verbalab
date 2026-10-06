import {
  PORTFOLIO_CORRIDORS,
  PORTFOLIO_CORRIDOR_COUNT,
  PORTFOLIO_COUNTRIES_COVERED,
  PORTFOLIO_COUNTRY_PACK_TOTAL,
} from '../portfolio/portfolio.corridors';

export function mixCatalog() {
  const allVarieties = [...new Set(PORTFOLIO_CORRIDORS.map((c) => c.varietyId))];
  const strategic = [
    ...new Set(PORTFOLIO_CORRIDORS.filter((c) => c.evaluated).map((c) => c.varietyId)),
  ];
  return {
    product: 'Lugemi Mix',
    model_id: 'lugemi-mix',
    model_version: 'local-demo-1',
    family: 'Echo + Baobab + Translate + Voice',
    note: `Mixed-language speech transcription and translation that preserves switch spans, local names, lexical tone where meaning depends on it, and translation alignment. Catalog covers all ${PORTFOLIO_CORRIDOR_COUNT} country-pack corridors (language↔English across ${PORTFOLIO_COUNTRIES_COVERED} of ${PORTFOLIO_COUNTRY_PACK_TOTAL} countries) — not only Twi and Yoruba. Local cascade adapter — no external keys required.`,
    corridor_count: PORTFOLIO_CORRIDOR_COUNT,
    countries_covered: PORTFOLIO_COUNTRIES_COVERED,
    country_pack_total: PORTFOLIO_COUNTRY_PACK_TOTAL,
    /** Full country-pack catalog — every corridor variety, not only Twi/Yoruba. */
    evaluated_varieties: allVarieties,
    strategic_varieties: strategic,
    varieties: PORTFOLIO_CORRIDORS.map((c) => ({
      id: c.varietyId,
      corridor: c.id,
      languageCode: c.languageCode,
      countryCode: c.countryCode,
      countryName: c.countryName,
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
