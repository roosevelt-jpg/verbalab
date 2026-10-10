export type EnhancementCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EnhancementCapability = {
  id: string;
  name: string;
  status: EnhancementCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Voice Enhancement Platform. Extends existing. */
export function voiceEnhancementEngineCatalog() {
  return {
    product: 'Lugemi Voice Enhancement',
    note:
      'Voice cleanup/restoration/mastering façade over Audio Intelligence PCM heuristics. Profile pipelines for mic/podcast/meeting/broadcast. Not third-party noise-cancellation, enhance, stem-separation, or live AEC parity.',
    capabilities: [
      {
        id: 'noise-removal',
        name: 'Noise Removal',
        status: 'shipped',
        api: 'POST /v1/voice-enhancement/enhance',
        notes: 'Profile noise_removal — gate + HPF + normalize. Not spectral ML.',
      },
      {
        id: 'echo-cancellation',
        name: 'Echo Cancellation',
        status: 'deferred',
        api: 'GET /v1/voice-enhancement/echo',
        notes: 'Requires AEC reference / vendor SDK. Still deferred (same as Audio Intelligence).',
      },
      {
        id: 'audio-upscaling',
        name: 'Audio Upscaling',
        status: 'shipped',
        api: 'POST /v1/voice-enhancement/upscale',
        notes: 'Linear resample — not generative bandwidth extension.',
      },
      {
        id: 'voice-restoration',
        name: 'Voice Restoration',
        status: 'shipped',
        api: 'POST /v1/voice-enhancement/enhance?profile=voice_restoration',
        notes: 'Aggressive heuristic restore profile — not archival ML restoration.',
      },
      {
        id: 'microphone-cleanup',
        name: 'Microphone Cleanup',
        status: 'shipped',
        api: 'POST /v1/voice-enhancement/enhance?profile=microphone_cleanup',
        notes: 'Stronger gate + rumble cut preset.',
      },
      {
        id: 'podcast-cleanup',
        name: 'Podcast Cleanup',
        status: 'shipped',
        api: 'POST /v1/voice-enhancement/enhance?profile=podcast_cleanup',
        notes: 'Gentle enhance + isolate + upsample chain.',
      },
      {
        id: 'broadcast-audio',
        name: 'Broadcast Audio',
        status: 'shipped',
        api: 'POST /v1/voice-enhancement/enhance?profile=broadcast',
        notes: 'Enhance + soft limit. Not LUFS broadcast mastering suite.',
      },
      {
        id: 'meeting-cleanup',
        name: 'Meeting Cleanup',
        status: 'shipped',
        api: 'POST /v1/voice-enhancement/enhance?profile=meeting_cleanup',
        notes: 'Enhance + energy VAD isolation for calls.',
      },
      {
        id: 'enhancement-engine',
        name: 'Enhancement Engine',
        status: 'shipped',
        api: 'GET /v1/voice-enhancement/engine',
        notes: 'Catalog + profiles over existing DSP.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'shipped',
        api: 'POST /v1/voice-enhancement/enhance/stream',
        notes: 'SSE progress after full-buffer processing — not live AEC stream.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/voice-enhancement/engine/analytics',
        notes: 'Audit voice_enhancement.* + shared observability.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/voice-enhancement/engine/analytics',
        notes: 'Profile usage counts. Full Voice Analytics lives in the Voice Analytics hub.',
      },
    ] satisfies EnhancementCapability[],
    honesty: {
      spectralMlDenoise: false,
      adobeEnhanceParity: false,
      krispParity: false,
      demucsStemSeparation: false,
      liveAec: false,
      lufsMastering: false,
      extendsVl155: true,
    },
    links: {
      console: '/voice-enhancement',
      legacyAudioIntel: '/audio-intelligence',
      hub: '/voice-cloud',
      openapi: '/v1/openapi.json',
      docs: '/docs/VOICE_ENHANCEMENT.md',
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
      spectralMlDenoise: false,
      liveAec: false,
    },
  };
}
