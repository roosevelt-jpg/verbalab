/** Application ports for RAGOps Platform. */

export type RagopsPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type RagopsPlatformEngineBundle = ReturnType<
  import('../ragops-platform.service').RagopsPlatformService['engine']
>;

export interface RagopsPlatformCatalogPort {
  engine: RagopsPlatformEngineBundle;
  listProducts: RagopsPlatformProductRow[];
}

export const RAGOPS_PLATFORM_CATALOG_PORT = Symbol('RAGOPS_PLATFORM_CATALOG_PORT');
