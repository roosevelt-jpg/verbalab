/** Application ports for Platform Engineering Cloud. */

export type PlatformEngineeringCloudProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type PlatformEngineeringCloudEngineBundle = ReturnType<
  import('../platform-engineering-cloud.service').PlatformEngineeringCloudService['products']
>;

export interface PlatformEngineeringCloudCatalogPort {
  engine(): PlatformEngineeringCloudEngineBundle;
  listProducts(): PlatformEngineeringCloudProductRow[];
}

export const PLATFORM_ENGINEERING_CLOUD_CATALOG_PORT = Symbol('PLATFORM_ENGINEERING_CLOUD_CATALOG_PORT');
