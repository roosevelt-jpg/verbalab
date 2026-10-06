/** Application ports for Control Plane Analytics (VL-322). */

export type ControlPlaneAnalyticsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ControlPlaneAnalyticsEngineBundle = ReturnType<
  import('../control-plane-analytics.service').ControlPlaneAnalyticsService['engine']
>;

export interface ControlPlaneAnalyticsCatalogPort {
  engine(): ControlPlaneAnalyticsEngineBundle;
  listProducts(): ControlPlaneAnalyticsProductRow[];
}

export const CONTROL_PLANE_ANALYTICS_CATALOG_PORT = Symbol('CONTROL_PLANE_ANALYTICS_CATALOG_PORT');
