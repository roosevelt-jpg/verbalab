export type SpeechAnalyticsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type SpeechAnalyticsCapability = {
  id: string;
  name: string;
  status: SpeechAnalyticsCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 25 → Speech Analytics (VL-159). */
export function speechAnalyticsCatalog() {
  return {
    product: 'VerbaLab Speech Analytics',
    note:
      'Org speech usage, languages, dialects/accents, cost estimates, industry packs, customer keys, and accuracy proxies from audits/usage. Not a BI cloud or NIST WER lab. Language Analytics remains separate.',
    capabilities: [
      {
        id: 'speech-usage',
        name: 'Speech Usage',
        status: 'shipped',
        api: 'GET /v1/speech-analytics/usage',
        notes: 'STT/TTS usage_events + speech product audit counts.',
      },
      {
        id: 'recognition-accuracy',
        name: 'Recognition Accuracy',
        status: 'partial',
        api: 'GET /v1/speech-analytics/accuracy',
        notes: 'Whisper confidence + call QA / pronunciation proxies — not golden-set WER.',
      },
      {
        id: 'languages',
        name: 'Languages',
        status: 'shipped',
        api: 'GET /v1/speech-analytics/languages',
        notes: 'From speech.recognized / call_records language fields.',
      },
      {
        id: 'dialects',
        name: 'Dialects',
        status: 'shipped',
        api: 'GET /v1/speech-analytics/dialects',
        notes: 'Dialect/accent detect audits (Speech Cloud related).',
      },
      {
        id: 'latency',
        name: 'Latency',
        status: 'partial',
        api: 'GET /v1/speech-analytics/latency',
        notes: 'STT audio-duration aggregates — not full request p95 pipeline.',
      },
      {
        id: 'errors',
        name: 'Errors',
        status: 'partial',
        api: 'GET /v1/speech-analytics/errors',
        notes: 'Speech-related failed jobs + error audit actions when present.',
      },
      {
        id: 'cost',
        name: 'Cost',
        status: 'shipped',
        api: 'GET /v1/speech-analytics/costs',
        notes: 'Estimated STT/TTS USD — not Stripe invoices.',
      },
      {
        id: 'customers',
        name: 'Customers',
        status: 'partial',
        api: 'GET /v1/speech-analytics/customers',
        notes: 'API key prefixes with speech activity — not CRM customer 360.',
      },
      {
        id: 'industries',
        name: 'Industries',
        status: 'partial',
        api: 'GET /v1/speech-analytics/industries',
        notes: 'Industry vocabulary pack usage from STT audits.',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'shipped',
        api: 'GET /v1/speech-analytics/report',
        notes: 'Bundled speech analytics JSON report.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/speech-analytics/monitoring',
        notes: 'Snapshot + shared observability request IDs.',
      },
      {
        id: 'wer-lab',
        name: 'WER Evaluation Lab',
        status: 'deferred',
        api: null,
        notes: 'Golden-set WER / human eval harness deferred.',
      },
    ] satisfies SpeechAnalyticsCapability[],
    links: {
      console: '/speech-analytics',
      hub: '/speech',
      languageAnalytics: '/analytics',
      usage: '/usage',
      openapi: '/v1/openapi.json',
      docs: '/docs/SPEECH_ANALYTICS.md',
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

/** Audit action prefixes that count as Speech Cloud product activity. */
export const SPEECH_AUDIT_PREFIXES = [
  'speech.',
  'emotion.',
  'audio_intelligence.',
  'pronunciation.',
  'wake_word.',
  'call_intelligence.',
  'speaker.',
] as const;
