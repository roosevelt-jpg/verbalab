export type VectorCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type VectorCapability = {
  id: string;
  name: string;
  status: VectorCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 49 → Vector Cloud. Hub over pgvector Knowledge — not Pinecone. */
export function vectorCloudCatalog() {
  return {
    product: 'Lugemi Vector Cloud',
    note:
      'Enterprise vector search over Postgres pgvector knowledge_chunks. Workspace = namespace; collection = knowledge. Not a managed vector DB OS (Pinecone/Weaviate/Qdrant parity deferred).',
    capabilities: [
      {
        id: 'vector-storage',
        name: 'Vector Storage',
        status: 'shipped',
        api: 'POST /v1/knowledge/documents',
        notes: 'Vectors stored on knowledge_chunks.embedding (vector(1536)).',
      },
      {
        id: 'semantic-search',
        name: 'Semantic Search',
        status: 'shipped',
        api: 'POST /v1/vector-cloud/search',
        notes: 'Embed query + cosine nearest neighbor.',
      },
      {
        id: 'nearest-neighbor',
        name: 'Nearest Neighbor Search',
        status: 'shipped',
        api: 'POST /v1/vector-cloud/search',
        notes: 'ORDER BY embedding <=> query (pgvector).',
      },
      {
        id: 'similarity-search',
        name: 'Similarity Search',
        status: 'shipped',
        api: 'POST /v1/vector-cloud/search',
        notes: 'Cosine similarity score = 1 - distance; optional minScore.',
      },
      {
        id: 'metadata-filter',
        name: 'Metadata Search / Filtering',
        status: 'partial',
        api: 'POST /v1/vector-cloud/search',
        notes: 'Filter by documentId. Arbitrary JSON metadata filters deferred.',
      },
      {
        id: 'namespaces',
        name: 'Namespaces',
        status: 'shipped',
        api: 'GET /v1/vector-cloud/namespaces',
        notes: 'Workspace id is the tenant namespace.',
      },
      {
        id: 'collections',
        name: 'Collections',
        status: 'partial',
        api: 'GET /v1/vector-cloud/collections',
        notes: 'Single knowledge collection per workspace today.',
      },
      {
        id: 'index-management',
        name: 'Index Management',
        status: 'partial',
        api: 'GET /v1/vector-cloud/indexes',
        notes: 'HNSW cosine index from migration — create/drop API deferred.',
      },
      {
        id: 'hybrid-search',
        name: 'Hybrid Search',
        status: 'deferred',
        api: null,
        notes: 'Dense+sparse / BM25 hybrid deferred.',
      },
      {
        id: 'sharding',
        name: 'Sharding',
        status: 'deferred',
        api: null,
        notes: 'Managed cluster sharding deferred — use Postgres scale path.',
      },
      {
        id: 'replication',
        name: 'Replication',
        status: 'deferred',
        api: null,
        notes: 'Vector-specific replication product deferred — Postgres HA.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/vector-cloud/analytics',
        notes: 'Search audit + vector inventory counts.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/vector-cloud/monitoring',
        notes: 'Snapshot + shared request IDs.',
      },
    ] satisfies VectorCapability[],
    honesty: {
      managedVectorDbOs: false,
      pineconeParity: false,
      hybridBm25: false,
      customSharding: false,
    },
    links: {
      console: '/vector-cloud',
      hub: '/intelligence-cloud',
      knowledge: '/knowledge',
      embeddings: '/embedding-cloud',
      search: 'POST /v1/vector-cloud/search',
      rag: 'POST /v1/knowledge/query',
      openapi: '/v1/openapi.json',
      docs: '/docs/VECTOR_CLOUD.md',
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
      backend: 'pgvector',
      dimensions: 1536,
      metric: 'cosine',
      indexType: 'hnsw',
    },
  };
}
