export type ModelServingCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type ModelServingCapability = {
  id: string;
  name: string;
  status: ModelServingCapabilityStatus;
  api: string | null;
  notes: string;
};

export type ServingModelKind =
  | 'llm'
  | 'speech'
  | 'voice'
  | 'ocr'
  | 'embedding'
  | 'vision'
  | 'reasoning';

export type ServingModelKindRow = {
  id: ServingModelKind;
  name: string;
  status: ModelServingCapabilityStatus;
  registryFeatures: string[];
  gatewayApis: string[];
  notes: string;
};

/** Library model families → Gateway / registry features. */
export function servingModelKinds: ServingModelKindRow[] {
  return [
    {
      id: 'llm',
      name: 'LLMs',
      status: 'partial',
      registryFeatures: ['chat'],
      gatewayApis: ['POST /v1/chat', 'POST /v1/chat/completions'],
      notes: 'Served via AI Gateway chat adapters + model registry — not a self-hosted LLM OS.',
    },
    {
      id: 'speech',
      name: 'Speech Models',
      status: 'partial',
      registryFeatures: ['stt'],
      gatewayApis: ['POST /v1/stt', 'POST /v1/audio/transcriptions'],
      notes: 'STT via Gateway vendors (Whisper etc.).',
    },
    {
      id: 'voice',
      name: 'Voice Models',
      status: 'partial',
      registryFeatures: ['tts'],
      gatewayApis: ['POST /v1/tts', 'POST /v1/audio/speech'],
      notes: 'TTS / neural voice via Gateway + Voice Cloud products.',
    },
    {
      id: 'ocr',
      name: 'OCR Models',
      status: 'partial',
      registryFeatures: ['ocr'],
      gatewayApis: ['POST /v1/ocr'],
      notes: 'OCR via Gateway adapters.',
    },
    {
      id: 'embedding',
      name: 'Embedding Models',
      status: 'partial',
      registryFeatures: ['embeddings'],
      gatewayApis: ['POST /v1/embeddings'],
      notes: 'Embeddings via Gateway + Embedding Cloud.',
    },
    {
      id: 'vision',
      name: 'Vision Models',
      status: 'deferred',
      registryFeatures: [],
      gatewayApis: [],
      notes: 'Dedicated vision serving OS deferred — OCR covers document vision today.',
    },
    {
      id: 'reasoning',
      name: 'Reasoning Models',
      status: 'partial',
      registryFeatures: ['chat'],
      gatewayApis: ['GET /v1/reasoning-cloud/engine'],
      notes: 'Reasoning Cloud + chat path — not a separate reasoning GPU cluster.',
    },
  ];
}

/**
 * Library Phase 73 → Model Serving.
 * Serving hub over AI Gateway + model registry — not a vLLM / KServe OS.
 */
export function modelServingCatalog {
  return {
    product: 'Lugemi Model Serving',
    note:
      'Enterprise Model Serving hub. Catalogs LLM/speech/voice/OCR/embedding/vision/reasoning endpoints over AI Gateway + /v1/models. Sandbox deployments support light versioning, canary traffic %, blue/green slots, and rollback. Not a vLLM/KServe/Triton control plane or self-hosted GPU serving OS.',
    capabilities: [
      {
        id: 'llms',
        name: 'LLMs',
        status: 'partial',
        api: 'GET /v1/model-serving/kinds',
        notes: 'Chat LLMs via Gateway.',
      },
      {
        id: 'speech-models',
        name: 'Speech Models',
        status: 'partial',
        api: 'GET /v1/model-serving/kinds',
        notes: 'STT via Gateway.',
      },
      {
        id: 'voice-models',
        name: 'Voice Models',
        status: 'partial',
        api: 'GET /v1/model-serving/kinds',
        notes: 'TTS via Gateway / Voice Cloud.',
      },
      {
        id: 'ocr-models',
        name: 'OCR Models',
        status: 'partial',
        api: 'GET /v1/model-serving/kinds',
        notes: 'OCR via Gateway.',
      },
      {
        id: 'embedding-models',
        name: 'Embedding Models',
        status: 'partial',
        api: 'GET /v1/model-serving/kinds',
        notes: 'Embeddings via Gateway.',
      },
      {
        id: 'vision-models',
        name: 'Vision Models',
        status: 'deferred',
        api: null,
        notes: 'Dedicated vision serving deferred.',
      },
      {
        id: 'reasoning-models',
        name: 'Reasoning Models',
        status: 'partial',
        api: 'GET /v1/model-serving/kinds',
        notes: 'Reasoning Cloud + chat path.',
      },
      {
        id: 'streaming',
        name: 'Streaming',
        status: 'partial',
        api: 'GET /v1/model-serving/modes',
        notes: 'Existing chat/TTS SSE — dedicated Streaming Runtime is .',
      },
      {
        id: 'batch',
        name: 'Batch',
        status: 'partial',
        api: 'GET /v1/model-serving/modes',
        notes: 'BullMQ jobs today — dedicated Batch Runtime is .',
      },
      {
        id: 'realtime',
        name: 'Realtime',
        status: 'partial',
        api: 'GET /v1/model-serving/modes',
        notes: 'Existing realtime surfaces where wired; full realtime serving OS deferred.',
      },
      {
        id: 'autoscaling',
        name: 'Autoscaling',
        status: 'deferred',
        api: null,
        notes: 'Serving autoscaler OS deferred — GPU Platform hard ceilings cover infra.',
      },
      {
        id: 'canary',
        name: 'Canary',
        status: 'partial',
        api: 'POST /v1/model-serving/deployments',
        notes: 'Sandbox trafficPercent on deployments — not a mesh canary OS.',
      },
      {
        id: 'blue-green',
        name: 'Blue Green',
        status: 'partial',
        api: 'POST /v1/model-serving/deployments/:id/promote',
        notes: 'Sandbox blue/green slot swap — not Kubernetes deploy OS.',
      },
      {
        id: 'rollback',
        name: 'Rollback',
        status: 'partial',
        api: 'POST /v1/model-serving/deployments/:id/rollback',
        notes: 'Activate previous version record in sandbox.',
      },
      {
        id: 'versioning',
        name: 'Versioning',
        status: 'partial',
        api: 'GET /v1/model-serving/deployments',
        notes: 'Per-endpoint version strings on sandbox deployments.',
      },
      {
        id: 'endpoints',
        name: 'Serving Endpoints',
        status: 'shipped',
        api: 'GET /v1/model-serving/endpoints',
        notes: 'Discoverable Gateway + registry endpoint map.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/model-serving/monitoring',
        notes: 'Deployment health + honesty snapshot.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/model-serving/analytics',
        notes: 'Deployment aggregates — ≠ AI Runtime Analytics.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/model-serving/engine',
        notes: 'REST serving hub.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'modelServingEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'modelServingEngine',
        notes: '@lugemi/sdk',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/MODEL_SERVING.md',
        notes: 'Product doc + ADR-0117.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/model-serving/deployments',
        notes: 'Sandbox logical deployments — Fly/shared platform for the API itself.',
      },
    ] satisfies ModelServingCapability[],
    honesty: {
      vllmOs: false,
      kserveOs: false,
      tritonOs: false,
      selfHostedGpuServingOs: false,
      regeneratesAiGateway: false,
      extendsAiGateway: true,
      extendsModelRegistry: true,
      orgWorkspaceScoped: true,
      sandboxDeploymentsOnly: true,
      fullCanaryMeshOs: false,
      fullBlueGreenOs: false,
      servingAutoscalerOs: false,
    },
    links: {
      console: '/model-serving',
      hub: '/inference-cloud',
      models: '/models',
      gateway: '/gateway',
      gpuPlatform: '/gpu-platform',
      docs: '/docs/MODEL_SERVING.md',
      openapi: '/v1/openapi.json',
    },
  };
}

export function servingModes {
  return [
    {
      id: 'streaming',
      name: 'Streaming',
      status: 'partial' as const,
      notes: 'Chat/TTS SSE where wired; dedicated Streaming Runtime .',
    },
    {
      id: 'batch',
      name: 'Batch',
      status: 'partial' as const,
      notes: 'BullMQ jobs; dedicated Batch Runtime .',
    },
    {
      id: 'realtime',
      name: 'Realtime',
      status: 'partial' as const,
      notes: 'Existing realtime surfaces; full realtime serving OS deferred.',
    },
    {
      id: 'autoscaling',
      name: 'Autoscaling',
      status: 'deferred' as const,
      notes: 'Serving autoscaler OS deferred — use GPU Platform hard ceilings.',
    },
    {
      id: 'canary',
      name: 'Canary',
      status: 'partial' as const,
      notes: 'Sandbox trafficPercent on deployments.',
    },
    {
      id: 'blue-green',
      name: 'Blue Green',
      status: 'partial' as const,
      notes: 'Sandbox slot promote/swap.',
    },
    {
      id: 'rollback',
      name: 'Rollback',
      status: 'partial' as const,
      notes: 'Activate previous version.',
    },
    {
      id: 'versioning',
      name: 'Versioning',
      status: 'partial' as const,
      notes: 'Version strings on sandbox deployments.',
    },
  ];
}

export type ServingMode = 'sandbox' | 'disabled';

export function modelServingMode: ServingMode {
  const raw = (process.env.LUGEMI_MODEL_SERVING_MODE ?? 'sandbox').toLowerCase;
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

/** Max concurrent active sandbox deployments per workspace. */
export function modelServingCeilings {
  const maxActive = Math.max(
    1,
    Number(process.env.LUGEMI_MODEL_SERVING_MAX_ACTIVE ?? '8') || 8,
  );
  return {
    maxActiveDeployments: Math.min(maxActive, 32),
    mode: modelServingMode,
    note:
      'Hard ceiling on active sandbox deployments per org/workspace. Not a GPU spend ceiling — see GPU Platform.',
  };
}
