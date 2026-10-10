/** Application ports for Government Intelligence. */

export type GovernmentIntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GovernmentIntelligenceEngineBundle = ReturnType<
  import('../government-intelligence.service').GovernmentIntelligenceService['engine']
>;

export interface GovernmentIntelligenceCatalogPort {
  engine(): GovernmentIntelligenceEngineBundle;
  listProducts(): GovernmentIntelligenceProductRow[];
}

export const GOVERNMENT_INTELLIGENCE_CATALOG_PORT = Symbol('GOVERNMENT_INTELLIGENCE_CATALOG_PORT');
