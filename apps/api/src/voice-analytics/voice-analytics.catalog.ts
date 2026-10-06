export type VoiceAnalyticsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type VoiceAnalyticsCapability = {
  id: string;
  name: string;
  status: VoiceAnalyticsCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 35 → Voice Analytics (VL-178). Distinct from Speech Analytics (VL-159). */
export function voiceAnalyticsCatalog() {
  return {
    product: 'VerbaLab Voice Analytics',
    note:
      'Org voice usage, voices, clones, marketplace revenue, latency/quality proxies from usage_events + voice audits. Not a BI cloud. Does not regenerate Speech Analytics (/speech-analytics).',
    capabilities: [
      {
        id: 'voice-usage',
        name: 'Voice Usage',
        status: 'shipped',
        api: 'GET /v1/voice-analytics/usage',
        notes: 'TTS usage_events + Voice Cloud audit counts.',
      },
      {
        id: 'languages',
        name: 'Languages',
        status: 'shipped',
        api: 'GET /v1/voice-analytics/languages',
        notes: 'Language tags from TTS / emotion-voice audits + voice id prefixes.',
      },
      {
        id: 'voices',
        name: 'Voices',
        status: 'shipped',
        api: 'GET /v1/voice-analytics/voices',
        notes: 'Voice id frequency + clone inventory.',
      },
      {
        id: 'customers',
        name: 'Customers',
        status: 'partial',
        api: 'GET /v1/voice-analytics/customers',
        notes: 'API key prefixes with voice activity — not CRM 360.',
      },
      {
        id: 'revenue',
        name: 'Revenue',
        status: 'shipped',
        api: 'GET /v1/voice-analytics/revenue',
        notes: 'Voice Marketplace sale amounts (publisher side).',
      },
      {
        id: 'latency',
        name: 'Latency',
        status: 'partial',
        api: 'GET /v1/voice-analytics/latency',
        notes: 'latencyMs/durationMs from audits when present — not full HTTP p95.',
      },
      {
        id: 'quality',
        name: 'Quality',
        status: 'partial',
        api: 'GET /v1/voice-analytics/quality',
        notes: 'Watermark rate, marketplace ratings, biometric confidence proxies.',
      },
      {
        id: 'streaming',
        name: 'Streaming',
        status: 'partial',
        api: 'GET /v1/voice-analytics/streaming',
        notes: 'tts.streamed / emotion_voice.streamed counts — chunk SSE not vendor token stream.',
      },
      {
        id: 'downloads',
        name: 'Downloads',
        status: 'partial',
        api: 'GET /v1/voice-analytics/downloads',
        notes: 'Synthesized audio bytes/deliveries as download proxy.',
      },
      {
        id: 'marketplace',
        name: 'Marketplace',
        status: 'shipped',
        api: 'GET /v1/voice-analytics/marketplace',
        notes: 'Listing/install/review/sale aggregates (VL-177).',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'shipped',
        api: 'GET /v1/voice-analytics/report',
        notes: 'Bundled Voice Analytics JSON report.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/voice-analytics/monitoring',
        notes: 'Snapshot + shared observability request IDs.',
      },
      {
        id: 'bi-dashboard',
        name: 'BI Dashboard Product',
        status: 'deferred',
        api: null,
        notes: 'Looker/Amplitude-grade voice BI product deferred.',
      },
    ] satisfies VoiceAnalyticsCapability[],
    honesty: {
      regeneratesSpeechAnalytics: false,
      biDashboardProduct: false,
      fullHttpLatencyP95: false,
    },
    links: {
      console: '/voice-analytics',
      hub: '/voice-cloud',
      speechAnalytics: '/speech-analytics',
      marketplace: '/voice-marketplace',
      usage: '/usage',
      openapi: '/v1/openapi.json',
      docs: '/docs/VOICE_ANALYTICS.md',
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

/** Audit action prefixes that count as Voice Cloud product activity. */
export const VOICE_AUDIT_PREFIXES = [
  'tts.',
  'voice_clone.',
  'emotion_voice.',
  'voice_studio.',
  'voice_enhancement.',
  'voice_biometrics.',
  'voice_marketplace.',
] as const;
