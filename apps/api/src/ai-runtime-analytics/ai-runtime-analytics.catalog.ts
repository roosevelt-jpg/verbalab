export type RuntimeAnalyticsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type RuntimeAnalyticsCapability = {
  id: string;
  name: string;
  status: RuntimeAnalyticsCapabilityStatus;
  api: string | null;
  notes: string;
};

export function aiRuntimeAnalyticsMode: 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_AI_RUNTIME_ANALYTICS_MODE ?? 'sandbox').toLowerCase;
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

/**
 * Library Phase 79 → AI Runtime Analytics.
 * Inference Cloud aggregates — ≠ Intelligence/Knowledge/Language analytics; not BI OS.
 */
export function aiRuntimeAnalyticsCatalog {
  return {
    product: 'Lugemi AI Runtime Analytics',
    note:
      'AI Runtime Analytics. Org/workspace aggregates for Inference Cloud latency/throughput/GPU/CPU/cache/requests/errors/cost/customers/models/streaming. Reads GPU Platform, AI Router, Streaming, Batch, Cache, Cost Optimization, Model Serving, and usage_events. Not a BI dashboard OS, APM suite, or regenerate of Intelligence Analytics / Knowledge Analytics.',
    capabilities: [
      {
        id: 'latency',
        name: 'Latency',
        status: 'partial',
        api: 'GET /v1/ai-runtime-analytics/latency',
        notes: 'Router/streaming/batch timing proxies from metadata when present — not full distributed tracing.',
      },
      {
        id: 'throughput',
        name: 'Throughput',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/throughput',
        notes: 'Router decisions + batch/streaming/usage counts per period.',
      },
      {
        id: 'gpu-usage',
        name: 'GPU Usage',
        status: 'partial',
        api: 'GET /v1/ai-runtime-analytics/gpu',
        notes: 'Sandbox GpuAllocation inventory — not cloud GPU telemetry OS.',
      },
      {
        id: 'cpu-usage',
        name: 'CPU Usage',
        status: 'partial',
        api: 'GET /v1/ai-runtime-analytics/cpu',
        notes: 'Process/host load snapshot for Nest CPU path — not cluster APM.',
      },
      {
        id: 'cache-hits',
        name: 'Cache Hits',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/cache',
        notes: 'Sum of Intelligent Cache entry hits/misses.',
      },
      {
        id: 'requests',
        name: 'Requests',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/requests',
        notes: 'usage_events + router decisions + streaming/batch runs.',
      },
      {
        id: 'errors',
        name: 'Errors',
        status: 'partial',
        api: 'GET /v1/ai-runtime-analytics/errors',
        notes: 'Failed batch/streaming statuses + selected audit failures — not error-tracking SaaS.',
      },
      {
        id: 'cost',
        name: 'Cost',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/cost',
        notes: 'CostSpendEvent ledger + GPU hourly estimates — ≠ Stripe invoices; enforce remains .',
      },
      {
        id: 'customers',
        name: 'Customers',
        status: 'partial',
        api: 'GET /v1/ai-runtime-analytics/customers',
        notes: 'Workspace activity counts under the org — not a CRM/customer-data platform.',
      },
      {
        id: 'models',
        name: 'Models',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/models',
        notes: 'Router selectedModel + Model Serving deployment aggregates.',
      },
      {
        id: 'streaming',
        name: 'Streaming',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/streaming',
        notes: 'StreamingSession aggregates by kind/status.',
      },
      {
        id: 'dashboard',
        name: 'Analytics Dashboard',
        status: 'shipped',
        api: '/ai-runtime-analytics',
        notes: 'Console hub over REST aggregates.',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/report',
        notes: 'Bundled JSON report — not scheduled PDF/BI suite.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/engine',
        notes: 'REST analytics hub.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'aiRuntimeAnalyticsEngine',
        notes: '@lugemi/sdk',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/ai-runtime-analytics/monitoring',
        notes: 'Snapshot + honesty.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'aiRuntimeAnalyticsEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'GET /v1/ai-runtime-analytics/overview',
        notes: 'Ships with Nest API — not a separate analytics fleet.',
      },
    ] satisfies RuntimeAnalyticsCapability[],
    honesty: {
      biDashboardOs: false,
      apmOs: false,
      cloudGpuTelemetryOs: false,
      regeneratesIntelligenceAnalytics: false,
      regeneratesKnowledgeAnalytics: false,
      regeneratesLanguageAnalytics: false,
      enterpriseReportingSuite: false,
      aggregatesOnly: true,
      orgWorkspaceScoped: true,
      extendsInferenceCloud: true,
      primaryRegion: 'af-south-1',
    },
    links: {
      console: '/ai-runtime-analytics',
      hub: '/inference-cloud',
      costOptimization: '/cost-optimization',
      gpuPlatform: '/gpu-platform',
      aiRouter: '/ai-router',
      intelligentCache: '/intelligent-cache',
      intelligenceAnalytics: '/intelligence-analytics',
      knowledgeAnalytics: '/knowledge-analytics',
      usage: '/usage',
      docs: '/docs/AI_RUNTIME_ANALYTICS.md',
      adr: '/docs/adr/0123-ai-runtime-analytics.md',
    },
  };
}
