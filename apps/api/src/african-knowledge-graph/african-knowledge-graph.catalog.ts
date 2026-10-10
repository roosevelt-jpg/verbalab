
export type GraphNodeKind = 'country' | 'region' | 'language' | 'institution' | 'domain';

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  props: Record<string, string>;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  rel: string;
};

/**
 * African Knowledge Graph.
 * In-process entity/relationship graph. neo4jOs=false.
 */
export function africanKnowledgeGraphSeed(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    { id: 'country:ke', kind: 'country', label: 'Kenya', props: { iso2: 'KE' } },
    { id: 'country:ng', kind: 'country', label: 'Nigeria', props: { iso2: 'NG' } },
    { id: 'country:et', kind: 'country', label: 'Ethiopia', props: { iso2: 'ET' } },
    { id: 'country:za', kind: 'country', label: 'South Africa', props: { iso2: 'ZA' } },
    { id: 'country:sn', kind: 'country', label: 'Senegal', props: { iso2: 'SN' } },
    { id: 'region:east-africa', kind: 'region', label: 'East Africa', props: {} },
    { id: 'region:west-africa', kind: 'region', label: 'West Africa', props: {} },
    { id: 'region:horn', kind: 'region', label: 'Horn of Africa', props: {} },
    { id: 'region:southern-africa', kind: 'region', label: 'Southern Africa', props: {} },
    { id: 'lang:sw', kind: 'language', label: 'Swahili', props: { code: 'sw' } },
    { id: 'lang:yo', kind: 'language', label: 'Yoruba', props: { code: 'yo' } },
    { id: 'lang:am', kind: 'language', label: 'Amharic', props: { code: 'am' } },
    { id: 'lang:zu', kind: 'language', label: 'Zulu', props: { code: 'zu' } },
    {
      id: 'inst:au',
      kind: 'institution',
      label: 'African Union',
      props: { type: 'continental' },
    },
    {
      id: 'inst:who-afro',
      kind: 'institution',
      label: 'WHO AFRO',
      props: { type: 'health' },
    },
    { id: 'domain:gov', kind: 'domain', label: 'Government', props: { engine: 'government-intelligence' } },
    { id: 'domain:health', kind: 'domain', label: 'Healthcare', props: { engine: 'healthcare-intelligence' } },
    { id: 'domain:finance', kind: 'domain', label: 'Finance', props: { engine: 'financial-intelligence' } },
  ];
  const edges: GraphEdge[] = [
    { id: 'e1', from: 'country:ke', to: 'region:east-africa', rel: 'in_region' },
    { id: 'e2', from: 'country:ng', to: 'region:west-africa', rel: 'in_region' },
    { id: 'e3', from: 'country:et', to: 'region:horn', rel: 'in_region' },
    { id: 'e4', from: 'country:za', to: 'region:southern-africa', rel: 'in_region' },
    { id: 'e5', from: 'country:sn', to: 'region:west-africa', rel: 'in_region' },
    { id: 'e6', from: 'lang:sw', to: 'region:east-africa', rel: 'spoken_in' },
    { id: 'e7', from: 'lang:yo', to: 'country:ng', rel: 'spoken_in' },
    { id: 'e8', from: 'lang:am', to: 'country:et', rel: 'spoken_in' },
    { id: 'e9', from: 'lang:zu', to: 'country:za', rel: 'spoken_in' },
    { id: 'e10', from: 'inst:au', to: 'domain:gov', rel: 'related_domain' },
    { id: 'e11', from: 'inst:who-afro', to: 'domain:health', rel: 'related_domain' },
    { id: 'e12', from: 'domain:finance', to: 'region:west-africa', rel: 'focus_region' },
  ];
  return { nodes, edges };
}

export function africanKnowledgeGraphEngineCatalog() {
  const { nodes, edges } = africanKnowledgeGraphSeed();
  return {
    product: 'Lugemi African Knowledge Graph',
    note:
      'African Knowledge Graph. In-process entity/relationship graph for countries/regions/languages/institutions. neo4jOs=false — not a Neo4j / graph-database OS.',
    capabilities: [
      {
        id: 'nodes',
        name: 'Nodes',
        status: 'shipped',
        api: 'GET /v1/african-knowledge-graph/nodes',
        notes: 'List seeded graph nodes.',
      },
      {
        id: 'edges',
        name: 'Edges',
        status: 'shipped',
        api: 'GET /v1/african-knowledge-graph/edges',
        notes: 'List seeded relationships.',
      },
      {
        id: 'query',
        name: 'Query',
        status: 'shipped',
        api: 'GET /v1/african-knowledge-graph/query',
        notes: 'Filter nodes by kind/label — in-process only.',
      },
    ],
    stats: { nodeCount: nodes.length, edgeCount: edges.length },
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      neo4jOs: false,
      regeneratesPriorLayers: false,
      inProcessGraph: true,
    },
    honesty: {
      neo4jOs: false,
      graphDatabaseOs: false,
      inProcessGraph: true,
      coverageComplete: false,
      regeneratesPriorLayers: false,
    },
    docs: '/docs/AFRICAN_KNOWLEDGE_GRAPH.md',
  };
}
