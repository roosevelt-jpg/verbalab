/**
 * Embedding Runtime.
 * Embedding Runtime. Thin layer over embeddings / embedding-cloud — routes vector encode/batch; does not reimplement embedding models.
 */
export function embeddingRuntimeEngineCatalog() {
  return {
    product: 'Lugemi Embedding Runtime',
    thinExecutionLayer: true,
    duplicatesProductLogic: false,
    capabilities: [
      { id: 'encode', name: 'Encode Routing', status: 'shipped', notes: ' routing capability — not a new engine.' },
      { id: 'batch', name: 'Batch Embedding Routing', status: 'shipped', notes: ' routing capability — not a new engine.' },
      { id: 'multilingual', name: 'Multilingual Embedding Routing', status: 'shipped', notes: ' routing capability — not a new engine.' },
      { id: 'retrieval', name: 'Retrieval Embedding Routing', status: 'shipped', notes: ' routing capability — not a new engine.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'embeddings',
        path: '/v1/embeddings',
        role: 'Embeddings API',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      },
      {
        id: 'route-2',
        module: 'embedding-cloud',
        path: '/v1/embedding-cloud/engine',
        role: 'Embedding Cloud',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      }
    ],
    routesTo: [
      { module: 'embeddings', path: '/v1/embeddings', role: 'Embeddings API' },
      { module: 'embedding-cloud', path: '/v1/embedding-cloud/engine', role: 'Embedding Cloud' }
    ],
    honesty: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      controlPlaneSeparation: true,
      regeneratesVolumes1to17: false,
      integratesExistingSystems: true,
      reimplementsEmbeddingModels: false,
    },
    safety: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      note: 'Embedding Runtime. Thin layer over embeddings / embedding-cloud — routes vector encode/batch; does not reimplement embedding models.',
    },
    docs: '/docs/EMBEDDING_RUNTIME.md',
    note: 'Embedding Runtime. Thin layer over embeddings / embedding-cloud — routes vector encode/batch; does not reimplement embedding models.',
  };
}
