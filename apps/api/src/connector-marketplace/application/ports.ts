/** Application ports for Connector Marketplace. */

export type ConnectorMarketplaceEngineBundle = ReturnType<
  import('../connector-marketplace.service').ConnectorMarketplaceService['engine']
>;

export interface ConnectorMarketplaceCatalogPort {
  engine: ConnectorMarketplaceEngineBundle;
}

export const CONNECTOR_MARKETPLACE_CATALOG_PORT = Symbol('CONNECTOR_MARKETPLACE_CATALOG_PORT');
