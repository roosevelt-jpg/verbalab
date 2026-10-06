/** Application ports for Golden Path Platform (VL-305). */

export type GoldenPathPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GoldenPathPlatformEngineBundle = ReturnType<
  import('../golden-path-platform.service').GoldenPathPlatformService['engine']
>;

export interface GoldenPathPlatformCatalogPort {
  engine(): GoldenPathPlatformEngineBundle;
  listProducts(): GoldenPathPlatformProductRow[];
}

export const GOLDEN_PATH_PLATFORM_CATALOG_PORT = Symbol('GOLDEN_PATH_PLATFORM_CATALOG_PORT');
