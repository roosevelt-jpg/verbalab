import { randomUUID } from 'crypto';

/** Shared result contract for next-model portfolio APIs (see docs/next-model-portfolio/). */
export type CoverageStatus = 'supported' | 'preview' | 'unsupported' | 'unavailable';

export type PortfolioResultMeta = {
  request_id: string;
  model_id: string;
  model_version: string;
  language_pack_version: string;
  source_language_tags: string[];
  target_language_tag: string;
  variety_id: string | null;
  status: CoverageStatus;
  warnings: string[];
  evidence_ref: string;
};

export function portfolioMeta(input: {
  requestId?: string;
  modelId: string;
  modelVersion?: string;
  languagePackVersion?: string;
  sourceLanguageTags: string[];
  targetLanguageTag: string;
  varietyId?: string | null;
  status?: CoverageStatus;
  warnings?: string[];
  evidenceRef?: string;
}): PortfolioResultMeta {
  return {
    request_id: input.requestId ?? randomUUID(),
    model_id: input.modelId,
    model_version: input.modelVersion ?? 'pilot-1',
    language_pack_version: input.languagePackVersion ?? 'pack-pilot-1',
    source_language_tags: input.sourceLanguageTags,
    target_language_tag: input.targetLanguageTag,
    variety_id: input.varietyId ?? null,
    status: input.status ?? 'preview',
    warnings: input.warnings ?? [],
    evidence_ref: input.evidenceRef ?? `evidence_${randomUUID().slice(0, 8)}`,
  };
}

export const PORTFOLIO_PILOT_CORRIDORS = [
  {
    id: 'twi-english',
    sourceTags: ['ak', 'en'],
    varietyId: 'ak-GH-twi',
    label: 'Twi–English (Ghana)',
    evaluated: true,
  },
  {
    id: 'yoruba-english',
    sourceTags: ['yo', 'en'],
    varietyId: 'yo-NG',
    label: 'Yoruba–English (Nigeria)',
    evaluated: true,
  },
  {
    id: 'hausa-english',
    sourceTags: ['ha', 'en'],
    varietyId: 'ha-NG',
    label: 'Hausa–English',
    evaluated: false,
  },
] as const;
