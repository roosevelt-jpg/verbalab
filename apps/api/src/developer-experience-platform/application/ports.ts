/** Application ports for Developer Experience Platform (VL-311). */

export type DeveloperExperiencePlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type DeveloperExperiencePlatformEngineBundle = ReturnType<
  import('../developer-experience-platform.service').DeveloperExperiencePlatformService['engine']
>;

export interface DeveloperExperiencePlatformCatalogPort {
  engine(): DeveloperExperiencePlatformEngineBundle;
  listProducts(): DeveloperExperiencePlatformProductRow[];
}

export const DEVELOPER_EXPERIENCE_PLATFORM_CATALOG_PORT = Symbol('DEVELOPER_EXPERIENCE_PLATFORM_CATALOG_PORT');
