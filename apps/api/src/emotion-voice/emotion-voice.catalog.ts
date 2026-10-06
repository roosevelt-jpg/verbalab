import { EMOTION_VOICE_PROFILES } from './emotion-profiles';

export type EmotionVoiceCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EmotionVoiceCapability = {
  id: string;
  name: string;
  status: EmotionVoiceCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 30 → Emotion Voice Engine. */
export function emotionVoiceEngineCatalog {
  return {
    product: 'Lugemi Emotion Voice',
    note:
      'Emotion-conditioned synthesis façade over Neural TTS. Soft prosody + voice recommendations for OpenAI/own voices; partial clone provider style settings on clone:{id}. Not trained expressive TTS / Hume / Azure Neural Emotion. Distinct from Speech Emotion Intelligence detection.',
    capabilities: [
      {
        id: 'emotion-profiles',
        name: 'Emotion & domain profiles',
        status: 'shipped',
        api: 'GET /v1/emotion-voice/profiles',
        notes: `${EMOTION_VOICE_PROFILES.length} profiles: emotions + medical/legal/sales/support domains.`,
      },
      {
        id: 'emotion-synthesis',
        name: 'Emotion Voice Synthesis',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes:
          'Applies soft prosody + preferred voice; clone voices may pass clone provider style settings. Not native emotion-conditioned models for OpenAI stock.',
      },
      {
        id: 'streaming',
        name: 'Streaming Emotion Synthesis',
        status: 'partial',
        api: 'POST /v1/emotion-voice/stream',
        notes: 'Chunk SSE after synthesis (same honesty as ).',
      },
      {
        id: 'happy',
        name: 'Happy',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile happy',
      },
      {
        id: 'sad',
        name: 'Sad',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile sad',
      },
      {
        id: 'angry',
        name: 'Angry',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile angry',
      },
      {
        id: 'fear',
        name: 'Fear',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile fear',
      },
      {
        id: 'excited',
        name: 'Excited',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile excited',
      },
      {
        id: 'professional',
        name: 'Professional',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain tone',
      },
      {
        id: 'calm',
        name: 'Calm',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile calm',
      },
      {
        id: 'urgent',
        name: 'Urgent',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile urgent',
      },
      {
        id: 'empathetic',
        name: 'Empathetic',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Profile empathetic',
      },
      {
        id: 'medical',
        name: 'Medical',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain register — not medical advice',
      },
      {
        id: 'legal',
        name: 'Legal',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain register',
      },
      {
        id: 'sales',
        name: 'Sales',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain register',
      },
      {
        id: 'customer-support',
        name: 'Customer Support',
        status: 'partial',
        api: 'POST /v1/emotion-voice/synthesize',
        notes: 'Domain register',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Audit emotion_voice.synthesized / streamed',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'partial',
        api: 'GET /v1/emotion-voice/engine/analytics',
        notes: 'Usage by profile from audit events when available; TTS metering shared.',
      },
    ] satisfies EmotionVoiceCapability[],
    related: {
      speechEmotionDetection: '/docs/EMOTION_INTELLIGENCE.md',
      neuralTts: '/docs/NEURAL_TTS.md',
      note: ' detects emotion in speech/text. synthesizes with emotion profiles.',
    },
    links: {
      console: '/emotion-voice',
      hub: '/voice-cloud',
      neuralTts: '/neural-tts',
      speechEmotion: '/emotion-intelligence',
      openapi: '/v1/openapi.json',
      docs: '/docs/EMOTION_VOICE.md',
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
      trainedExpressiveModel: false,
    },
  };
}
