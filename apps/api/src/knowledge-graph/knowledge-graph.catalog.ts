export type KgCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type KgCapability = {
  id: string;
  name: string;
  status: KgCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 51 → Knowledge Graph Cloud (VL-184). Bounded ER layer — prefer RAG; not Neo4j OS. */
export function knowledgeGraphCatalog() {
  return {
    product: 'Lugemi Knowledge Graph Cloud',
    note:
      'Bounded entity/relationship layer in Postgres (VL-184). Prefer Knowledge/RAG (VL-062) for retrieval. Not Neo4j / ontology / taxonomy enterprise OS. Vertical domain graphs are catalog stubs.',
    capabilities: [
      {
        id: 'entities',
        name: 'Entities',
        status: 'shipped',
        api: 'POST /v1/knowledge-graph/entities',
        notes: 'Workspace-scoped typed entities with optional document link.',
      },
      {
        id: 'relationships',
        name: 'Relationships',
        status: 'shipped',
        api: 'POST /v1/knowledge-graph/relationships',
        notes: 'Directed edges between entities (1-hop neighborhood query).',
      },
      {
        id: 'knowledge-linking',
        name: 'Knowledge Linking',
        status: 'shipped',
        api: 'POST /v1/knowledge-graph/entities',
        notes: 'Optional documentId → Knowledge document (VL-062).',
      },
      {
        id: 'semantic-relationships',
        name: 'Semantic Relationships',
        status: 'partial',
        api: 'POST /v1/knowledge-graph/relationships',
        notes: 'Typed labels only. Embedding-inferred edges deferred.',
      },
      {
        id: 'ontologies',
        name: 'Ontologies',
        status: 'partial',
        api: 'GET /v1/ontology/engine',
        notes: 'Bounded Ontology Platform (VL-196) over this KG. Not OWL/Protege OS.',
      },
      {
        id: 'taxonomies',
        name: 'Taxonomies',
        status: 'partial',
        api: 'GET /v1/taxonomy/engine',
        notes: 'Bounded Taxonomy Platform (VL-197). Distinct from Ontology; not enterprise taxonomy OS.',
      },
      {
        id: 'enterprise-graph',
        name: 'Enterprise Graph',
        status: 'partial',
        api: 'GET /v1/knowledge-graph/domains',
        notes: 'General workspace graph shipped; enterprise ontology packs deferred.',
      },
      {
        id: 'government-graph',
        name: 'Government Graph',
        status: 'deferred',
        api: null,
        notes: 'Domain pack deferred — use general entities.',
      },
      {
        id: 'medical-graph',
        name: 'Medical Graph',
        status: 'deferred',
        api: null,
        notes: 'Domain pack deferred — use general entities.',
      },
      {
        id: 'legal-graph',
        name: 'Legal Graph',
        status: 'deferred',
        api: null,
        notes: 'Domain pack deferred — use general entities.',
      },
      {
        id: 'financial-graph',
        name: 'Financial Graph',
        status: 'deferred',
        api: null,
        notes: 'Domain pack deferred — use general entities.',
      },
      {
        id: 'educational-graph',
        name: 'Educational Graph',
        status: 'deferred',
        api: null,
        notes: 'Domain pack deferred — use general entities.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/knowledge-graph/analytics',
        notes: 'Entity/edge counts + write audits.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/knowledge-graph/monitoring',
        notes: 'Snapshot + deferred domain flags.',
      },
    ] satisfies KgCapability[],
    honesty: {
      neo4jParity: false,
      ontologyPlatform: true,
      ontologyOs: false,
      taxonomyPlatform: true,
      taxonomyOs: false,
      preferRag: true,
      verticalDomainPacks: false,
    },
    links: {
      console: '/knowledge-graph',
      hub: '/intelligence-cloud',
      ontology: '/ontology',
      taxonomy: '/taxonomy',
      knowledge: '/knowledge',
      vectorCloud: '/vector-cloud',
      rag: 'POST /v1/knowledge/query',
      openapi: '/v1/openapi.json',
      docs: '/docs/KNOWLEDGE_GRAPH.md',
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
      backend: 'postgres',
      graphVendor: null,
    },
  };
}

export const KG_DOMAINS = [
  { id: 'general', name: 'General / Enterprise', status: 'shipped' as const },
  { id: 'government', name: 'Government', status: 'deferred' as const },
  { id: 'medical', name: 'Medical', status: 'deferred' as const },
  { id: 'legal', name: 'Legal', status: 'deferred' as const },
  { id: 'financial', name: 'Financial', status: 'deferred' as const },
  { id: 'educational', name: 'Educational', status: 'deferred' as const },
];
