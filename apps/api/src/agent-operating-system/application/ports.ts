/** Application ports for Agent Operating System. */

export type AgentOperatingSystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AgentOperatingSystemEngineBundle = ReturnType<
  import('../agent-operating-system.service').AgentOperatingSystemService['engine']
>;

export interface AgentOperatingSystemCatalogPort {
  engine: AgentOperatingSystemEngineBundle;
  listProducts: AgentOperatingSystemProductRow[];
}

export const AGENT_OPERATING_SYSTEM_CATALOG_PORT = Symbol('AGENT_OPERATING_SYSTEM_CATALOG_PORT');
