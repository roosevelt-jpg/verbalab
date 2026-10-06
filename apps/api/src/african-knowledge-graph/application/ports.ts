/** Application ports for African Knowledge Graph. */

export type AfricanKnowledgeGraphProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AfricanKnowledgeGraphEngineBundle = ReturnType<
  import('../african-knowledge-graph.service').AfricanKnowledgeGraphService['engine']
>;

export interface AfricanKnowledgeGraphCatalogPort {
  engine: AfricanKnowledgeGraphEngineBundle;
  listProducts: AfricanKnowledgeGraphProductRow[];
}

export const AFRICAN_KNOWLEDGE_GRAPH_CATALOG_PORT = Symbol('AFRICAN_KNOWLEDGE_GRAPH_CATALOG_PORT');
