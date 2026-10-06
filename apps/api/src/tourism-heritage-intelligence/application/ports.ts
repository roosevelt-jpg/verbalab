/** Application ports for Tourism & Heritage Intelligence. */

export type TourismHeritageIntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type TourismHeritageIntelligenceEngineBundle = ReturnType<
  import('../tourism-heritage-intelligence.service').TourismHeritageIntelligenceService['engine']
>;

export interface TourismHeritageIntelligenceCatalogPort {
  engine(): TourismHeritageIntelligenceEngineBundle;
  listProducts(): TourismHeritageIntelligenceProductRow[];
}

export const TOURISM_HERITAGE_INTELLIGENCE_CATALOG_PORT = Symbol('TOURISM_HERITAGE_INTELLIGENCE_CATALOG_PORT');
