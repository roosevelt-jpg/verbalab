/** Application ports for Research Cloud. */

export type ResearchCloudProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ResearchCloudEngineBundle = ReturnType<
  import('../research-cloud.service').ResearchCloudService['products']
>;

export interface ResearchCloudCatalogPort {
  engine(): ResearchCloudEngineBundle;
  listProducts(): ResearchCloudProductRow[];
}

export const RESEARCH_CLOUD_CATALOG_PORT = Symbol('RESEARCH_CLOUD_CATALOG_PORT');
