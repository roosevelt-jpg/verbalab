/** Application ports for AgentOps Platform (VL-287). */

export type AgentopsPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AgentopsPlatformEngineBundle = ReturnType<
  import('../agentops-platform.service').AgentopsPlatformService['engine']
>;

export interface AgentopsPlatformCatalogPort {
  engine(): AgentopsPlatformEngineBundle;
  listProducts(): AgentopsPlatformProductRow[];
}

export const AGENTOPS_PLATFORM_CATALOG_PORT = Symbol('AGENTOPS_PLATFORM_CATALOG_PORT');
