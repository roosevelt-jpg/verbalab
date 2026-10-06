export type EmotionCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EmotionCapability = {
  id: string;
  name: string;
  status: EmotionCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Emotion Intelligence. */
export function emotionEngineCatalog() {
  return {
    product: 'Lugemi Emotion Intelligence',
    note:
      'Speech Cloud emotional state, sentiment, and tone from text cues (+ optional soft audio proxies). Heuristic — not trained SER, not NIST emotion science, not a commercial Affective Computing lab.',
    labels: [
      'happy',
      'sad',
      'angry',
      'fear',
      'neutral',
      'stress',
      'confidence',
      'excitement',
      'urgency',
    ],
    sentimentLabels: ['positive', 'neutral', 'negative', 'mixed'],
    toneLabels: ['formal', 'casual', 'urgent', 'empathetic', 'assertive', 'hesitant', 'neutral'],
    capabilities: [
      {
        id: 'detect',
        name: 'Emotion Detection',
        status: 'shipped',
        api: 'POST /v1/emotion/detect',
        notes:
          'Text and/or audio→STT + cue scoring; returns emotionalState, sentiment, and tone with confidence + honesty notes.',
      },
      {
        id: 'sentiment',
        name: 'Sentiment',
        status: 'shipped',
        api: 'POST /v1/emotion/detect',
        notes: 'Lexicon polarity on the same detect path — not a production sentiment suite.',
      },
      {
        id: 'tone',
        name: 'Delivery tone',
        status: 'shipped',
        api: 'POST /v1/emotion/detect',
        notes: 'Formal/casual/urgent/empathetic/assertive/hesitant heuristics — not acoustic prosody ASR.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'partial',
        api: 'POST /v1/emotion/stream',
        notes: 'SSE progress events including sentiment + tone. Not live continuous SER WebSocket.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/emotion/analytics',
        notes: 'Org audit-derived detect counts by label.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs + emotion.detect audit.',
      },
      {
        id: 'acoustic-ser',
        name: 'Acoustic speech emotion recognition',
        status: 'deferred',
        api: null,
        notes: 'Trained SER models deferred — soft audio proxies only today.',
      },
    ] satisfies EmotionCapability[],
    related: {
      languageIntelligenceEmotion: 'POST /v1/language-intelligence/emotion',
      languageIntelligenceSentiment: 'POST /v1/language-intelligence/sentiment',
      emotionVoice: 'POST /v1/emotion-voice/synthesize',
      note: 'Language Cloud text emotion/sentiment remain separate; Speech Emotion Intelligence uses Speech Cloud labels. Emotion Voice is synthesis tone, not detection.',
    },
    links: {
      console: '/emotion-intelligence',
      hub: '/speech',
      agents: '/voice',
      openapi: '/v1/openapi.json',
      docs: '/docs/EMOTION_INTELLIGENCE.md',
    },
    architecture: {
      rest: true,
      graphql: true,
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
