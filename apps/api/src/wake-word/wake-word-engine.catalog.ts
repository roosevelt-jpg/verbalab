export type WakeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type WakeCapability = {
  id: string;
  name: string;
  status: WakeCapabilityStatus;
  api: string | null;
  notes: string;
};

export const DEFAULT_WAKE_PHRASES = ['hey lugemi', 'ok lugemi', 'lugemi'] as const;

/** Library Phase 23 → Wake Word & Keyword Intelligence (VL-157). */
export function wakeWordEngineCatalog() {
  return {
    product: 'Lugemi Wake Word Engine',
    note:
      'Transcript/text keyword spotting for wake words, custom keywords, and enterprise triggers. Not Picovoice Porcupine / Snowboy / on-device DNN.',
    defaultWakePhrases: [...DEFAULT_WAKE_PHRASES],
    capabilities: [
      {
        id: 'wake-word-detection',
        name: 'Wake Word Detection',
        status: 'shipped',
        api: 'POST /v1/wake-word/detect',
        notes: 'Match default + custom wake phrases in text or audio→STT.',
      },
      {
        id: 'keyword-spotting',
        name: 'Keyword Spotting',
        status: 'shipped',
        api: 'POST /v1/wake-word/spot',
        notes: 'Spot workspace/request keywords in transcript.',
      },
      {
        id: 'custom-keywords',
        name: 'Custom Keywords',
        status: 'shipped',
        api: '/v1/wake-word/keywords',
        notes: 'Workspace CRUD for wake_word | keyword | trigger phrases.',
      },
      {
        id: 'enterprise-triggers',
        name: 'Enterprise Triggers',
        status: 'partial',
        api: 'POST /v1/wake-word/triggers',
        notes: 'Trigger phrase hits + audit — not workflow orchestration engine.',
      },
      {
        id: 'streaming-detection',
        name: 'Streaming Detection',
        status: 'partial',
        api: 'POST /v1/wake-word/detect/stream',
        notes: 'SSE after STT/text — not continuous mic DNN stream.',
      },
      {
        id: 'offline-detection',
        name: 'Offline Detection',
        status: 'partial',
        api: 'POST /v1/wake-word/detect',
        notes: 'Batch file/text offline of a buffer — not on-device embedded model.',
      },
      {
        id: 'on-device-dnn',
        name: 'On-device Wake DNN',
        status: 'deferred',
        api: null,
        notes: 'Porcupine-class always-on models deferred.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs + wake_word.* audit actions.',
      },
    ] satisfies WakeCapability[],
    links: {
      console: '/wake-word',
      hub: '/speech',
      openapi: '/v1/openapi.json',
      docs: '/docs/WAKE_WORD.md',
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
