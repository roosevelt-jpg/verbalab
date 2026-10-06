/**
 * Lugemi next-model portfolio — discoverable engine notes.
 * Plain-text capability notes only (no shipped/partial badges, no ADR).
 */
export function portfolioCatalog() {
  return {
    product: 'Lugemi Verified Interpreter',
    note:
      'Working name for the Mix + Fidelity + Live offering. Meaning-preserving mixed-language speech, verification with clarification, and incremental interpretation with explicit commitment and repair. Pilot corridors: Twi–English and Yoruba–English. Lugemi-owned local adapters run without external keys.',
    pillars: [
      {
        id: 'mix',
        displayName: 'Lugemi Mix',
        slug: 'lugemi-mix',
        family: 'Echo + Baobab + Translate + Voice',
        api: 'POST /v1/mix/transcribe-translate',
        console: '/mix',
        notes:
          'Joint mixed-language transcription and translation with language-switch spans, protected entities, and uncertainty reasons. Language hints are hints, not forced labels.',
      },
      {
        id: 'fidelity',
        displayName: 'Lugemi Fidelity',
        slug: 'lugemi-fidelity',
        family: 'Translate + Reason + Trust',
        api: 'POST /v1/fidelity/verify',
        console: '/fidelity',
        notes:
          'Meaning ledger verification with accept/retry/clarify/review decisions. Clarification must not turn refusal or silence into confirmation.',
      },
      {
        id: 'live',
        displayName: 'Lugemi Live',
        slug: 'lugemi-live',
        family: 'Echo + Translate + Voice',
        api: 'POST /v1/live/sessions',
        console: '/live',
        notes:
          'Incremental interpretation with provisional/committed/spoken states and audible repair. Spoken audio is immutable; repairs reference earlier segments.',
      },
      {
        id: 'pragmatics',
        displayName: 'Lugemi Pragmatics',
        slug: 'lugemi-pragmatics',
        family: 'Baobab + Translate + Voice',
        api: 'POST /v1/pragmatics/translate',
        console: '/pragmatics',
        notes:
          'Speech-act and register preservation with modes faithful | literal | localized. Default is faithful; style cannot silently turn refusal into consent.',
      },
      {
        id: 'language_kit',
        displayName: 'Lugemi Language Kit',
        slug: 'lugemi-language-kit',
        family: 'Baobab + Echo + Translate',
        api: 'POST /v1/language-kits',
        console: '/language-kits',
        notes:
          'Evidence-gated language onboarding. Registry entry is not a model release. Coverage statuses are separate for ASR, translation, and synthesis.',
      },
      {
        id: 'edge',
        displayName: 'Lugemi Edge',
        slug: 'lugemi-edge',
        family: 'Edge + Echo + Translate + Voice',
        api: 'GET /v1/edge/packs',
        console: '/edge',
        notes:
          'Verified offline corridor packs with local | cloud_allowed | cloud_forbidden modes. No silent cloud fallback in cloud_forbidden mode.',
      },
      {
        id: 'grounded',
        displayName: 'Lugemi Grounded',
        slug: 'lugemi-grounded',
        family: 'Fusion + Vision + Vector + Translate',
        api: 'POST /v1/grounded/interpret',
        console: '/grounded',
        notes:
          'Speech plus selected visual referent. Returns document_evidence, speaker_claim, and translation separately. Assistive document communication only.',
      },
    ],
    docs: '/docs/models/LUGEMI_NEXT_MODEL_PORTFOLIO.md',
    links: {
      models: '/models',
      verifiedInterpreter: '/verified-interpreter',
      mix: '/mix',
      fidelity: '/fidelity',
      live: '/live',
      pragmatics: '/pragmatics',
      languageKits: '/language-kits',
      edge: '/edge',
      grounded: '/grounded',
      playground: '/playground',
      openapi: '/v1/openapi.json',
    },
  };
}
