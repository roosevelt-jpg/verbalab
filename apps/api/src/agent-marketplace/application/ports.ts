/** Application ports for Agent Marketplace. */

export type AgentMarketplaceEngineBundle = ReturnType<
  import('../agent-marketplace.service').AgentMarketplaceService['engine']
>;

export interface AgentMarketplaceCatalogPort {
  engine(): AgentMarketplaceEngineBundle;
}

export const AGENT_MARKETPLACE_CATALOG_PORT = Symbol('AGENT_MARKETPLACE_CATALOG_PORT');
