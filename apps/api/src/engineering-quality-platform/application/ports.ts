/** Application ports for Engineering Quality Platform (VL-348). */

export type EngineeringQualityPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EngineeringQualityPlatformEngineBundle = ReturnType<
  import('../engineering-quality-platform.service').EngineeringQualityPlatformService['engine']
>;

export interface EngineeringQualityPlatformCatalogPort {
  engine(): EngineeringQualityPlatformEngineBundle;
  listProducts(): EngineeringQualityPlatformProductRow[];
}

export const ENGINEERING_QUALITY_PLATFORM_CATALOG_PORT = Symbol('ENGINEERING_QUALITY_PLATFORM_CATALOG_PORT');
