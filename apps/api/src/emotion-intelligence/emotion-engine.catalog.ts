export type EmotionCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EmotionCapability = {
  id: string;
  name: string;
  status: EmotionCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 20 → Emotion Intelligence (VL-154). */
export function emotionEngineCatalog() {
  return {
    product: 'VerbaLab Emotion Intelligence',
    note:
      'Speech Cloud emotion detect for happy/sad/angry/fear/neutral/stress/confidence/excitement/urgency via text cues (+ optional soft audio proxies). Not a commercial SER lab.',
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
    capabilities: [
      {
        id: 'detect',
        name: 'Emotion Detection',
        status: 'shipped',
        api: 'POST /v1/emotion/detect',
        notes: 'Text and/or audio→STT + cue scoring; optional soft energy/ZCR proxies.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'partial',
        api: 'POST /v1/emotion/stream',
        notes: 'SSE progress events. Not live continuous SER WebSocket.',
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
      note: 'Language Cloud text emotion (VL-144) remains separate; Speech Emotion Intelligence uses Speech Cloud labels.',
    },
    links: {
      console: '/emotion-intelligence',
      hub: '/speech',
      openapi: '/v1/openapi.json',
      docs: '/docs/EMOTION_INTELLIGENCE.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@verbalab/sdk',
      cli: '@verbalab/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    },
  };
}
