/** Application ports for Platform Engineering Analytics. */

export type PlatformEngineeringAnalyticsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type PlatformEngineeringAnalyticsEngineBundle = ReturnType<
  import('../platform-engineering-analytics.service').PlatformEngineeringAnalyticsService['engine']
>;

export interface PlatformEngineeringAnalyticsCatalogPort {
  engine: PlatformEngineeringAnalyticsEngineBundle;
  listProducts: PlatformEngineeringAnalyticsProductRow[];
}

export const PLATFORM_ENGINEERING_ANALYTICS_CATALOG_PORT = Symbol('PLATFORM_ENGINEERING_ANALYTICS_CATALOG_PORT');
