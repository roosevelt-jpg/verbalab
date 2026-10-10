import {
  PORTFOLIO_CORRIDORS,
  PORTFOLIO_CORRIDOR_COUNT,
  PORTFOLIO_COUNTRIES_COVERED,
} from '../portfolio/portfolio.corridors';
import { LANGUAGE_SEEDS, TOTAL_LANGUAGE_COUNT } from '../languages/language-seeds';

export function languageKitsCatalog() {
  return {
    product: 'Lugemi Language Kit',
    model_id: 'lugemi-language-kit',
    model_version: 'local-demo-1',
    family: 'Baobab + Echo + Translate',
    note: `Evidence-gated onboarding for underserved languages. A registry entry is not a model release. Catalog lists all ${TOTAL_LANGUAGE_COUNT} registry languages for kit drafting alongside ${PORTFOLIO_CORRIDOR_COUNT} country-pack corridors (${PORTFOLIO_COUNTRIES_COVERED} countries). Stages: draft → data_ready → trained → evaluated → preview → released → withdrawn.`,
    stages: ['draft', 'data_ready', 'trained', 'evaluated', 'preview', 'released', 'withdrawn'],
    language_count: TOTAL_LANGUAGE_COUNT,
    corridor_count: PORTFOLIO_CORRIDOR_COUNT,
    countries_covered: PORTFOLIO_COUNTRIES_COVERED,
    languages: LANGUAGE_SEEDS.map((l) => {
      const corridor = PORTFOLIO_CORRIDORS.find((c) => c.languageCode === l.code);
      return {
        languageTag: l.code,
        displayName: l.nameEn,
        nameNative: l.nameNative ?? null,
        varietyId: corridor?.varietyId ?? l.code,
        script: l.script ?? null,
        tier: l.tier,
      };
    }),
    apis: {
      engine: 'GET /v1/language-kits/engine',
      languages: 'GET /v1/language-kits/languages',
      create: 'POST /v1/language-kits',
      list: 'GET /v1/language-kits',
      get: 'GET /v1/language-kits/:id',
      coverage: 'GET /v1/language-kits/:id/coverage',
      advance: 'POST /v1/language-kits/:id/advance',
    },
    console: '/language-kits',
    docs: '/docs/next-model-portfolio/05_LANGUAGE_KIT.md',
  };
}
