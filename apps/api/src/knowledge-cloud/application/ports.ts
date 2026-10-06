/** Application ports for Knowledge Cloud. Implemented by Nest adapters. */

export type KnowledgeProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type KnowledgeArchitectureNotes = ReturnType<
  typeof import('../knowledge-products.catalog').knowledgeArchitectureNotes
>;

export type KnowledgeProductsBundle = {
  products: KnowledgeProductRow[];
  architecture: KnowledgeArchitectureNotes;
  docs: string;
};

export interface KnowledgeCatalogPort {
  products(): KnowledgeProductsBundle;
  listProducts(): KnowledgeProductRow[];
}

export const KNOWLEDGE_CATALOG_PORT = Symbol('KNOWLEDGE_CATALOG_PORT');
