/** Application ports for Data Plane Cloud (VL-324). */

export type DataPlaneCloudProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type DataPlaneCloudEngineBundle = ReturnType<
  import('../data-plane-cloud.service').DataPlaneCloudService['products']
>;

export interface DataPlaneCloudCatalogPort {
  engine(): DataPlaneCloudEngineBundle;
  listProducts(): DataPlaneCloudProductRow[];
}

export const DATA_PLANE_CLOUD_CATALOG_PORT = Symbol('DATA_PLANE_CLOUD_CATALOG_PORT');
