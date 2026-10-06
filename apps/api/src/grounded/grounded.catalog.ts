export function groundedCatalog() {
  return {
    product: 'Lugemi Grounded',
    model_id: 'lugemi-grounded',
    model_version: 'pilot-1',
    family: 'Fusion + Vision + Vector + Translate',
    note:
      'Speech plus the user-selected visual referent. Returns document_evidence, speaker_claim, and translation separately. Assistive document communication — not automated diagnosis, contract approval, or financial advice.',
    apis: {
      engine: 'GET /v1/grounded/engine',
      interpret: 'POST /v1/grounded/interpret',
    },
    console: '/grounded',
    docs: '/docs/models/07_GROUNDED.md',
  };
}
