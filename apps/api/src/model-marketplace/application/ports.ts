/** Application ports for Model Marketplace. */

export type ModelMarketplaceEngineBundle = ReturnType<
  import('../model-marketplace.service').ModelMarketplaceService['engine']
>;

export interface ModelMarketplaceCatalogPort {
  engine: ModelMarketplaceEngineBundle;
}

export const MODEL_MARKETPLACE_CATALOG_PORT = Symbol('MODEL_MARKETPLACE_CATALOG_PORT');
