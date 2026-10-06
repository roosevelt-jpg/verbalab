/** Application ports for Knowledge Operating System. */

export type KnowledgeOperatingSystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type KnowledgeOperatingSystemEngineBundle = ReturnType<
  import('../knowledge-operating-system.service').KnowledgeOperatingSystemService['engine']
>;

export interface KnowledgeOperatingSystemCatalogPort {
  engine: KnowledgeOperatingSystemEngineBundle;
  listProducts: KnowledgeOperatingSystemProductRow[];
}

export const KNOWLEDGE_OPERATING_SYSTEM_CATALOG_PORT = Symbol('KNOWLEDGE_OPERATING_SYSTEM_CATALOG_PORT');
