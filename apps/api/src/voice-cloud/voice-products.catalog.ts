export type VoiceProductStatus = 'shipped' | 'partial' | 'deferred';

export type VoiceProductRow = {
  id: string;
  name: string;
  status: VoiceProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 27 product map (VL-170). Hub only — does not reimplement TTS/clones. */
export function voiceProductCatalog(): VoiceProductRow[] {
  return [
    {
      id: 'voice',
      name: 'Lugemi Voice',
      status: 'shipped',
      api: 'GET /v1/voice-cloud/products',
      console: '/voice-cloud',
      notes:
        'Voice Cloud parent hub (VL-170). Maps library Voice Cloud products onto existing TTS, clones, and studio surfaces.',
    },
    {
      id: 'neural-tts',
      name: 'Neural Text-to-Speech',
      status: 'shipped',
      api: 'GET /v1/tts/engine',
      console: '/neural-tts',
      notes:
        'Neural TTS engine (VL-171): batch synthesize + chunk SSE stream over OpenAI/own/clone voices. Legacy: POST /v1/audio/speech.',
    },
    {
      id: 'natural-voices',
      name: 'Natural Voices',
      status: 'shipped',
      api: 'GET /v1/tts/voices',
      console: '/neural-tts',
      notes:
        'Enriched catalog with gender/personality/dialect tags (VL-171). Children voices deferred. Legacy: GET /v1/audio/voices.',
    },
    {
      id: 'voice-cloning',
      name: 'Voice Cloning Platform',
      status: 'shipped',
      api: 'GET /v1/voice-cloning/engine',
      console: '/voice-cloning',
      notes:
        'Enterprise cloning hub (VL-172): consent, ownership, licensing, permissions, enrollment verify + watermark (extends VL-064).',
    },
    {
      id: 'instant-voice-cloning',
      name: 'Instant Voice Cloning',
      status: 'shipped',
      api: 'POST /v1/voice-cloning/enroll',
      console: '/voice-cloning',
      notes: 'Consent-gated instant enrollment (VL-064/172). Speak via clone:{id}.',
    },
    {
      id: 'voice-studio',
      name: 'Professional Voice Studio',
      status: 'shipped',
      api: 'GET /v1/voice-studio/engine',
      console: '/voice-studio',
      notes:
        'Voice Studio hub (VL-174): library, SSML lite, pronunciation lexicon, linear timeline, compare/test + VL-120 `/audio` African UX. Not a nonlinear DAW.',
    },
    {
      id: 'emotion-voice',
      name: 'Emotion Voice',
      status: 'partial',
      api: 'GET /v1/emotion-voice/engine',
      console: '/emotion-voice',
      notes:
        'Emotion/domain synthesis profiles (VL-173): soft prosody + voice pick; clone style settings partial. Not trained expressive TTS. Distinct from VL-154 detection.',
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
        'Voice Enhancement Platform (VL-175): profile pipelines over VL-155 PCM heuristics (mic/podcast/meeting/broadcast/restore). Not Krisp/Adobe Enhance.',
    },
    {
      id: 'voice-restoration',
      name: 'Voice Restoration',
      status: 'partial',
      api: 'POST /v1/voice-enhancement/enhance',
      console: '/voice-enhancement',
      notes: 'Heuristic voice_restoration profile (VL-175). Archival ML bandwidth extension still deferred.',
    },
    {
      id: 'audio-mastering',
      name: 'Audio Mastering',
      status: 'partial',
      api: 'POST /v1/voice-enhancement/enhance',
      console: '/voice-enhancement',
      notes: 'Broadcast soft-limit profile only (VL-175). LUFS broadcast mastering suite deferred.',
    },
    {
      id: 'voice-biometrics',
      name: 'Voice Biometrics',
      status: 'partial',
      api: 'GET /v1/voice-biometrics/engine',
      console: '/voice-biometrics',
      notes:
        'Voice Biometrics (VL-176): encrypted templates, deletion, heuristic anti-spoof/liveness/risk over VL-152. Not NIST/PAD certified.',
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
      notes: 'Speaker profiles (VL-152) used as biometric subjects. Marketable voice SKU profiles ≠ this.',
    },
    {
      id: 'voice-marketplace',
      name: 'Voice Marketplace',
      status: 'partial',
      api: 'GET /v1/voice-marketplace/engine',
      console: '/voice-marketplace',
      notes:
        'Voice SKU publish/license/ratings (VL-177). Distinct from localization /marketplace. Celebrity without rights forbidden; cross-tenant clone synthesis deferred.',
    },
    {
      id: 'voice-analytics',
      name: 'Voice Analytics',
      status: 'partial',
      api: 'GET /v1/voice-analytics/engine',
      console: '/voice-analytics',
      notes:
        'Usage/voices/revenue/latency/quality aggregates (VL-178). Distinct from Speech Analytics; BI dashboard deferred.',
    },
    {
      id: 'voice-faq',
      name: 'Voice agents (FAQ)',
      status: 'partial',
      api: '/v1/voice',
      console: '/voice',
      notes: 'Twilio FAQ voice agent (VL-084). Not Voice Cloud core synthesis — listed for navigation honesty.',
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
