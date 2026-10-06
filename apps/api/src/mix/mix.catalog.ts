/**
 * Lugemi Mix — meaning-preserving mixed-language speech.
 * Plain-text engine notes (no status badges).
 */
export function mixCatalog() {
  return {
    product: 'Lugemi Mix',
    model_id: 'lugemi-mix',
    model_version: 'pilot-1',
    family: 'Echo + Baobab + Translate + Voice',
    note:
      'Mixed-language speech transcription and translation that preserves switch spans, local names, lexical tone where meaning depends on it, and translation alignment. Local cascade adapter — no external keys required.',
    evaluated_varieties: ['ak-GH-twi', 'yo-NG'],
    apis: {
      engine: 'GET /v1/mix/engine',
      transcribeTranslate: 'POST /v1/mix/transcribe-translate',
    },
    console: '/mix',
    docs: '/docs/models/01_MIX.md',
  };
}
