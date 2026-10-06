export type InferenceProductStatus = 'shipped' | 'partial' | 'deferred';

export type InferenceProductRow = {
  id: string;
  name: string;
  status: InferenceProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 71 product map. Hub only — maps onto AI Gateway + chat/embeddings. */
export function inferenceProductCatalog: InferenceProductRow[] {
  return [
    {
      id: 'inference-cloud',
      name: 'Lugemi Inference Cloud',
      status: 'shipped',
      api: 'GET /v1/inference-cloud/products',
      console: '/inference-cloud',
      notes:
        'Inference Cloud parent hub. Shared model runtime layer over AI Gateway + vendor APIs — not a GPU hyperscaler or multi-region OS.',
    },
    {
      id: 'gpu-platform',
      name: 'GPU Platform',
      status: 'partial',
      api: 'GET /v1/gpu-platform/engine',
      console: '/gpu-platform',
      notes:
        'Sandbox pools/schedule/quotas/autoscale with hard ceilings. No cloud GPU APIs; MIG/distributed deferred.',
    },
    {
      id: 'model-serving',
      name: 'Model Serving',
      status: 'partial',
      api: 'GET /v1/model-serving/engine',
      console: '/model-serving',
      notes:
        'Serving hub over Gateway + /v1/models with sandbox versioning/canary/blue-green/rollback. Not vLLM/KServe OS.',
    },
    {
      id: 'ai-router',
      name: 'AI Router',
      status: 'partial',
      api: 'GET /v1/ai-router/engine',
      console: '/ai-router',
      notes:
        'Dry-run model/provider routing over Gateway + Model Serving weights. Not a service mesh; caching deferred; spend enforce is .',
    },
    {
      id: 'streaming-runtime',
      name: 'Streaming Runtime',
      status: 'partial',
      api: 'GET /v1/streaming-runtime/engine',
      console: '/streaming-runtime',
      notes:
        'SSE hub over existing speech/voice/translate streams + sandbox LLM chunks. WebSocket/gRPC/video deferred.',
    },
    {
      id: 'batch-runtime',
      name: 'Batch Runtime',
      status: 'partial',
      api: 'GET /v1/batch-runtime/engine',
      console: '/batch-runtime',
      notes:
        'Batch hub over BullMQ jobs + sandbox runs with priority/retry/checkpoint. Not Spark/Airflow OS; video deferred.',
    },
    {
      id: 'intelligent-cache',
      name: 'Intelligent Cache',
      status: 'partial',
      api: 'GET /v1/intelligent-cache/engine',
      console: '/intelligent-cache',
      notes:
        'Opt-in exact-key / normalized-hash cache namespaces. Not Redis Cluster/vector/CDN OS; Gateway not auto-wired.',
    },
    {
      id: 'cost-optimization',
      name: 'Cost Optimization Engine',
      status: 'partial',
      api: 'GET /v1/cost-optimization/engine',
      console: '/cost-optimization',
      notes:
        'Hard daily/monthly spend caps + cost-preferring optimize. Not FinOps/Spot OS; enforces, not report-only.',
    },
    {
      id: 'ai-runtime-analytics',
      name: 'AI Runtime Analytics',
      status: 'partial',
      api: 'GET /v1/ai-runtime-analytics/engine',
      console: '/ai-runtime-analytics',
      notes:
        'Inference Cloud latency/throughput/GPU/CPU/cache/requests/errors/cost/models/streaming aggregates. ≠ ; not BI/APM OS.',
    },
    {
      id: 'cpu-runtime',
      name: 'CPU Runtime',
      status: 'partial',
      api: 'GET /v1/gateway/providers',
      console: '/gateway',
      notes: 'CPU path today = Nest API + vendor HTTP adapters. Not a custom CPU cluster OS.',
    },
    {
      id: 'model-registry-bridge',
      name: 'Model Registry Integration',
      status: 'partial',
      api: 'GET /v1/models',
      console: '/models',
      notes: 'Links existing model registry — not regenerated. Full Inference registry deferred.',
    },
    {
      id: 'autoscaling',
      name: 'Autoscaling',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Autoscaling with hard ceilings (Phase 72+). Fly/platform scale today; no open-ended GPU autoscale.',
    },
    {
      id: 'multi-region-runtime',
      name: 'Multi Region Runtime',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Multi-region Inference OS deferred. Primary region af-south-1; Fly/EKS shared platform.',
    },
  ];
}

export function inferenceArchitectureNotes {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_inference_cloud_hub',
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
    docker: true,
    terraform: true,
    kubernetes: true,
    primaryRegion: 'af-south-1',
    deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    billing: true,
    monitoring: true,
    gpuHyperscalerOs: false,
    multiRegionRuntimeOs: false,
    regeneratesAiGateway: false,
    extendsAiGateway: true,
    extendsChatEmbeddings: true,
    vendorApisToday: true,
    hardSpendCeilingsRequired: true,
    openEndedGpuAutoscale: false,
  };
}
