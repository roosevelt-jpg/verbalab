/** Application ports for Patent & Innovation Platform. */

export type PatentInnovationPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type PatentInnovationPlatformEngineBundle = ReturnType<
  import('../patent-innovation-platform.service').PatentInnovationPlatformService['engine']
>;

export interface PatentInnovationPlatformCatalogPort {
  engine(): PatentInnovationPlatformEngineBundle;
  listProducts(): PatentInnovationPlatformProductRow[];
}

export const PATENT_INNOVATION_PLATFORM_CATALOG_PORT = Symbol('PATENT_INNOVATION_PLATFORM_CATALOG_PORT');
