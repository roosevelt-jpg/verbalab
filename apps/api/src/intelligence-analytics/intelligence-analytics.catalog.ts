export type IntelAnalyticsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type IntelAnalyticsCapability = {
  id: string;
  name: string;
  status: IntelAnalyticsCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Intelligence Analytics. Aggregates for this cloud — not Language/Speech/Voice analytics. */
export function intelligenceAnalyticsCatalog() {
  return {
    product: 'Lugemi Intelligence Analytics',
    note:
      'Usage/quality aggregates for Intelligence Cloud surfaces: embeddings, memory, knowledge/vector, context, reasoning, recommendations, prompts, decisions, orchestration, chat. Distinct from Language/Speech/Voice analytics. Not a BI dashboard OS or enterprise reporting suite.',
    capabilities: [
      {
        id: 'reasoning-analytics',
        name: 'Reasoning',
        status: 'shipped',
        api: 'GET /v1/intelligence-analytics/surfaces',
        notes: 'Counts reasoning_cloud.reasoned audits.',
      },
      {
        id: 'memory-analytics',
        name: 'Memory',
        status: 'shipped',
        api: 'GET /v1/intelligence-analytics/surfaces',
        notes: 'memory_cloud.* audit aggregates.',
      },
      {
        id: 'knowledge-usage',
        name: 'Knowledge Usage',
        status: 'shipped',
        api: 'GET /v1/intelligence-analytics/surfaces',
        notes: 'vector_cloud / knowledge_graph / context_engine activity.',
      },
      {
        id: 'embeddings-analytics',
        name: 'Embeddings',
        status: 'shipped',
        api: 'GET /v1/intelligence-analytics/usage',
        notes: 'usage_events feature=embeddings + embed audits.',
      },
      {
        id: 'latency',
        name: 'Latency',
        status: 'partial',
        api: 'GET /v1/intelligence-analytics/latency',
        notes: 'latencyMs from chat/reason audits when present — not full tracing.',
      },
      {
        id: 'quality',
        name: 'Quality',
        status: 'partial',
        api: 'GET /v1/intelligence-analytics/quality',
        notes: 'Prompt eval scores + decision confidence proxies — not human eval lab.',
      },
      {
        id: 'confidence',
        name: 'Confidence',
        status: 'partial',
        api: 'GET /v1/intelligence-analytics/quality',
        notes: 'Same quality surface — decision/recommend confidence averages.',
      },
      {
        id: 'model-routing',
        name: 'Model Routing',
        status: 'partial',
        api: 'GET /v1/intelligence-analytics/routing',
        notes: 'decision_engine.decided model_selection/routing kind counts.',
      },
      {
        id: 'cost',
        name: 'Cost',
        status: 'shipped',
        api: 'GET /v1/intelligence-analytics/costs',
        notes: 'Estimated chat/embeddings USD — not Stripe invoices.',
      },
      {
        id: 'enterprise-reports',
        name: 'Enterprise Reports',
        status: 'deferred',
        api: null,
        notes: 'Enterprise BI / scheduled PDF suite deferred.',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'shipped',
        api: 'GET /v1/intelligence-analytics/report',
        notes: 'Bundled Intelligence Analytics JSON report.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/intelligence-analytics/monitoring',
        notes: 'Snapshot + shared observability.',
      },
    ] satisfies IntelAnalyticsCapability[],
    honesty: {
      regeneratesLanguageAnalytics: false,
      regeneratesSpeechAnalytics: false,
      regeneratesVoiceAnalytics: false,
      biDashboardOs: false,
      enterpriseReportingSuite: false,
      aggregatesOnly: true,
    },
    links: {
      console: '/intelligence-analytics',
      hub: '/intelligence-cloud',
      languageAnalytics: '/analytics',
      speechAnalytics: '/speech-analytics',
      voiceAnalytics: '/voice-analytics',
      usage: '/usage',
      openapi: '/v1/openapi.json',
      docs: '/docs/INTELLIGENCE_ANALYTICS.md',
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
      backend: 'audit_usage_aggregates',
    },
  };
}

/** Audit action prefixes that count as Intelligence Cloud product activity. */
export const INTEL_AUDIT_PREFIXES = [
  'embeddings.',
  'embedding_cloud.',
  'vector_cloud.',
  'memory_cloud.',
  'knowledge_graph.',
  'context_engine.',
  'reasoning_cloud.',
  'recommendation_engine.',
  'prompt_intelligence.',
  'prompt.',
  'decision_engine.',
  'ai_orchestration.',
  'chat.',
] as const;

export const INTEL_SURFACE_ACTIONS: Record<string, string[]> = {
  embeddings: ['embeddings.created', 'embedding_cloud.embed'],
  vector: ['vector_cloud.searched'],
  memory: [
    'memory_cloud.created',
    'memory_cloud.searched',
    'memory_cloud.exported',
    'memory_cloud.erased',
    'memory_cloud.deleted',
    'memory_cloud.revised',
  ],
  knowledgeGraph: [
    'knowledge_graph.entity_created',
    'knowledge_graph.entity_deleted',
    'knowledge_graph.relationship_created',
  ],
  context: ['context_engine.assembled'],
  reasoning: ['reasoning_cloud.reasoned'],
  recommendations: ['recommendation_engine.recommended'],
  prompts: [
    'prompt.version_created',
    'prompt.activated',
    'prompt.fallback_restored',
    'prompt_intelligence.previewed',
    'prompt_intelligence.evaluated',
    'prompt_intelligence.security_scanned',
  ],
  decisions: ['decision_engine.decided'],
  orchestration: ['ai_orchestration.ran'],
  chat: ['chat.completed'],
};
