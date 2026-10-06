/** Application ports for Research Analytics. */

export type ResearchAnalyticsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ResearchAnalyticsEngineBundle = ReturnType<
  import('../research-analytics.service').ResearchAnalyticsService['engine']
>;

export interface ResearchAnalyticsCatalogPort {
  engine(): ResearchAnalyticsEngineBundle;
  listProducts(): ResearchAnalyticsProductRow[];
}

export const RESEARCH_ANALYTICS_CATALOG_PORT = Symbol('RESEARCH_ANALYTICS_CATALOG_PORT');
