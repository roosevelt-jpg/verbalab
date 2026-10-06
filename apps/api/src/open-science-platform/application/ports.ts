/** Application ports for Open Science Platform. */

export type OpenSciencePlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type OpenSciencePlatformEngineBundle = ReturnType<
  import('../open-science-platform.service').OpenSciencePlatformService['engine']
>;

export interface OpenSciencePlatformCatalogPort {
  engine(): OpenSciencePlatformEngineBundle;
  listProducts(): OpenSciencePlatformProductRow[];
}

export const OPEN_SCIENCE_PLATFORM_CATALOG_PORT = Symbol('OPEN_SCIENCE_PLATFORM_CATALOG_PORT');
