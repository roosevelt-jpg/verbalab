/** Application ports for Synthetic Data Platform. */

export type SyntheticDataPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type SyntheticDataPlatformEngineBundle = ReturnType<
  import('../synthetic-data-platform.service').SyntheticDataPlatformService['engine']
>;

export interface SyntheticDataPlatformCatalogPort {
  engine(): SyntheticDataPlatformEngineBundle;
  listProducts(): SyntheticDataPlatformProductRow[];
}

export const SYNTHETIC_DATA_PLATFORM_CATALOG_PORT = Symbol('SYNTHETIC_DATA_PLATFORM_CATALOG_PORT');
