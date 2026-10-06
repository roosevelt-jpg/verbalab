/** Application ports for Knowledge Runtime (VL-329). */

export type KnowledgeRuntimeProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type KnowledgeRuntimeEngineBundle = ReturnType<
  import('../knowledge-runtime.service').KnowledgeRuntimeService['engine']
>;

export interface KnowledgeRuntimeCatalogPort {
  engine(): KnowledgeRuntimeEngineBundle;
  listProducts(): KnowledgeRuntimeProductRow[];
}

export const KNOWLEDGE_RUNTIME_CATALOG_PORT = Symbol('KNOWLEDGE_RUNTIME_CATALOG_PORT');
