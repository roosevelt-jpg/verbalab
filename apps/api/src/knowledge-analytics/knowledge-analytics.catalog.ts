export type KnowledgeAnalyticsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeAnalyticsCapability = {
  id: string;
  name: string;
  status: KnowledgeAnalyticsCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Knowledge Cloud audit action groups for surface usage. */
export const KNOWLEDGE_SURFACE_ACTIONS: Record<string, string[]> = {
  knowledge: ['knowledge.document_ready', 'knowledge.queried'],
  knowledge_base: ['knowledge_base.document_revise_meta'],
  enterprise_search: ['enterprise_search.searched'],
  enterprise_rag: ['enterprise_rag.retrieved', 'enterprise_rag.queried'],
  ontology: [
    'ontology.concept_created',
    'ontology.concept_deleted',
    'ontology.labels_updated',
    'ontology.hierarchy_created',
    'ontology.synonym_added',
  ],
  taxonomy: [
    'taxonomy.term_created',
    'taxonomy.term_deleted',
    'taxonomy.assigned',
    'taxonomy.classified',
  ],
  knowledge_memory: [
    'knowledge_memory.created',
    'knowledge_memory.evolved',
    'knowledge_memory.searched',
  ],
  knowledge_intelligence: [
    'knowledge_intelligence.discovered',
    'knowledge_intelligence.linked',
    'knowledge_intelligence.recommended',
    'knowledge_intelligence.validated',
    'knowledge_intelligence.duplicates',
    'knowledge_intelligence.confidence',
  ],
  knowledge_apis: ['knowledge_apis.surfaces', 'knowledge_apis.streamed'],
  knowledge_graph: [
    'knowledge_graph.entity_created',
    'knowledge_graph.entity_deleted',
    'knowledge_graph.relationship_created',
  ],
};

export const KNOWLEDGE_AUDIT_PREFIXES = [
  'knowledge.',
  'knowledge_base.',
  'enterprise_search.',
  'enterprise_rag.',
  'ontology.',
  'taxonomy.',
  'knowledge_memory.',
  'knowledge_intelligence.',
  'knowledge_apis.',
  'knowledge_graph.',
] as const;

/**
 * Knowledge Analytics.
 * Aggregates for Knowledge Cloud — not Language/Speech/Voice/Intelligence analytics or BI OS.
 */
export function knowledgeAnalyticsCatalog() {
  return {
    product: 'Lugemi Knowledge Analytics',
    note:
      'Usage/quality aggregates for Knowledge Cloud: growth, usage, quality, search success, gaps, confidence, relationships. Distinct from Language/Speech/Voice/Intelligence analytics. Not a BI dashboard OS or enterprise reporting suite.',
    capabilities: [
      {
        id: 'knowledge-growth',
        name: 'Knowledge Growth',
        status: 'shipped',
        api: 'GET /v1/knowledge-analytics/growth',
        notes: 'Document/chunk counts + period creates.',
      },
      {
        id: 'knowledge-usage',
        name: 'Knowledge Usage',
        status: 'shipped',
        api: 'GET /v1/knowledge-analytics/usage',
        notes: 'Knowledge Cloud audit surface aggregates.',
      },
      {
        id: 'knowledge-quality',
        name: 'Knowledge Quality',
        status: 'partial',
        api: 'GET /v1/knowledge-analytics/quality',
        notes: 'Ready/failed/chunk coverage proxies — not a human eval lab.',
      },
      {
        id: 'search-success',
        name: 'Search Success',
        status: 'partial',
        api: 'GET /v1/knowledge-analytics/search',
        notes: 'enterprise_search hit rates from audit metadata.',
      },
      {
        id: 'knowledge-gaps',
        name: 'Knowledge Gaps',
        status: 'partial',
        api: 'GET /v1/knowledge-analytics/gaps',
        notes: 'Unchunked/failed docs, zero-hit searches, unassigned docs.',
      },
      {
        id: 'knowledge-confidence',
        name: 'Knowledge Confidence',
        status: 'partial',
        api: 'GET /v1/knowledge-analytics/confidence',
        notes: 'Heuristic doc confidence averages — not calibrated models.',
      },
      {
        id: 'knowledge-relationships',
        name: 'Knowledge Relationships',
        status: 'shipped',
        api: 'GET /v1/knowledge-analytics/relationships',
        notes: 'KG entities/edges + taxonomy assignments + ontology concepts.',
      },
      {
        id: 'enterprise-reports',
        name: 'Enterprise Reports',
        status: 'deferred',
        api: null,
        notes: 'Scheduled PDF / BI suite deferred.',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'shipped',
        api: 'GET /v1/knowledge-analytics/report',
        notes: 'Bundled Knowledge Analytics JSON report.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/knowledge-analytics/monitoring',
        notes: 'Snapshot + honesty/deferred flags.',
      },
      {
        id: 'dashboard',
        name: 'Analytics Dashboard',
        status: 'partial',
        api: null,
        notes: 'Console /knowledge-analytics overview — not BI OS.',
      },
    ] satisfies KnowledgeAnalyticsCapability[],
    honesty: {
      regeneratesLanguageAnalytics: false,
      regeneratesSpeechAnalytics: false,
      regeneratesVoiceAnalytics: false,
      regeneratesIntelligenceAnalytics: false,
      biDashboardOs: false,
      enterpriseReportingSuite: false,
      aggregatesOnly: true,
      orgWorkspaceScoped: true,
      calibratedConfidence: false,
    },
    links: {
      console: '/knowledge-analytics',
      hub: '/knowledge-cloud',
      knowledgeApis: '/knowledge-apis',
      knowledgeIntelligence: '/knowledge-intelligence',
      enterpriseSearch: '/enterprise-search',
      intelligenceAnalytics: '/intelligence-analytics',
      languageAnalytics: '/analytics',
      speechAnalytics: '/speech-analytics',
      voiceAnalytics: '/voice-analytics',
      usage: '/usage',
      openapi: '/v1/openapi.json',
      docs: '/docs/KNOWLEDGE_ANALYTICS.md',
    },
  };
}
