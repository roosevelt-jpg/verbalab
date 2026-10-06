export type AudioCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type AudioCapability = {
  id: string;
  name: string;
  status: AudioCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 21 → Audio Intelligence. */
export function audioEngineCatalog {
  return {
    product: 'Lugemi Audio Intelligence',
    note:
      'PCM heuristic noise/silence analysis, noise-gate enhancement, linear upsampling, and energy VAD isolation. Not Krisp/Adobe Enhance/Demucs parity.',
    capabilities: [
      {
        id: 'noise-detection',
        name: 'Noise Detection',
        status: 'shipped',
        api: 'POST /v1/audio-intelligence/analyze',
        notes: 'Noise floor + estimated SNR from energy heuristics.',
      },
      {
        id: 'silence-detection',
        name: 'Silence Detection',
        status: 'shipped',
        api: 'POST /v1/audio-intelligence/silence',
        notes: 'Silence regions via frame energy thresholding.',
      },
      {
        id: 'noise-removal',
        name: 'Noise Removal',
        status: 'partial',
        api: 'POST /v1/audio-intelligence/enhance',
        notes: 'Noise gate + mild high-pass + normalize — not spectral subtraction ML.',
      },
      {
        id: 'audio-enhancement',
        name: 'Audio Enhancement',
        status: 'partial',
        api: 'POST /v1/audio-intelligence/enhance',
        notes: 'Same enhance pipeline as noise removal.',
      },
      {
        id: 'audio-upscaling',
        name: 'Audio Upscaling',
        status: 'partial',
        api: 'POST /v1/audio-intelligence/upscale',
        notes: 'Linear sample-rate interpolation — not generative bandwidth extension.',
      },
      {
        id: 'voice-isolation',
        name: 'Voice Isolation',
        status: 'partial',
        api: 'POST /v1/audio-intelligence/isolate',
        notes: 'Energy VAD attenuation of low-energy frames.',
      },
      {
        id: 'background-separation',
        name: 'Background Separation',
        status: 'partial',
        api: 'POST /v1/audio-intelligence/isolate',
        notes: 'Same VAD isolation — not multi-source stem separation.',
      },
      {
        id: 'echo-cancellation',
        name: 'Echo Cancellation',
        status: 'deferred',
        api: null,
        notes: 'Requires AEC reference signal / vendor — not claimed.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'partial',
        api: 'POST /v1/audio-intelligence/analyze/stream',
        notes: 'SSE analysis progress — not live AEC stream.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs + audio_intelligence.* audit actions.',
      },
    ] satisfies AudioCapability[],
    links: {
      console: '/audio-intelligence',
      hub: '/speech',
      openapi: '/v1/openapi.json',
      docs: '/docs/AUDIO_INTELLIGENCE.md',
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
