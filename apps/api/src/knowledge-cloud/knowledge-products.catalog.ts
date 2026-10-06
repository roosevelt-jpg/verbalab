export type KnowledgeProductStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeProductRow = {
  id: string;
  name: string;
  status: KnowledgeProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 60 product map. Hub only — maps onto RAG + Intelligence surfaces. */
export function knowledgeProductCatalog: KnowledgeProductRow[] {
  return [
    {
      id: 'knowledge-cloud',
      name: 'Lugemi Knowledge Cloud',
      status: 'shipped',
      api: 'GET /v1/knowledge-cloud/products',
      console: '/knowledge-cloud',
      notes:
        'Knowledge Cloud parent hub. Enterprise knowledge products over existing RAG + Intelligence — not a Confluence/SharePoint OS or Neo4j knowledge-graph platform.',
    },
    {
      id: 'enterprise-knowledge-base',
      name: 'Enterprise Knowledge Base',
      status: 'partial',
      api: 'GET /v1/knowledge-base/engine',
      console: '/knowledge-base',
      notes:
        'Org/workspace-scoped ingest over existing. Collections/tags/MD/HTML. Not Confluence OS; media/approval deferred.',
    },
    {
      id: 'enterprise-search',
      name: 'Enterprise Search',
      status: 'partial',
      api: 'GET /v1/enterprise-search/engine',
      console: '/enterprise-search',
      notes:
        'Keyword + semantic + light hybrid RRF. Extends Vector Cloud. Not Elastic/BM25 OS; image/voice deferred.',
    },
    {
      id: 'ontology-platform',
      name: 'Ontology Platform',
      status: 'partial',
      api: 'GET /v1/ontology/engine',
      console: '/ontology',
      notes:
        'Concepts/hierarchies/synonyms over existing KG. Not OWL/Protege OS; vertical packs are domain tags.',
    },
    {
      id: 'taxonomy-platform',
      name: 'Taxonomy Platform',
      status: 'partial',
      api: 'GET /v1/taxonomy/engine',
      console: '/taxonomy',
      notes:
        'Categories/tags/trees + doc assign. Not enterprise taxonomy OS; ML auto-class deferred.',
    },
    {
      id: 'enterprise-rag',
      name: 'Enterprise RAG Platform',
      status: 'partial',
      api: 'GET /v1/enterprise-rag/engine',
      console: '/enterprise-rag',
      notes:
        'Retrieve/chunk/cite/grounded query over hybrid search. Not LangChain OS; hand-verify retrieval on real docs.',
    },
    {
      id: 'knowledge-memory',
      name: 'Knowledge Memory',
      status: 'partial',
      api: 'GET /v1/knowledge-memory/engine',
      console: '/knowledge-memory',
      notes:
        'Knowledge-layer memory over existing. Org/workspace/user/conversation/AI + evolve/versions. Not Mem0 OS; distinct from Memory Cloud hub.',
    },
    {
      id: 'knowledge-intelligence',
      name: 'Knowledge Intelligence',
      status: 'partial',
      api: 'GET /v1/knowledge-intelligence/engine',
      console: '/knowledge-intelligence',
      notes:
        'Discovery/link/recommend/validate/duplicates/confidence. Heuristic over Knowledge Cloud; not BI/Palantir OS.',
    },
    {
      id: 'enterprise-knowledge-apis',
      name: 'Enterprise Knowledge APIs',
      status: 'partial',
      api: 'GET /v1/knowledge-apis/engine',
      console: '/knowledge-apis',
      notes:
        'Public API pack: REST/GraphQL/OpenAPI/SDK/CLI/webhooks/SSE. Not gRPC/Kafka/SDK-generator OS.',
    },
    {
      id: 'knowledge-analytics',
      name: 'Knowledge Analytics',
      status: 'partial',
      api: 'GET /v1/knowledge-analytics/engine',
      console: '/knowledge-analytics',
      notes:
        'Growth/usage/quality/search/gaps/confidence/relationships. ≠ Language/Speech/Voice/Intelligence analytics; not BI OS.',
    },
    {
      id: 'knowledge-graph-bridge',
      name: 'Knowledge Graph (Intelligence)',
      status: 'partial',
      api: 'GET /v1/knowledge-graph/engine',
      console: '/knowledge-graph',
      notes:
        'Bounded ER from — linked here, not regenerated. Prefer RAG; Neo4j OS deferred.',
    },
    {
      id: 'document-intelligence',
      name: 'Document Intelligence',
      status: 'partial',
      api: 'POST /v1/knowledge/documents',
      console: '/knowledge',
      notes: 'Upload/chunk/embed via existing. Deep doc-AI (OCR/layout/tables) deferred with KB phases.',
    },
  ];
}

export function knowledgeArchitectureNotes {
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
    sdk: '@lugemi/sdk',
    cli: '@lugemi/cli',
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
