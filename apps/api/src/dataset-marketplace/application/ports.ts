/** Application ports for Dataset Marketplace (VL-252). */

export type DatasetMarketplaceEngineBundle = ReturnType<
  import('../dataset-marketplace.service').DatasetMarketplaceService['engine']
>;

export interface DatasetMarketplaceCatalogPort {
  engine(): DatasetMarketplaceEngineBundle;
}

export const DATASET_MARKETPLACE_CATALOG_PORT = Symbol('DATASET_MARKETPLACE_CATALOG_PORT');
