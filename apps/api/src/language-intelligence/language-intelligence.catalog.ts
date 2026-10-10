export type LanguageIntelCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type LanguageIntelCapability = {
  id: string;
  name: string;
  status: LanguageIntelCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Lugemi Language Intelligence. */
export function languageIntelligenceCatalog() {
  return {
    product: 'Language Intelligence',
    note:
      'Unified façade over language/dialect/accent detection plus heuristic intent/sentiment/emotion/readability/complexity and confidence scores. Not a full NLP research platform or emotion-from-audio product.',
    capabilities: [
      {
        id: 'language_detection',
        name: 'Language detection',
        status: 'shipped',
        api: 'POST /v1/detect',
        notes: 'Google + franc; also via analyze.',
      },
      {
        id: 'dialect_detection',
        name: 'Dialect detection',
        status: 'shipped',
        api: 'POST /v1/dialects/detect',
        notes: 'Curated cue scoring.',
      },
      {
        id: 'accent_detection',
        name: 'Accent detection',
        status: 'shipped',
        api: 'POST /v1/accents/detect',
        notes: 'Spoken profiles + STT/text cues. Not acoustic phonetics ID.',
      },
      {
        id: 'intent',
        name: 'Intent',
        status: 'shipped',
        api: 'POST /v1/language-intelligence/intent',
        notes: 'Keyword/heuristic intent labels — not a trained NLU model.',
      },
      {
        id: 'sentiment',
        name: 'Sentiment',
        status: 'shipped',
        api: 'POST /v1/language-intelligence/sentiment',
        notes: 'Lexicon polarity scoring — not a production sentiment suite.',
      },
      {
        id: 'emotion',
        name: 'Emotion',
        status: 'shipped',
        api: 'POST /v1/language-intelligence/emotion',
        notes: 'Text cue buckets — not voice emotion recognition.',
      },
      {
        id: 'readability',
        name: 'Readability',
        status: 'shipped',
        api: 'POST /v1/language-intelligence/readability',
        notes: 'Flesch-like English heuristic.',
      },
      {
        id: 'complexity',
        name: 'Complexity',
        status: 'shipped',
        api: 'POST /v1/language-intelligence/complexity',
        notes: 'Lexical/syntactic density score.',
      },
      {
        id: 'translation_confidence',
        name: 'Translation confidence',
        status: 'shipped',
        api: 'POST /v1/language-intelligence/translation-confidence',
        notes: 'Heuristic QE (same family as /v1/reviews) — not a trained QE model.',
      },
      {
        id: 'speech_confidence',
        name: 'Speech confidence',
        status: 'shipped',
        api: 'POST /v1/language-intelligence/speech-confidence',
        notes: 'Transcript heuristics (+ optional client STT score). Whisper path has no native confidence.',
      },
    ] satisfies LanguageIntelCapability[],
    engines: {
      realtime: { status: 'shipped', api: 'POST /v1/language-intelligence/analyze/stream', notes: 'SSE progressive signals' },
      rest: { status: 'shipped', api: '/v1/language-intelligence/*' },
      graphql: { status: 'shipped', notes: 'languageIntelligence + analyzeLanguage' },
      sdk: { status: 'shipped', package: '@lugemi/sdk' },
      monitoring: { status: 'shipped', api: 'GET /v1/metrics/translate', notes: 'Shared observability stack' },
      analytics: { status: 'shipped', api: 'GET /v1/language-intelligence/analytics' },
    },
    links: {
      dashboard: '/language-intelligence',
      language: '/language',
      dialects: '/dialects',
      accents: '/accents',
      docs: '/docs/LANGUAGE_INTELLIGENCE.md',
    },
  };
}
