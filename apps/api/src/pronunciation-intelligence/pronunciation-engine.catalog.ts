export type PronunciationCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type PronunciationCapability = {
  id: string;
  name: string;
  status: PronunciationCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Pronunciation Intelligence. */
export function pronunciationEngineCatalog() {
  return {
    product: 'Lugemi Pronunciation Intelligence',
    note:
      'Reference vs transcript assessment, fluency proxies, grapheme phoneme/stress heuristics, and coaching tips. Not ELSA / SpeechAce / forced-alignment phoneme ASR.',
    capabilities: [
      {
        id: 'language-learning',
        name: 'Language Learning',
        status: 'partial',
        api: 'POST /v1/pronunciation/assess',
        notes: 'Assessment + coaching surfaces for practice loops — not a full LMS.',
      },
      {
        id: 'pronunciation-assessment',
        name: 'Pronunciation Assessment',
        status: 'shipped',
        api: 'POST /v1/pronunciation/assess',
        notes: 'Word-level alignment of reference vs hypothesis/STT.',
      },
      {
        id: 'pronunciation-scoring',
        name: 'Pronunciation Scoring',
        status: 'shipped',
        api: 'POST /v1/pronunciation/score',
        notes: '0–100 overall + accuracy/fluency/stress components.',
      },
      {
        id: 'accent-coaching',
        name: 'Accent Coaching',
        status: 'partial',
        api: 'POST /v1/pronunciation/coach',
        notes: 'Rule/tip coaching from mismatches + language packs — not acoustic accent models.',
      },
      {
        id: 'phoneme-detection',
        name: 'Phoneme Detection',
        status: 'partial',
        api: 'POST /v1/pronunciation/phonemes',
        notes: 'Dictionary + grapheme→phoneme heuristics — not forced alignment.',
      },
      {
        id: 'word-stress',
        name: 'Word Stress',
        status: 'partial',
        api: 'POST /v1/pronunciation/phonemes',
        notes: 'Syllable heuristics with language stress defaults (EN first / SW penult).',
      },
      {
        id: 'sentence-fluency',
        name: 'Sentence Fluency',
        status: 'partial',
        api: 'POST /v1/pronunciation/fluency',
        notes: 'Speaking rate + pause/silence proxies from PCM/STT timing.',
      },
      {
        id: 'assessment-engine',
        name: 'Assessment Engine',
        status: 'shipped',
        api: 'GET /v1/pronunciation/engine',
        notes: 'Capability catalog + honesty notes.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/pronunciation/analytics',
        notes: 'Org audit-derived usage — not CEFR certification scores.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs + pronunciation.* audit actions.',
      },
      {
        id: 'forced-alignment',
        name: 'Forced Alignment Phonemes',
        status: 'deferred',
        api: null,
        notes: 'True phoneme timing / WhisperX-style alignment deferred.',
      },
    ] satisfies PronunciationCapability[],
    links: {
      console: '/pronunciation-intelligence',
      hub: '/speech',
      accents: '/accent-intelligence',
      openapi: '/v1/openapi.json',
      docs: '/docs/PRONUNCIATION_INTELLIGENCE.md',
    },
    architecture: {
      rest: true,
      sdk: '@lugemi/sdk',
      cli: '@lugemi/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    },
  };
}
