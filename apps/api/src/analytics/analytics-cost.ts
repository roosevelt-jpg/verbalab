/** Estimated USD unit costs for analytics (not Stripe invoices). Overridable via env. */

function num(env: string, fallback: number): number {
  const raw = Number(process.env[env]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

export type AnalyticsCostRates = {
  translatePer1kChars: number;
  sttPerMinute: number;
  ttsPer1kChars: number;
  ocrPerPage: number;
  chatPer1kTokens: number;
  embeddingsPer1kTokens: number;
};

export function analyticsCostRates(): AnalyticsCostRates {
  return {
    translatePer1kChars: num('ANALYTICS_COST_TRANSLATE_PER_1K_CHARS', 0.02),
    sttPerMinute: num('ANALYTICS_COST_STT_PER_MINUTE', 0.006),
    ttsPer1kChars: num('ANALYTICS_COST_TTS_PER_1K_CHARS', 0.015),
    ocrPerPage: num('ANALYTICS_COST_OCR_PER_PAGE', 0.002),
    chatPer1kTokens: num('ANALYTICS_COST_CHAT_PER_1K_TOKENS', 0.00015),
    embeddingsPer1kTokens: num('ANALYTICS_COST_EMBEDDINGS_PER_1K_TOKENS', 0.00002),
  };
}

export function estimateFeatureCostUsd(
  feature: string,
  units: number,
  rates: AnalyticsCostRates = analyticsCostRates(),
): number {
  switch (feature) {
    case 'translate':
      return (units / 1000) * rates.translatePer1kChars;
    case 'stt':
      return (units / 60) * rates.sttPerMinute;
    case 'tts':
      return (units / 1000) * rates.ttsPer1kChars;
    case 'ocr':
      return units * rates.ocrPerPage;
    case 'chat':
      return (units / 1000) * rates.chatPer1kTokens;
    case 'embeddings':
      return (units / 1000) * rates.embeddingsPer1kTokens;
    default:
      return 0;
  }
}

export function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
