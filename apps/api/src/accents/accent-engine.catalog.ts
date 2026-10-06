export type AccentCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type AccentCapability = {
  id: string;
  name: string;
  status: AccentCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Accent Intelligence. Extends existing — not acoustic OS. */
export function accentEngineCatalog() {
  return {
    product: 'Lugemi Accent Intelligence',
    note:
      'Cue-based spoken accent detection/classification with confidence and analytics. Dialect detection is Language Cloud. Regional acoustic models are deferred.',
    capabilities: [
      {
        id: 'accent-detection',
        name: 'Accent Detection',
        status: 'shipped',
        api: 'POST /v1/accents/detect',
        notes: 'Text and/or audio→STT cue scoring. Not acoustic phonetics ID.',
      },
      {
        id: 'accent-classification',
        name: 'Accent Classification',
        status: 'shipped',
        api: 'POST /v1/accents/classify',
        notes: 'Ranked candidates + confidence band from the same cue engine.',
      },
      {
        id: 'accent-confidence',
        name: 'Accent Confidence',
        status: 'shipped',
        api: 'POST /v1/accents/detect',
        notes: 'Per-result confidence + candidate scores.',
      },
      {
        id: 'dialect-detection',
        name: 'Dialect Detection',
        status: 'shipped',
        api: 'POST /v1/dialects/detect',
        notes: 'Language Cloud — linked here, not reimplemented under Speech Cloud.',
      },
      {
        id: 'regional-models',
        name: 'Regional Accent Models',
        status: 'deferred',
        api: null,
        notes: 'Acoustic / phonetics regional models — buy path / later depth. Not claimed.',
      },
      {
        id: 'accent-analytics',
        name: 'Accent Analytics',
        status: 'shipped',
        api: 'GET /v1/accents/analytics',
        notes: 'Org audit-derived detect/classify counts (30-day window).',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs + accent.detect / accent.classify audit actions.',
      },
    ] satisfies AccentCapability[],
    engines: [
      {
        id: 'cue_scoring_v1',
        name: 'Lexical cue scoring (+ optional LLM assist)',
        role: 'primary',
        modes: ['detect', 'classify'],
      },
    ],
    regionalProfiles: {
      count: 'seeded',
      note: 'Curated African-priority spoken accent profiles (en/fr/ar/sw/ha/zu) — registry, not acoustic models.',
      console: '/accents',
    },
    links: {
      console: '/accent-intelligence',
      accents: '/accents',
      dialects: '/dialects',
      hub: '/speech',
      openapi: '/v1/openapi.json',
      docs: '/docs/ACCENT_INTELLIGENCE.md',
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

export function confidenceBand(confidence: number): 'high' | 'medium' | 'low' | 'none' {
  if (confidence <= 0) return 'none';
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.45) return 'medium';
  return 'low';
}
