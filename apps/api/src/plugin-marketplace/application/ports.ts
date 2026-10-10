/** Application ports for Plugin Marketplace. */

export type PluginMarketplaceEngineBundle = ReturnType<
  import('../plugin-marketplace.service').PluginMarketplaceService['engine']
>;

export interface PluginMarketplaceCatalogPort {
  engine(): PluginMarketplaceEngineBundle;
}

export const PLUGIN_MARKETPLACE_CATALOG_PORT = Symbol('PLUGIN_MARKETPLACE_CATALOG_PORT');
