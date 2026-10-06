export type TtsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type TtsCapability = {
  id: string;
  name: string;
  status: TtsCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 28 → Lugemi Neural Text-to-Speech (VL-171). */
export function neuralTtsEngineCatalog() {
  return {
    product: 'Lugemi Neural TTS',
    note:
      'Neural TTS engine over OpenAI TTS + own rented voices + clone:{id}. Batch synthesize shipped; streaming is chunk SSE after full synthesis — not vendor low-latency token streaming. Not ElevenLabs/Polly/Azure Speech parity.',
    capabilities: [
      {
        id: 'batch-tts',
        name: 'Batch Text-to-Speech',
        status: 'shipped',
        api: 'POST /v1/tts/synthesize',
        notes: 'JSON text → audio bytes. Legacy: POST /v1/audio/speech.',
      },
      {
        id: 'streaming-tts',
        name: 'Streaming Text-to-Speech',
        status: 'partial',
        api: 'POST /v1/tts/stream',
        notes: 'SSE audio chunk delivery after full synthesis. Not true streaming TTS from the vendor.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'partial',
        api: 'POST /v1/tts/stream',
        notes: 'SSE realtime delivery of audio chunks. Bidirectional realtime sessions deferred.',
      },
      {
        id: 'natural-voices',
        name: 'Natural Voices',
        status: 'shipped',
        api: 'GET /v1/tts/voices',
        notes: 'OpenAI stock + own:* African voices. Clones appear when approved for workspace.',
      },
      {
        id: 'male-voices',
        name: 'Male Voices',
        status: 'shipped',
        api: 'GET /v1/tts/voices?gender=male',
        notes: 'echo, onyx, own:yo-tunde, own:en-kofi, …',
      },
      {
        id: 'female-voices',
        name: 'Female Voices',
        status: 'shipped',
        api: 'GET /v1/tts/voices?gender=female',
        notes: 'nova, shimmer, own:sw-aisha, own:am-hanna, …',
      },
      {
        id: 'children-voices',
        name: 'Children Voices',
        status: 'deferred',
        api: null,
        notes: 'No dedicated child voice catalog from current vendors. Do not fake.',
      },
      {
        id: 'multilingual',
        name: 'Multiple Languages',
        status: 'shipped',
        api: 'POST /v1/tts/synthesize',
        notes: 'language hint + multilingual providers; own:* covers sw/yo/am/en.',
      },
      {
        id: 'dialects',
        name: 'Multiple Dialects',
        status: 'partial',
        api: 'GET /v1/tts/voices',
        notes: 'Dialect tags on enriched catalog where known. Full dialect-native TTS deferred.',
      },
      {
        id: 'regional-accents',
        name: 'Regional Accents',
        status: 'partial',
        api: 'GET /v1/tts/voices',
        notes: 'Accent/region tags on own:* and selected stock voices. Acoustic accent control deferred.',
      },
      {
        id: 'personalities',
        name: 'Voice Personalities',
        status: 'partial',
        api: 'GET /v1/tts/voices',
        notes: 'Personality labels on catalog (warm, formal, …). Emotion synthesis is Phase 30.',
      },
      {
        id: 'enterprise-voices',
        name: 'Enterprise Voices',
        status: 'partial',
        api: '/v1/voice-clones',
        notes: 'Consent-gated clone:{id} voices (VL-064). Enterprise library productization continues in Phase 29.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs, gateway.synthesize logs, audit audio.synthesized / tts.synthesized.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'partial',
        api: 'GET /v1/tts/engine/analytics',
        notes: 'TTS usage summary. Dedicated Voice Analytics: Phase 35.',
      },
    ] satisfies TtsCapability[],
    engines: [
      {
        id: 'openai_tts',
        name: 'OpenAI TTS',
        role: 'primary',
        modes: ['batch', 'chunk_sse'],
      },
      {
        id: 'own_tts',
        name: 'Own TTS (rented)',
        role: 'secondary',
        modes: ['batch', 'chunk_sse'],
      },
      {
        id: 'elevenlabs_clone',
        name: 'ElevenLabs Instant Voice Cloning',
        role: 'clone',
        modes: ['batch', 'chunk_sse'],
      },
    ],
    links: {
      console: '/neural-tts',
      hub: '/voice-cloud',
      studio: '/audio',
      legacy: '/v1/audio/speech',
      openapi: '/v1/openapi.json',
      docs: '/docs/NEURAL_TTS.md',
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
