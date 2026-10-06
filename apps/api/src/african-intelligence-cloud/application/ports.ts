/** Application ports for African Intelligence Cloud (VL-260). */

export type AfricanIntelligenceCloudProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AfricanIntelligenceCloudEngineBundle = ReturnType<
  import('../african-intelligence-cloud.service').AfricanIntelligenceCloudService['products']
>;

export interface AfricanIntelligenceCloudCatalogPort {
  engine(): AfricanIntelligenceCloudEngineBundle;
  listProducts(): AfricanIntelligenceCloudProductRow[];
}

export const AFRICAN_INTELLIGENCE_CLOUD_CATALOG_PORT = Symbol('AFRICAN_INTELLIGENCE_CLOUD_CATALOG_PORT');
