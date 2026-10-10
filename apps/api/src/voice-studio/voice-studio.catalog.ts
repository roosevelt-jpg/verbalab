export type StudioCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type StudioCapability = {
  id: string;
  name: string;
  status: StudioCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Voice Studio. Extends existing `/audio` — not a DAW. */
export function voiceStudioEngineCatalog() {
  return {
    product: 'Lugemi Voice Studio',
    note:
      'Professional Voice Studio hub over Neural TTS, clones, and African studio UX. Linear timeline + SSML lite + pronunciation lexicon + voice comparison — not a nonlinear DAW / NLE / overdub parity product.',
    capabilities: [
      {
        id: 'voice-library',
        name: 'Voice Library',
        status: 'shipped',
        api: 'GET /v1/voice-studio/library',
        notes: 'Stock + own + workspace clones via Neural TTS catalog.',
      },
      {
        id: 'voice-editing',
        name: 'Voice Editing',
        status: 'shipped',
        api: 'POST /v1/voice-studio/profiles',
        notes: 'Saved voice profiles (voice/language/notes). Waveform/timbre editing deferred.',
      },
      {
        id: 'pronunciation-editor',
        name: 'Pronunciation Editor',
        status: 'shipped',
        api: 'GET|POST /v1/voice-studio/pronunciation',
        notes: 'Workspace grapheme→alias lexicon before TTS. Distinct from assess/coach.',
      },
      {
        id: 'voice-profiles',
        name: 'Voice Profiles',
        status: 'shipped',
        api: 'GET /v1/voice-studio/profiles',
        notes: 'Studio presets (not speaker biometric profiles).',
      },
      {
        id: 'projects',
        name: 'Projects',
        status: 'shipped',
        api: 'GET|POST /v1/voice-studio/projects',
        notes: 'Named projects with linear timeline JSON.',
      },
      {
        id: 'audio-preview',
        name: 'Audio Preview',
        status: 'shipped',
        api: 'POST /v1/voice-studio/preview',
        notes: 'Single-clip preview with lexicon + optional SSML lite.',
      },
      {
        id: 'timeline-editing',
        name: 'Timeline Editing',
        status: 'shipped',
        api: 'POST /v1/voice-studio/timeline/render',
        notes: 'Ordered speak/pause segments only. Not nonlinear NLE / multi-track DAW.',
      },
      {
        id: 'ssml-editor',
        name: 'SSML Editor',
        status: 'shipped',
        api: 'POST /v1/voice-studio/ssml/compile',
        notes: 'SSML lite (break/prosody/phoneme/say-as) → plain plan. Vendors do not get SSML markup.',
      },
      {
        id: 'voice-comparison',
        name: 'Voice Comparison',
        status: 'shipped',
        api: 'POST /v1/voice-studio/compare',
        notes: 'Same text rendered with multiple voices (base64 clips).',
      },
      {
        id: 'voice-testing',
        name: 'Voice Testing',
        status: 'shipped',
        api: 'POST /v1/voice-studio/test',
        notes: 'Quick smoke synthesize for a voice id.',
      },
      {
        id: 'generate',
        name: 'Generate',
        status: 'shipped',
        api: 'POST /v1/voice-studio/generate',
        notes: 'Production generate path (lexicon + SSML lite + TTS).',
      },
      {
        id: 'professional-dashboard',
        name: 'Professional Dashboard',
        status: 'shipped',
        api: null,
        notes: 'Console /voice-studio (+ legacy African studio /audio).',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/voice-studio/engine/analytics',
        notes: 'Audit voice_studio.* + shared TTS metering.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/voice-studio/engine/analytics',
        notes: 'Studio action counts. Full Voice Analytics lives in the Voice Analytics hub.',
      },
    ] satisfies StudioCapability[],
    honesty: {
      nonlinearDaw: false,
      vendorSsmlPassthrough: false,
      waveformEditing: false,
      extendsVl120AudioStudio: true,
    },
    links: {
      console: '/voice-studio',
      legacyStudio: '/audio',
      hub: '/voice-cloud',
      neuralTts: '/neural-tts',
      emotionVoice: '/emotion-voice',
      pronunciationIntelligence: '/pronunciation-intelligence',
      openapi: '/v1/openapi.json',
      docs: '/docs/VOICE_STUDIO.md',
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
      nonlinearDaw: false,
    },
  };
}
