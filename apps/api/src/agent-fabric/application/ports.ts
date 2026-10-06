/** Application ports for Agent Fabric (VL-246). */

export type AgentFabricCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type AgentFabricRouteRow = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type AgentFabricProductsBundle = ReturnType<
  import('../agent-fabric.service').AgentFabricService['products']
>;

export interface AgentFabricCatalogPort {
  products(): AgentFabricProductsBundle;
  listCapabilities(): AgentFabricCapabilityRow[];
  listRoutes(): AgentFabricRouteRow[];
}

export const AGENT_FABRIC_CATALOG_PORT = Symbol('AGENT_FABRIC_CATALOG_PORT');
