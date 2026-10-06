/** Application ports for Trust Analytics. */

export type TrustAnalyticsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type TrustAnalyticsEngineBundle = ReturnType<
  import('../trust-analytics.service').TrustAnalyticsService['engine']
>;

export interface TrustAnalyticsCatalogPort {
  engine: TrustAnalyticsEngineBundle;
  listProducts: TrustAnalyticsProductRow[];
}

export const TRUST_ANALYTICS_CATALOG_PORT = Symbol('TRUST_ANALYTICS_CATALOG_PORT');
