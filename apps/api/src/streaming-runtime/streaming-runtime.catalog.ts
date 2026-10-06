export type StreamingCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type StreamingCapability = {
  id: string;
  name: string;
  status: StreamingCapabilityStatus;
  api: string | null;
  notes: string;
};

export type StreamKind =
  | 'speech'
  | 'voice'
  | 'translation'
  | 'llm'
  | 'video'
  | 'realtime';

export type StreamSurface = {
  id: string;
  kind: StreamKind;
  name: string;
  status: StreamingCapabilityStatus;
  transport: 'sse' | 'websocket' | 'grpc' | 'none';
  api: string | null;
  existing: boolean;
  notes: string;
};

/** Existing + hub stream surfaces. */
export function streamingSurfaces: StreamSurface[] {
  return [
    {
      id: 'speech-sse',
      kind: 'speech',
      name: 'Speech Streaming',
      status: 'partial',
      transport: 'sse',
      api: 'POST /v1/speech/stream',
      existing: true,
      notes: 'Existing speech recognition SSE segments — not regenerated.',
    },
    {
      id: 'voice-tts-sse',
      kind: 'voice',
      name: 'Voice Streaming',
      status: 'partial',
      transport: 'sse',
      api: 'POST /v1/tts/stream',
      existing: true,
      notes: 'Neural TTS chunk SSE after synthesis — not regenerated.',
    },
    {
      id: 'translation-sse',
      kind: 'translation',
      name: 'Translation Streaming',
      status: 'partial',
      transport: 'sse',
      api: 'POST /v1/translate/stream',
      existing: true,
      notes: 'Existing translate SSE — not regenerated.',
    },
    {
      id: 'llm-chunk-sse',
      kind: 'llm',
      name: 'LLM Streaming',
      status: 'partial',
      transport: 'sse',
      api: 'POST /v1/streaming-runtime/stream',
      existing: false,
      notes: 'Sandbox token-chunk SSE via Streaming Runtime hub. Full OpenAI token stream OS deferred.',
    },
    {
      id: 'video-stream',
      kind: 'video',
      name: 'Video Streaming',
      status: 'deferred',
      transport: 'none',
      api: null,
      existing: false,
      notes: 'Video inference streaming OS deferred.',
    },
    {
      id: 'realtime-apis',
      kind: 'realtime',
      name: 'Realtime APIs',
      status: 'partial',
      transport: 'sse',
      api: 'GET /v1/streaming-runtime/surfaces',
      existing: true,
      notes: 'Catalog of SSE realtime-ish surfaces — not bidirectional realtime OS.',
    },
  ];
}

export function streamingTransports {
  return [
    {
      id: 'sse',
      name: 'SSE',
      status: 'shipped' as const,
      notes: 'Primary transport for Streaming Runtime + existing product streams.',
    },
    {
      id: 'websockets',
      name: 'WebSockets',
      status: 'deferred' as const,
      notes: 'Bidirectional WebSocket runtime OS deferred.',
    },
    {
      id: 'grpc',
      name: 'gRPC',
      status: 'deferred' as const,
      notes: 'gRPC streaming mesh deferred (same honesty as Knowledge APIs).',
    },
  ];
}

/**
 * Library Phase 75 → Streaming Runtime.
 * Hub over existing SSE + sandbox chunk stream — not a WebSocket/gRPC/video OS.
 */
export function streamingRuntimeCatalog {
  return {
    product: 'Lugemi Streaming Runtime',
    note:
      'Streaming Runtime. Catalogs speech/voice/translation SSE already shipped in product clouds, plus a sandbox LLM/token chunk SSE on this hub. Primary transport is SSE. WebSockets, gRPC, and video streaming OS deferred. Does not regenerate translate/speech/TTS streams.',
    capabilities: [
      {
        id: 'speech-streaming',
        name: 'Speech Streaming',
        status: 'partial',
        api: 'POST /v1/speech/stream',
        notes: 'Links existing speech SSE.',
      },
      {
        id: 'voice-streaming',
        name: 'Voice Streaming',
        status: 'partial',
        api: 'POST /v1/tts/stream',
        notes: 'Links existing neural TTS SSE.',
      },
      {
        id: 'translation-streaming',
        name: 'Translation Streaming',
        status: 'partial',
        api: 'POST /v1/translate/stream',
        notes: 'Links existing translate SSE.',
      },
      {
        id: 'llm-streaming',
        name: 'LLM Streaming',
        status: 'partial',
        api: 'POST /v1/streaming-runtime/stream',
        notes: 'Sandbox token-chunk SSE on this hub.',
      },
      {
        id: 'video-streaming',
        name: 'Video Streaming',
        status: 'deferred',
        api: null,
        notes: 'Video streaming OS deferred.',
      },
      {
        id: 'realtime-apis',
        name: 'Realtime APIs',
        status: 'partial',
        api: 'GET /v1/streaming-runtime/surfaces',
        notes: 'Discoverable SSE surfaces — not full realtime OS.',
      },
      {
        id: 'websockets',
        name: 'WebSockets',
        status: 'deferred',
        api: null,
        notes: 'WebSocket runtime deferred.',
      },
      {
        id: 'sse',
        name: 'SSE',
        status: 'shipped',
        api: 'POST /v1/streaming-runtime/stream',
        notes: 'Primary streaming transport.',
      },
      {
        id: 'grpc',
        name: 'gRPC',
        status: 'deferred',
        api: null,
        notes: 'gRPC streaming deferred.',
      },
      {
        id: 'sessions',
        name: 'Stream Sessions',
        status: 'shipped',
        api: 'GET/POST /v1/streaming-runtime/sessions',
        notes: 'Sandbox session registry for chunk streams.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/streaming-runtime/monitoring',
        notes: 'Session + honesty snapshot.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/streaming-runtime/analytics',
        notes: 'Session aggregates — ≠ .',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/streaming-runtime/engine',
        notes: 'REST streaming hub.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'streamingRuntimeEngine',
        notes: '@lugemi/sdk',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/STREAMING_RUNTIME.md',
        notes: 'Product doc + ADR-0119.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/streaming-runtime/stream',
        notes: 'Ships with Nest API — not a separate streaming fleet/OS.',
      },
    ] satisfies StreamingCapability[],
    honesty: {
      websocketOs: false,
      grpcStreamingOs: false,
      videoStreamingOs: false,
      bidirectionalRealtimeOs: false,
      regeneratesExistingStreams: false,
      extendsExistingSse: true,
      orgWorkspaceScoped: true,
      sandboxChunkStream: true,
      openaiTokenStreamOs: false,
      primaryTransport: 'sse',
    },
    links: {
      console: '/streaming-runtime',
      hub: '/inference-cloud',
      translateStream: 'POST /v1/translate/stream',
      speechStream: 'POST /v1/speech/stream',
      ttsStream: 'POST /v1/tts/stream',
      docs: '/docs/STREAMING_RUNTIME.md',
      openapi: '/v1/openapi.json',
    },
  };
}

export function streamingRuntimeMode: 'sandbox' | 'disabled' {
  const raw = (process.env.LUGEMI_STREAMING_RUNTIME_MODE ?? 'sandbox').toLowerCase;
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function streamingCeilings {
  const maxChunks = Math.max(
    4,
    Number(process.env.LUGEMI_STREAMING_MAX_CHUNKS ?? '64') || 64,
  );
  return {
    maxChunksPerStream: Math.min(maxChunks, 256),
    mode: streamingRuntimeMode,
    note: 'Hard ceiling on sandbox SSE chunks per stream request.',
  };
}

export const STREAM_KINDS: StreamKind[] = [
  'speech',
  'voice',
  'translation',
  'llm',
  'video',
  'realtime',
];
