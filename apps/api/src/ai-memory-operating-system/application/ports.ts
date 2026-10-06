/** Application ports for AI Memory Operating System. */

export type AiMemoryOperatingSystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiMemoryOperatingSystemEngineBundle = ReturnType<
  import('../ai-memory-operating-system.service').AiMemoryOperatingSystemService['engine']
>;

export interface AiMemoryOperatingSystemCatalogPort {
  engine: AiMemoryOperatingSystemEngineBundle;
  listProducts: AiMemoryOperatingSystemProductRow[];
}

export const AI_MEMORY_OPERATING_SYSTEM_CATALOG_PORT = Symbol('AI_MEMORY_OPERATING_SYSTEM_CATALOG_PORT');
