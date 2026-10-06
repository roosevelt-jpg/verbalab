export type AiRouterCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type AiRouterCapability = {
  id: string;
  name: string;
  status: AiRouterCapabilityStatus;
  api: string | null;
  notes: string;
};

export type RouterFeature =
  | 'chat'
  | 'translate'
  | 'stt'
  | 'tts'
  | 'ocr'
  | 'embeddings'
  | 'detect';

export type RouterOptimize = 'latency' | 'cost' | 'balanced' | 'quality';

export type RouterCandidate = {
  providerId: string;
  modelSlug: string | null;
  feature: RouterFeature;
  role: 'primary' | 'fallback' | 'canary';
  estimatedLatencyMs: number;
  estimatedCostPer1kUsd: number;
  region: string;
  configured: boolean;
  weight: number;
  notes: string;
};

type FeatureRouteDef = {
  feature: RouterFeature;
  gatewayApi: string;
  candidates: Array<Omit<RouterCandidate, 'feature' | 'configured'> & { envKey: string | null }>;
};

function envSet(key: string | null): boolean {
  if (!key) return true;
  if (key === 'GOOGLE_VISION_API_KEY') {
    return Boolean(process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY);
  }
  return Boolean(process.env[key]?.trim());
}

/** Static candidate matrix — extends Gateway adapters; not a new provider mesh. */
export function routerFeatureRoutes(): FeatureRouteDef[] {
  return [
    {
      feature: 'chat',
      gatewayApi: 'POST /v1/chat/completions',
      candidates: [
        {
          providerId: 'openai',
          modelSlug: 'vendor-chat-openai',
          role: 'primary',
          estimatedLatencyMs: 800,
          estimatedCostPer1kUsd: 0.015,
          region: 'af-south-1',
          weight: 80,
          envKey: 'OPENAI_API_KEY',
          notes: 'Primary OpenAI chat adapter.',
        },
        {
          providerId: 'openrouter',
          modelSlug: 'vendor-chat-openrouter',
          role: 'fallback',
          estimatedLatencyMs: 1100,
          estimatedCostPer1kUsd: 0.008,
          region: 'af-south-1',
          weight: 20,
          envKey: 'OPENROUTER_API_KEY',
          notes: 'Optional OpenAI-compatible fallback.',
        },
      ],
    },
    {
      feature: 'translate',
      gatewayApi: 'POST /v1/translate',
      candidates: [
        {
          providerId: 'google_translate',
          modelSlug: 'vendor-translate-google',
          role: 'primary',
          estimatedLatencyMs: 250,
          estimatedCostPer1kUsd: 0.02,
          region: 'af-south-1',
          weight: 100,
          envKey: 'GOOGLE_TRANSLATE_API_KEY',
          notes: 'Default MT adapter.',
        },
      ],
    },
    {
      feature: 'stt',
      gatewayApi: 'POST /v1/stt',
      candidates: [
        {
          providerId: 'openai',
          modelSlug: 'vendor-stt-openai-whisper',
          role: 'primary',
          estimatedLatencyMs: 1200,
          estimatedCostPer1kUsd: 0.006,
          region: 'af-south-1',
          weight: 100,
          envKey: 'OPENAI_API_KEY',
          notes: 'Whisper via OpenAI.',
        },
      ],
    },
    {
      feature: 'tts',
      gatewayApi: 'POST /v1/tts',
      candidates: [
        {
          providerId: 'openai',
          modelSlug: 'vendor-tts-openai',
          role: 'primary',
          estimatedLatencyMs: 900,
          estimatedCostPer1kUsd: 0.015,
          region: 'af-south-1',
          weight: 70,
          envKey: 'OPENAI_API_KEY',
          notes: 'Stock OpenAI TTS.',
        },
        {
          providerId: 'own_tts',
          modelSlug: 'own-tts-rented',
          role: 'fallback',
          estimatedLatencyMs: 700,
          estimatedCostPer1kUsd: 0.004,
          region: 'af-south-1',
          weight: 30,
          envKey: 'OWN_TTS_URL',
          notes: 'Rented/open-weight TTS when OWN_TTS_URL set.',
        },
      ],
    },
    {
      feature: 'ocr',
      gatewayApi: 'POST /v1/ocr',
      candidates: [
        {
          providerId: 'google_vision',
          modelSlug: 'vendor-ocr-google-vision',
          role: 'primary',
          estimatedLatencyMs: 600,
          estimatedCostPer1kUsd: 0.0015,
          region: 'af-south-1',
          weight: 100,
          envKey: 'GOOGLE_VISION_API_KEY',
          notes: 'Google Vision OCR.',
        },
      ],
    },
    {
      feature: 'embeddings',
      gatewayApi: 'POST /v1/embeddings',
      candidates: [
        {
          providerId: 'openai',
          modelSlug: 'vendor-embeddings-openai',
          role: 'primary',
          estimatedLatencyMs: 400,
          estimatedCostPer1kUsd: 0.0001,
          region: 'af-south-1',
          weight: 100,
          envKey: 'OPENAI_API_KEY',
          notes: 'OpenAI embeddings.',
        },
      ],
    },
    {
      feature: 'detect',
      gatewayApi: 'POST /v1/detect',
      candidates: [
        {
          providerId: 'google_translate',
          modelSlug: 'vendor-detect-google',
          role: 'primary',
          estimatedLatencyMs: 180,
          estimatedCostPer1kUsd: 0.0,
          region: 'af-south-1',
          weight: 70,
          envKey: 'GOOGLE_TRANSLATE_API_KEY',
          notes: 'Google detect primary.',
        },
        {
          providerId: 'franc',
          modelSlug: 'vendor-detect-franc',
          role: 'fallback',
          estimatedLatencyMs: 20,
          estimatedCostPer1kUsd: 0.0,
          region: 'af-south-1',
          weight: 30,
          envKey: null,
          notes: 'Local franc-min fallback — always available.',
        },
      ],
    },
  ];
}

export function hydrateCandidates(
  defs: FeatureRouteDef['candidates'],
  feature: RouterFeature,
): RouterCandidate[] {
  return defs.map((c) => ({
    providerId: c.providerId,
    modelSlug: c.modelSlug,
    feature,
    role: c.role,
    estimatedLatencyMs: c.estimatedLatencyMs,
    estimatedCostPer1kUsd: c.estimatedCostPer1kUsd,
    region: c.region,
    configured: envSet(c.envKey),
    weight: c.weight,
    notes: c.notes,
  }));
}

/**
 * AI Router.
 * Extends Gateway routing — not a service mesh / multi-cloud router OS.
 */
export function aiRouterCatalog() {
  return {
    product: 'Lugemi AI Router',
    note:
      'AI Router. Dry-run model/provider/inference selection over AI Gateway adapters with latency/cost/balanced strategies, fallbacks, retries, regional preference, and light load-balancing weights. Not a service mesh, multi-cloud router OS, or Gateway regenerate. Caching via Intelligent Cache; spend caps enforced by Cost Optimization on resolve.',
    capabilities: [
      {
        id: 'model-selection',
        name: 'Model Selection',
        status: 'shipped',
        api: 'POST /v1/ai-router/resolve',
        notes: 'Picks modelSlug from registry-linked candidates.',
      },
      {
        id: 'provider-selection',
        name: 'Provider Selection',
        status: 'shipped',
        api: 'POST /v1/ai-router/resolve',
        notes: 'Orders Gateway provider adapters.',
      },
      {
        id: 'inference-selection',
        name: 'Inference Selection',
        status: 'shipped',
        api: 'POST /v1/ai-router/resolve',
        notes: 'Feature → gateway API + candidate chain.',
      },
      {
        id: 'latency-optimization',
        name: 'Latency Optimization',
        status: 'partial',
        api: 'POST /v1/ai-router/resolve',
        notes: 'optimize=latency sorts by estimatedLatencyMs — not live RTT mesh.',
      },
      {
        id: 'cost-optimization',
        name: 'Cost Optimization',
        status: 'partial',
        api: 'GET /v1/cost-optimization/engine',
        notes: 'optimize=cost sorts by estimated USD; hard daily/monthly enforce via existing on resolve.',
      },
      {
        id: 'regional-routing',
        name: 'Regional Routing',
        status: 'partial',
        api: 'POST /v1/ai-router/resolve',
        notes: 'Prefer primaryRegion af-south-1 tags — multi-region mesh deferred.',
      },
      {
        id: 'fallback',
        name: 'Fallback',
        status: 'shipped',
        api: 'POST /v1/ai-router/resolve',
        notes: 'Ordered fallback chain when primary unconfigured/failed.',
      },
      {
        id: 'retries',
        name: 'Retries',
        status: 'partial',
        api: 'GET /v1/ai-router/policies',
        notes: 'Policy maxRetries (default 1) — Gateway still owns actual retry.',
      },
      {
        id: 'caching',
        name: 'Caching',
        status: 'partial',
        api: 'GET /v1/intelligent-cache/engine',
        notes: 'Opt-in via Intelligent Cache — Router does not auto-cache resolves.',
      },
      {
        id: 'streaming',
        name: 'Streaming',
        status: 'partial',
        api: 'POST /v1/ai-router/resolve',
        notes: 'Flags streamingCapable when feature supports SSE — runtime is.',
      },
      {
        id: 'load-balancing',
        name: 'Load Balancing',
        status: 'partial',
        api: 'POST /v1/ai-router/resolve',
        notes: 'Weighted candidates + Model Serving canary % — not a L7 mesh.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/ai-router/monitoring',
        notes: 'Decision aggregates + honesty.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/ai-router/analytics',
        notes: 'Route decision counts — ≠.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/ai-router/engine',
        notes: 'REST router hub.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'aiRouterEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'aiRouterEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/AI_ROUTER.md',
        notes: 'Product documentation.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/ai-router/resolve',
        notes: 'Router ships with Nest API on Fly/shared platform — not a separate router fleet.',
      },
    ] satisfies AiRouterCapability[],
    honesty: {
      serviceMeshOs: false,
      multiCloudRouterOs: false,
      regeneratesAiGateway: false,
      extendsAiGateway: true,
      extendsModelServing: true,
      extendsDecisionEngine: true,
      orgWorkspaceScoped: true,
      dryRunResolveOnly: true,
      liveRttMesh: false,
      inferenceCacheOs: false,
      enforcesSpendCaps: false,
      primaryRegion: 'af-south-1',
    },
    links: {
      console: '/ai-router',
      hub: '/inference-cloud',
      gateway: '/gateway',
      modelServing: '/model-serving',
      decisionEngine: '/decision-engine',
      docs: '/docs/AI_ROUTER.md',
      openapi: '/v1/openapi.json',
    },
  };
}

export function defaultRouterPolicy() {
  return {
    optimize: 'balanced' as RouterOptimize,
    maxRetries: 1,
    preferRegion: 'af-south-1',
    allowFallback: true,
    preferConfiguredOnly: true,
    streamingPreferred: false,
    note: 'Defaults applied when no workspace policy row exists.',
  };
}

export function aiRouterMode(): 'sandbox' | 'disabled' {
  const raw = (process.env.LUGEMI_AI_ROUTER_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export const ROUTER_FEATURES: RouterFeature[] = [
  'chat',
  'translate',
  'stt',
  'tts',
  'ocr',
  'embeddings',
  'detect',
];

export const STREAMING_FEATURES = new Set<RouterFeature>(['chat', 'tts']);
