export type KnowledgeProductStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeProductRow = {
  id: string;
  name: string;
  status: KnowledgeProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 60 product map (VL-193). Hub only — maps onto VL-062 RAG + Intelligence surfaces. */
export function knowledgeProductCatalog(): KnowledgeProductRow[] {
  return [
    {
      id: 'knowledge-cloud',
      name: 'VerbaLab Knowledge Cloud',
      status: 'shipped',
      api: 'GET /v1/knowledge-cloud/products',
      console: '/knowledge-cloud',
      notes:
        'Knowledge Cloud parent hub (VL-193). Enterprise knowledge products over VL-062 RAG + Intelligence — not a Confluence/SharePoint OS or Neo4j knowledge-graph platform.',
    },
    {
      id: 'enterprise-knowledge-base',
      name: 'Enterprise Knowledge Base',
      status: 'partial',
      api: 'GET /v1/knowledge-base/engine',
      console: '/knowledge-base',
      notes:
        'Org/workspace-scoped ingest over VL-062 (VL-194). Collections/tags/MD/HTML. Not Confluence OS; media/approval deferred.',
    },
    {
      id: 'enterprise-search',
      name: 'Enterprise Search',
      status: 'partial',
      api: 'GET /v1/enterprise-search/engine',
      console: '/enterprise-search',
      notes:
        'Keyword + semantic + light hybrid RRF (VL-195). Extends VL-062/Vector Cloud. Not Elastic/BM25 OS; image/voice deferred.',
    },
    {
      id: 'ontology-platform',
      name: 'Ontology Platform',
      status: 'partial',
      api: 'GET /v1/ontology/engine',
      console: '/ontology',
      notes:
        'Concepts/hierarchies/synonyms over VL-184 KG (VL-196). Not OWL/Protege OS; vertical packs are domain tags.',
    },
    {
      id: 'taxonomy-platform',
      name: 'Taxonomy Platform',
      status: 'partial',
      api: 'GET /v1/taxonomy/engine',
      console: '/taxonomy',
      notes:
        'Categories/tags/trees + doc assign (VL-197). Not enterprise taxonomy OS; ML auto-class deferred.',
    },
    {
      id: 'enterprise-rag',
      name: 'Enterprise RAG Platform',
      status: 'partial',
      api: 'GET /v1/enterprise-rag/engine',
      console: '/enterprise-rag',
      notes:
        'Retrieve/chunk/cite/grounded query over VL-062 + hybrid search (VL-198). Not LangChain OS; hand-verify retrieval on real docs.',
    },
    {
      id: 'knowledge-memory',
      name: 'Knowledge Memory',
      status: 'partial',
      api: 'GET /v1/knowledge-memory/engine',
      console: '/knowledge-memory',
      notes:
        'Knowledge-layer memory over VL-183 (VL-199). Org/workspace/user/conversation/AI + evolve/versions. Not Mem0 OS; distinct from Memory Cloud hub.',
    },
    {
      id: 'knowledge-intelligence',
      name: 'Knowledge Intelligence',
      status: 'partial',
      api: 'GET /v1/knowledge-intelligence/engine',
      console: '/knowledge-intelligence',
      notes:
        'Discovery/link/recommend/validate/duplicates/confidence (VL-200). Heuristic over Knowledge Cloud; not BI/Palantir OS.',
    },
    {
      id: 'enterprise-knowledge-apis',
      name: 'Enterprise Knowledge APIs',
      status: 'partial',
      api: 'GET /v1/knowledge-apis/engine',
      console: '/knowledge-apis',
      notes:
        'Public API pack (VL-201): REST/GraphQL/OpenAPI/SDK/CLI/webhooks/SSE. Not gRPC/Kafka/SDK-generator OS.',
    },
    {
      id: 'knowledge-analytics',
      name: 'Knowledge Analytics',
      status: 'partial',
      api: 'GET /v1/knowledge-analytics/engine',
      console: '/knowledge-analytics',
      notes:
        'Growth/usage/quality/search/gaps/confidence/relationships (VL-202). ≠ Language/Speech/Voice/Intelligence analytics; not BI OS.',
    },
    {
      id: 'knowledge-graph-bridge',
      name: 'Knowledge Graph (Intelligence)',
      status: 'partial',
      api: 'GET /v1/knowledge-graph/engine',
      console: '/knowledge-graph',
      notes:
        'Bounded ER from VL-184 — linked here, not regenerated. Prefer RAG; Neo4j OS deferred.',
    },
    {
      id: 'document-intelligence',
      name: 'Document Intelligence',
      status: 'partial',
      api: 'POST /v1/knowledge/documents',
      console: '/knowledge',
      notes: 'Upload/chunk/embed via VL-062. Deep doc-AI (OCR/layout/tables) deferred with KB phases.',
    },
  ];
}

export function knowledgeArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_knowledge_cloud_hub',
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
    sdk: '@verbalab/sdk',
    cli: '@verbalab/cli',
    docker: true,
    terraform: true,
    kubernetes: true,
    primaryRegion: 'af-south-1',
    deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    billing: true,
    monitoring: true,
    enterpriseKnowledgeOs: false,
    ontologyOs: false,
    regeneratesVl062: false,
    extendsVl062: true,
    extendsIntelligenceCloud: true,
    tenantScopedKnowledge: true,
    pgvector: true,
    neo4jParity: false,
  };
}
