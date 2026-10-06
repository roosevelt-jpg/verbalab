import { randomUUID } from 'crypto';
import {
  PORTFOLIO_CORRIDORS,
  PORTFOLIO_CORRIDOR_COUNT,
  type PortfolioCorridor,
} from './portfolio.corridors';

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
    model_version: input.modelVersion ?? 'local-demo-1',
    language_pack_version: input.languagePackVersion ?? 'pack-local-demo-1',
    source_language_tags: input.sourceLanguageTags,
    target_language_tag: input.targetLanguageTag,
    variety_id: input.varietyId ?? null,
    status: input.status ?? 'preview',
    warnings: input.warnings ?? [],
    evidence_ref: input.evidenceRef ?? `evidence_${randomUUID().slice(0, 8)}`,
  };
}

/**
 * Full registry corridors (language ↔ English). Prefer PORTFOLIO_CORRIDORS.
 * Alias kept for existing imports.
 */
export const PORTFOLIO_PILOT_CORRIDORS: readonly PortfolioCorridor[] = PORTFOLIO_CORRIDORS;

export { PORTFOLIO_CORRIDORS, PORTFOLIO_CORRIDOR_COUNT };
export type { PortfolioCorridor };
