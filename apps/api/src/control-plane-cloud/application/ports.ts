/** Application ports for Control Plane Cloud (VL-314). */

export type ControlPlaneCloudProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ControlPlaneCloudEngineBundle = ReturnType<
  import('../control-plane-cloud.service').ControlPlaneCloudService['products']
>;

export interface ControlPlaneCloudCatalogPort {
  engine(): ControlPlaneCloudEngineBundle;
  listProducts(): ControlPlaneCloudProductRow[];
}

export const CONTROL_PLANE_CLOUD_CATALOG_PORT = Symbol('CONTROL_PLANE_CLOUD_CATALOG_PORT');
