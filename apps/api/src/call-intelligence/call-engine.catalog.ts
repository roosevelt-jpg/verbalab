export type CallCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type CallCapability = {
  id: string;
  name: string;
  status: CallCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Call Intelligence. */
export function callIntelligenceEngineCatalog() {
  return {
    product: 'Lugemi Call Intelligence',
    note:
      'Contact-center call ingest, STT transcription, heuristic summaries/topics/intent/sentiment/emotion/compliance/coaching/QA. Not Gong/Chorus/Twilio Voice Intelligence. Voice FAQ is separate.',
    capabilities: [
      {
        id: 'call-recording',
        name: 'Call Recording',
        status: 'shipped',
        api: 'POST /v1/call-intelligence/calls',
        notes: 'Upload/store recording metadata locally — not a full CCaaS recorder.',
      },
      {
        id: 'call-transcription',
        name: 'Call Transcription',
        status: 'shipped',
        api: 'POST /v1/call-intelligence/calls',
        notes: 'Whisper STT on uploaded audio or provided transcript text.',
      },
      {
        id: 'call-summaries',
        name: 'Call Summaries',
        status: 'shipped',
        api: 'POST /v1/call-intelligence/calls/:id/analyze',
        notes: 'Extractive summary heuristics — not LLM meeting notes OS.',
      },
      {
        id: 'topic-detection',
        name: 'Topic Detection',
        status: 'shipped',
        api: 'analyze',
        notes: 'Keyword topic packs (billing, support, sales, …).',
      },
      {
        id: 'intent-detection',
        name: 'Intent Detection',
        status: 'shipped',
        api: 'analyze',
        notes: 'Reuses Language Intelligence intent heuristics.',
      },
      {
        id: 'sentiment',
        name: 'Sentiment',
        status: 'shipped',
        api: 'analyze',
        notes: 'Reuses Language Intelligence sentiment heuristics.',
      },
      {
        id: 'emotion',
        name: 'Emotion',
        status: 'shipped',
        api: 'analyze',
        notes: 'Speech emotion cue labels ( signals) — not SER lab.',
      },
      {
        id: 'compliance-detection',
        name: 'Compliance Detection',
        status: 'shipped',
        api: 'analyze',
        notes: 'PCI/PII/profanity keyword heuristics — not legal certification.',
      },
      {
        id: 'sales-coaching',
        name: 'Sales Coaching',
        status: 'shipped',
        api: 'analyze',
        notes: 'Rubric tips from talk patterns — not Gong coaching AI.',
      },
      {
        id: 'quality-assurance',
        name: 'Quality Assurance',
        status: 'shipped',
        api: 'analyze',
        notes: 'Heuristic QA scorecard — not human QA workforce OS.',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'shipped',
        api: 'GET /v1/call-intelligence/report',
        notes: 'Org call volume/sentiment/compliance aggregates.',
      },
      {
        id: 'realtime-ccaas',
        name: 'Realtime CCaaS Streaming',
        status: 'deferred',
        api: null,
        notes: 'Live agent-assist WebSocket / dialer integration deferred.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs + call_intelligence.* audit actions.',
      },
    ] satisfies CallCapability[],
    links: {
      console: '/call-intelligence',
      hub: '/speech',
      voiceFaq: '/voice',
      openapi: '/v1/openapi.json',
      docs: '/docs/CALL_INTELLIGENCE.md',
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
