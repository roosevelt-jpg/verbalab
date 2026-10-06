/** Application ports for Explainability Platform (VL-295). */

export type ExplainabilityPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ExplainabilityPlatformEngineBundle = ReturnType<
  import('../explainability-platform.service').ExplainabilityPlatformService['engine']
>;

export interface ExplainabilityPlatformCatalogPort {
  engine(): ExplainabilityPlatformEngineBundle;
  listProducts(): ExplainabilityPlatformProductRow[];
}

export const EXPLAINABILITY_PLATFORM_CATALOG_PORT = Symbol('EXPLAINABILITY_PLATFORM_CATALOG_PORT');
