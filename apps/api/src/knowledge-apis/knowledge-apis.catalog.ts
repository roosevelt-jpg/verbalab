export type KnowledgeApisCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeApisCapability = {
  id: string;
  name: string;
  status: KnowledgeApisCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Public Knowledge Cloud API surfaces catalogued by this pack (VL-201). */
export function knowledgeApiSurfaces() {
  return [
    {
      product: 'knowledge-cloud',
      rest: ['GET /v1/knowledge-cloud/products', 'GET /v1/knowledge-cloud/overview'],
      graphql: ['knowledgeProducts'],
      console: '/knowledge-cloud',
    },
    {
      product: 'enterprise-knowledge-base',
      rest: [
        'GET /v1/knowledge-base/engine',
        'GET /v1/knowledge-base/analytics',
        'GET /v1/knowledge-base/monitoring',
      ],
      graphql: ['knowledgeBaseEngine'],
      console: '/knowledge-base',
    },
    {
      product: 'enterprise-search',
      rest: [
        'GET /v1/enterprise-search/engine',
        'POST /v1/enterprise-search/search',
        'GET /v1/enterprise-search/suggest',
      ],
      graphql: ['enterpriseSearchEngine'],
      console: '/enterprise-search',
    },
    {
      product: 'ontology-platform',
      rest: ['GET /v1/ontology/engine', 'GET /v1/ontology/concepts', 'POST /v1/ontology/concepts'],
      graphql: ['ontologyEngine'],
      console: '/ontology',
    },
    {
      product: 'taxonomy-platform',
      rest: ['GET /v1/taxonomy/engine', 'GET /v1/taxonomy/terms', 'POST /v1/taxonomy/terms'],
      graphql: ['taxonomyEngine'],
      console: '/taxonomy',
    },
    {
      product: 'enterprise-rag',
      rest: [
        'GET /v1/enterprise-rag/engine',
        'POST /v1/enterprise-rag/retrieve',
        'POST /v1/enterprise-rag/query',
        'POST /v1/enterprise-rag/chunk',
      ],
      graphql: ['enterpriseRagEngine'],
      console: '/enterprise-rag',
    },
    {
      product: 'knowledge-memory',
      rest: [
        'GET /v1/knowledge-memory/engine',
        'POST /v1/knowledge-memory/memories',
        'POST /v1/knowledge-memory/memories/:id/evolve',
      ],
      graphql: ['knowledgeMemoryEngine'],
      console: '/knowledge-memory',
    },
    {
      product: 'knowledge-intelligence',
      rest: [
        'GET /v1/knowledge-intelligence/engine',
        'POST /v1/knowledge-intelligence/discover',
        'GET /v1/knowledge-intelligence/insight',
      ],
      graphql: ['knowledgeIntelligenceEngine'],
      console: '/knowledge-intelligence',
    },
    {
      product: 'knowledge-analytics',
      rest: [
        'GET /v1/knowledge-analytics/engine',
        'GET /v1/knowledge-analytics/overview',
        'GET /v1/knowledge-analytics/report',
      ],
      graphql: ['knowledgeAnalytics'],
      console: '/knowledge-analytics',
    },
    {
      product: 'vl062-knowledge',
      rest: [
        'GET /v1/knowledge/documents',
        'POST /v1/knowledge/documents',
        'POST /v1/knowledge/query',
      ],
      graphql: [],
      console: '/knowledge',
    },
  ] as const;
}

export const KNOWLEDGE_WEBHOOK_EVENTS = [
  {
    id: 'knowledge.document_ready',
    notes: 'Emitted when a VL-062 knowledge document finishes ingest (via job/webhook patterns where wired).',
  },
  {
    id: 'knowledge_intelligence.discovered',
    notes: 'Audit companion — use SSE /events/stream for near-realtime audit tails.',
  },
  {
    id: 'enterprise_rag.queried',
    notes: 'Audit companion for grounded RAG queries.',
  },
  {
    id: 'knowledge_memory.created',
    notes: 'Audit companion for knowledge-layer memory writes.',
  },
] as const;

/**
 * Library Phase 68 → Enterprise Knowledge APIs (VL-201).
 * Public API pack for Knowledge Cloud — not a gRPC/Kafka API platform OS.
 */
export function knowledgeApisCatalog() {
  return {
    product: 'Lugemi Enterprise Knowledge APIs',
    note:
      'Public-facing API pack for Knowledge Cloud (VL-201): REST catalog, GraphQL façades, OpenAPI, SDK/CLI, developer portal links, signed webhooks, and light SSE event tails. Extends VL-062 + Volume 6 hubs. Not a gRPC mesh, Kafka event-streaming OS, or multi-language SDK generator factory.',
    capabilities: [
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/knowledge-apis/surfaces',
        notes: 'Catalog of Knowledge Cloud REST surfaces (org/workspace scoped where authed).',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'GET /v1/knowledge-apis/graphql',
        notes: 'Engine queries for Knowledge Cloud products via /graphql.',
      },
      {
        id: 'grpc',
        name: 'gRPC',
        status: 'deferred',
        api: null,
        notes: 'gRPC services deferred — REST + GraphQL only.',
      },
      {
        id: 'realtime',
        name: 'Realtime',
        status: 'partial',
        api: 'GET /v1/knowledge-apis/events/stream',
        notes: 'SSE audit-event tail for knowledge actions. Bidirectional realtime sessions deferred.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'GET /v1/knowledge-apis/sdk',
        notes: '@lugemi/sdk knowledge* helpers. Hand-maintained — not generated.',
      },
      {
        id: 'cli',
        name: 'CLI',
        status: 'shipped',
        api: 'GET /v1/knowledge-apis/cli',
        notes: '@lugemi/cli knowledge-* commands.',
      },
      {
        id: 'webhooks',
        name: 'Webhooks',
        status: 'partial',
        api: 'GET /v1/knowledge-apis/webhooks',
        notes: 'Event catalog + org signing secret via POST /v1/webhooks/signing-secret. Full knowledge webhook fanout deferred.',
      },
      {
        id: 'event-streaming',
        name: 'Event Streaming',
        status: 'deferred',
        api: null,
        notes: 'Kafka/Pulsar OS deferred — use webhooks + SSE tail.',
      },
      {
        id: 'developer-portal',
        name: 'Developer Portal',
        status: 'shipped',
        api: 'GET /v1/developer/overview',
        notes: 'Extends VL-127 /developers + this pack console.',
      },
      {
        id: 'openapi',
        name: 'OpenAPI',
        status: 'shipped',
        api: 'GET /v1/openapi.json',
        notes: 'Knowledge paths included in shared OpenAPI document.',
      },
      {
        id: 'sdk-generator',
        name: 'SDK Generator',
        status: 'deferred',
        api: null,
        notes: 'Multi-language OpenAPI codegen factory deferred.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: null,
        notes: 'docs/KNOWLEDGE_APIS.md + product docs under docs/.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/knowledge-apis/monitoring',
        notes: 'Honesty + deferred flags.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/knowledge-apis/analytics',
        notes: 'Pack usage audits (≠ VL-202 Knowledge Analytics).',
      },
    ] satisfies KnowledgeApisCapability[],
    honesty: {
      grpcOs: false,
      kafkaEventStreamingOs: false,
      sdkGeneratorOs: false,
      regeneratesDeveloperCloud: false,
      regeneratesVl062: false,
      extendsExistingKnowledgeApis: true,
      orgWorkspaceScoped: true,
      openapiSharedDocument: true,
    },
    links: {
      hub: '/knowledge-cloud',
      console: '/knowledge-apis',
      developers: '/developers',
      playground: '/playground',
      docs: '/docs',
      openapi: '/v1/openapi.json',
      graphql: '/graphql',
      webhookSigningSecret: 'POST /v1/webhooks/signing-secret',
      eventsStream: 'GET /v1/knowledge-apis/events/stream',
    },
  };
}
