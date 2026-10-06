/**
 * Library Phase 196 → Knowledge Runtime (VL-329).
 * Knowledge Runtime (VL-329). Thin layer over knowledge-cloud / knowledge / knowledge-fabric — routes search/graph/RAG/semantic/ontology.
 */
export function knowledgeRuntimeEngineCatalog() {
  return {
    product: 'Lugemi Knowledge Runtime',
    thinExecutionLayer: true,
    duplicatesProductLogic: false,
    capabilities: [
      { id: 'search', name: 'Knowledge Search Routing', status: 'shipped', notes: 'VL-329 routing capability — not a new engine.' },
      { id: 'graph', name: 'Knowledge Graph Routing', status: 'shipped', notes: 'VL-329 routing capability — not a new engine.' },
      { id: 'rag', name: 'RAG Routing', status: 'shipped', notes: 'VL-329 routing capability — not a new engine.' },
      { id: 'semantic', name: 'Semantic Retrieval Routing', status: 'shipped', notes: 'VL-329 routing capability — not a new engine.' },
      { id: 'ontology', name: 'Ontology Routing', status: 'shipped', notes: 'VL-329 routing capability — not a new engine.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'knowledge-cloud',
        path: '/v1/knowledge-cloud/products',
        role: 'Knowledge Cloud',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      },
      {
        id: 'route-2',
        module: 'knowledge',
        path: '/v1/knowledge',
        role: 'Knowledge',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      },
      {
        id: 'route-3',
        module: 'knowledge-fabric',
        path: '/v1/knowledge-fabric',
        role: 'Knowledge Fabric',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      }
    ],
    routesTo: [
      { module: 'knowledge-cloud', path: '/v1/knowledge-cloud/products', role: 'Knowledge Cloud' },
      { module: 'knowledge', path: '/v1/knowledge', role: 'Knowledge' },
      { module: 'knowledge-fabric', path: '/v1/knowledge-fabric', role: 'Knowledge Fabric' }
    ],
    honesty: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      controlPlaneSeparation: true,
      regeneratesVolumes1to17: false,
      integratesExistingSystems: true,
      reimplementsRag: false,
    },
    safety: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      note: 'Knowledge Runtime (VL-329). Thin layer over knowledge-cloud / knowledge / knowledge-fabric — routes search/graph/RAG/semantic/ontology.',
    },
    docs: '/docs/KNOWLEDGE_RUNTIME.md',
    note: 'Knowledge Runtime (VL-329). Thin layer over knowledge-cloud / knowledge / knowledge-fabric — routes search/graph/RAG/semantic/ontology.',
  };
}
