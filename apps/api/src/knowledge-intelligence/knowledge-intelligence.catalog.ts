export type KnowledgeIntelCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeIntelCapability = {
  id: string;
  name: string;
  status: KnowledgeIntelCapabilityStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 67 → Knowledge Intelligence (VL-200).
 * Combined knowledge analysis/insight over Knowledge Cloud surfaces — not a BI / Palantir OS.
 */
export function knowledgeIntelligenceCatalog() {
  return {
    product: 'VerbaLab Knowledge Intelligence',
    note:
      'Combined knowledge analysis and insight for Knowledge Cloud (VL-200): discovery, linking, recommendations, validation, duplicates, evolution, confidence. Heuristic over EKB / Search / Ontology / Taxonomy / Knowledge Memory / VL-062. Not a BI dashboard OS, Palantir-style knowledge OS, or Intelligence Analytics (VL-191) regenerate.',
    capabilities: [
      {
        id: 'knowledge-discovery',
        name: 'Knowledge Discovery',
        status: 'shipped',
        api: 'POST /v1/knowledge-intelligence/discover',
        notes: 'Find docs, taxonomy terms, and ontology concepts by text query (workspace-scoped).',
      },
      {
        id: 'knowledge-linking',
        name: 'Knowledge Linking',
        status: 'shipped',
        api: 'POST /v1/knowledge-intelligence/link',
        notes: 'Suggest related documents by collection/tags/filename tokens.',
      },
      {
        id: 'knowledge-recommendations',
        name: 'Knowledge Recommendations',
        status: 'partial',
        api: 'POST /v1/knowledge-intelligence/recommend',
        notes: 'Light rank of ready docs. Not collaborative-filtering / retail recommender OS.',
      },
      {
        id: 'knowledge-validation',
        name: 'Knowledge Validation',
        status: 'shipped',
        api: 'POST /v1/knowledge-intelligence/validate',
        notes: 'Ready/failed/empty-chunk checks on knowledge documents.',
      },
      {
        id: 'duplicate-detection',
        name: 'Duplicate Detection',
        status: 'partial',
        api: 'POST /v1/knowledge-intelligence/duplicates',
        notes: 'Filename + first-chunk prefix overlap. Near-dupe ML deferred.',
      },
      {
        id: 'knowledge-evolution',
        name: 'Knowledge Evolution',
        status: 'shipped',
        api: 'GET /v1/knowledge-intelligence/evolution',
        notes: 'Doc versions + Knowledge Memory evolution counts.',
      },
      {
        id: 'knowledge-confidence',
        name: 'Knowledge Confidence',
        status: 'partial',
        api: 'POST /v1/knowledge-intelligence/confidence',
        notes: 'Heuristic score from status/chunks/tags — not calibrated probabilistic model.',
      },
      {
        id: 'insight-overview',
        name: 'Insight overview',
        status: 'shipped',
        api: 'GET /v1/knowledge-intelligence/insight',
        notes: 'Workspace snapshot across knowledge surfaces.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/knowledge-intelligence/analytics',
        notes: 'Audit + inventory counts (≠ VL-202 Knowledge Analytics pack).',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/knowledge-intelligence/monitoring',
        notes: 'Honesty + deferred flags.',
      },
      {
        id: 'bi-os',
        name: 'BI / knowledge OS',
        status: 'deferred',
        api: null,
        notes: 'Enterprise BI / Palantir-style OS deferred.',
      },
    ] satisfies KnowledgeIntelCapability[],
    honesty: {
      biOs: false,
      palantirParity: false,
      mlNearDuplicate: false,
      calibratedConfidence: false,
      regeneratesIntelligenceAnalytics: false,
      regeneratesVl191: false,
      orgWorkspaceScoped: true,
      extendsKnowledgeCloud: true,
    },
    links: {
      hub: '/knowledge-cloud',
      console: '/knowledge-intelligence',
      knowledgeBase: '/knowledge-base',
      enterpriseSearch: '/enterprise-search',
      ontology: '/ontology',
      taxonomy: '/taxonomy',
      enterpriseRag: '/enterprise-rag',
      knowledgeMemory: '/knowledge-memory',
      knowledge: '/knowledge',
      intelligenceAnalytics: '/intelligence-analytics',
    },
  };
}
