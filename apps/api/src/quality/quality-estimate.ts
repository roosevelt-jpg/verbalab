export type QualityEstimateInput = {
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  provider: string;
};

export type QualityEstimate = {
  score: number;
  needsReview: boolean;
  reasons: string[];
};

function reviewThreshold: number {
  const raw = Number(process.env.QUALITY_REVIEW_THRESHOLD ?? 70);
  return Number.isFinite(raw) ? raw : 70;
}

/**
 * Lightweight heuristic only — not a trained QE model.
 * TM hits should pass provider "tm" for a high baseline score.
 */
export function estimateTranslationQuality(input: QualityEstimateInput): QualityEstimate {
  const reasons: string[] = [];
  let score = 100;

  const source = input.sourceText.trim;
  const target = input.targetText.trim;

  if (input.provider === 'tm') {
    return { score: 98, needsReview: false, reasons: ['tm_exact_hit'] };
  }

  if (!target) {
    return { score: 0, needsReview: true, reasons: ['empty_target'] };
  }

  if (target.includes('⟦VL')) {
    score -= 40;
    reasons.push('unresolved_glossary_placeholder');
  }

  if (input.sourceLang !== input.targetLang) {
    const srcNorm = source.toLowerCase;
    const tgtNorm = target.toLowerCase;
    if (srcNorm === tgtNorm) {
      score -= 35;
      reasons.push('identical_to_source');
    }
  }

  const srcLen = Math.max(1, [...source].length);
  const tgtLen = Math.max(1, [...target].length);
  const ratio = tgtLen / srcLen;
  if (ratio < 0.25 || ratio > 4) {
    score -= 25;
    reasons.push('extreme_length_ratio');
  } else if (ratio < 0.45 || ratio > 2.5) {
    score -= 10;
    reasons.push('unusual_length_ratio');
  }

  if ([...target].length < 2 && [...source].length > 8) {
    score -= 30;
    reasons.push('target_too_short');
  }

  score = Math.max(0, Math.min(100, score));
  const needsReview = score < reviewThreshold;
  if (needsReview && reasons.length === 0) {
    reasons.push('below_threshold');
  }

  return { score, needsReview, reasons };
}
