/** Application ports for AI Governance Platform. */

export type AiGovernancePlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiGovernancePlatformEngineBundle = ReturnType<
  import('../ai-governance-platform.service').AiGovernancePlatformService['engine']
>;

export interface AiGovernancePlatformCatalogPort {
  engine: AiGovernancePlatformEngineBundle;
  listProducts: AiGovernancePlatformProductRow[];
}

export const AI_GOVERNANCE_PLATFORM_CATALOG_PORT = Symbol('AI_GOVERNANCE_PLATFORM_CATALOG_PORT');
