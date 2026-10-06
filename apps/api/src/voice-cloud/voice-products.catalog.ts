export type VoiceProductStatus = 'shipped' | 'partial' | 'deferred';

export type VoiceProductRow = {
  id: string;
  name: string;
  status: VoiceProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Product map. Hub only — does not reimplement TTS/clones. */
export function voiceProductCatalog(): VoiceProductRow[] {
  return [
    {
      id: 'voice',
      name: 'Lugemi Voice',
      status: 'shipped',
      api: 'GET /v1/voice-cloud/products',
      console: '/voice-cloud',
      notes:
        'Voice Cloud parent hub. Maps library Voice Cloud products onto existing TTS, clones, and studio surfaces.',
    },
    {
      id: 'neural-tts',
      name: 'Neural Text-to-Speech',
      status: 'shipped',
      api: 'GET /v1/tts/engine',
      console: '/neural-tts',
      notes:
        'Neural TTS engine: batch synthesize + chunk SSE stream over OpenAI/own/clone voices. Legacy: POST /v1/audio/speech.',
    },
    {
      id: 'natural-voices',
      name: 'Natural Voices',
      status: 'shipped',
      api: 'GET /v1/tts/voices',
      console: '/neural-tts',
      notes:
        'Enriched catalog with gender/personality/dialect tags. Children voices deferred. Legacy: GET /v1/audio/voices.',
    },
    {
      id: 'voice-cloning',
      name: 'Voice Cloning Platform',
      status: 'shipped',
      api: 'GET /v1/voice-cloning/engine',
      console: '/voice-cloning',
      notes:
        'Enterprise cloning hub: consent, ownership, licensing, permissions, enrollment verify + watermark (extends existing).',
    },
    {
      id: 'instant-voice-cloning',
      name: 'Instant Voice Cloning',
      status: 'shipped',
      api: 'POST /v1/voice-cloning/enroll',
      console: '/voice-cloning',
      notes: 'Consent-gated instant enrollment. Speak via clone:{id}.',
    },
    {
      id: 'voice-studio',
      name: 'Professional Voice Studio',
      status: 'shipped',
      api: 'GET /v1/voice-studio/engine',
      console: '/voice-studio',
      notes:
        'Voice Studio hub: library, SSML lite, pronunciation lexicon, linear timeline, compare/test + `/audio` African UX. Not a nonlinear DAW.',
    },
    {
      id: 'emotion-voice',
      name: 'Emotion Voice',
      status: 'partial',
      api: 'GET /v1/emotion-voice/engine',
      console: '/emotion-voice',
      notes:
        'Emotion/domain synthesis profiles: soft prosody + voice pick; clone style settings partial. Not trained expressive TTS. Distinct from detection.',
    },
    {
      id: 'voice-conversion',
      name: 'Voice Conversion',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Timbre/style conversion between speakers deferred. Not shipped as a product surface.',
    },
    {
      id: 'voice-enhancement',
      name: 'Voice Enhancement',
      status: 'partial',
      api: 'GET /v1/voice-enhancement/engine',
      console: '/voice-enhancement',
      notes:
        'Voice Enhancement Platform: profile pipelines over existing PCM heuristics (mic/podcast/meeting/broadcast/restore). Not third-party noise-cancellation/enhance OS.',
    },
    {
      id: 'voice-restoration',
      name: 'Voice Restoration',
      status: 'partial',
      api: 'POST /v1/voice-enhancement/enhance',
      console: '/voice-enhancement',
      notes: 'Heuristic voice_restoration profile. Archival ML bandwidth extension still deferred.',
    },
    {
      id: 'audio-mastering',
      name: 'Audio Mastering',
      status: 'partial',
      api: 'POST /v1/voice-enhancement/enhance',
      console: '/voice-enhancement',
      notes: 'Broadcast soft-limit profile only. LUFS broadcast mastering suite deferred.',
    },
    {
      id: 'voice-biometrics',
      name: 'Voice Biometrics',
      status: 'partial',
      api: 'GET /v1/voice-biometrics/engine',
      console: '/voice-biometrics',
      notes:
        'Voice Biometrics: encrypted templates, deletion, heuristic anti-spoof/liveness/risk over existing. Not NIST/PAD certified.',
    },
    {
      id: 'voice-authentication',
      name: 'Voice Authentication',
      status: 'partial',
      api: 'POST /v1/voice-biometrics/authenticate',
      console: '/voice-biometrics',
      notes: 'Composite auth decision (verify + spoof + risk). Not certified MFA alone.',
    },
    {
      id: 'voice-profiles',
      name: 'Voice Profiles',
      status: 'partial',
      api: 'GET /v1/speakers/profiles',
      console: '/speaker-intelligence',
      notes: 'Speaker profiles used as biometric subjects. Marketable voice SKU profiles ≠ this.',
    },
    {
      id: 'voice-marketplace',
      name: 'Voice Marketplace',
      status: 'partial',
      api: 'GET /v1/voice-marketplace/engine',
      console: '/voice-marketplace',
      notes:
        'Voice SKU publish/license/ratings. Distinct from localization /marketplace. Celebrity without rights forbidden; cross-tenant clone synthesis deferred.',
    },
    {
      id: 'voice-analytics',
      name: 'Voice Analytics',
      status: 'partial',
      api: 'GET /v1/voice-analytics/engine',
      console: '/voice-analytics',
      notes:
        'Usage/voices/revenue/latency/quality aggregates. Distinct from Speech Analytics; BI dashboard deferred.',
    },
    {
      id: 'voice-faq',
      name: 'Voice agents (FAQ)',
      status: 'partial',
      api: '/v1/voice',
      console: '/voice',
      notes: 'Twilio FAQ voice agent. Not Voice Cloud core synthesis — listed for navigation honesty.',
    },
  ];
}

export function voiceArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_voice_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    rest: true,
    graphql: true,
    realtime: true,
    streaming: true,
    batch: true,
    enterpriseApis: true,
    sdk: '@lugemi/sdk',
    cli: '@lugemi/cli',
    openapi: '/v1/openapi.json',
    monitoring: true,
    billing: true,
    analytics: 'tts_usage_summary_only',
    infra: ['docker', 'fly', 'github_actions', 'terraform', 'eks'],
    terraform: true,
    kubernetes: true,
    docker: true,
    cloudProvider: 'aws',
    primaryRegion: 'af-south-1',
    consentAndAudit: true,
    watermarkOnClones: true,
  };
}
