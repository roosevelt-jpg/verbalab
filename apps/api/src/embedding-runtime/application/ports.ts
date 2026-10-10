/** Application ports for Embedding Runtime. */

export type EmbeddingRuntimeProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EmbeddingRuntimeEngineBundle = ReturnType<
  import('../embedding-runtime.service').EmbeddingRuntimeService['engine']
>;

export interface EmbeddingRuntimeCatalogPort {
  engine(): EmbeddingRuntimeEngineBundle;
  listProducts(): EmbeddingRuntimeProductRow[];
}

export const EMBEDDING_RUNTIME_CATALOG_PORT = Symbol('EMBEDDING_RUNTIME_CATALOG_PORT');
