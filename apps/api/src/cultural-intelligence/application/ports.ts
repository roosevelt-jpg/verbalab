/** Application ports for Cultural Intelligence. */

export type CulturalIntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type CulturalIntelligenceEngineBundle = ReturnType<
  import('../cultural-intelligence.service').CulturalIntelligenceService['engine']
>;

export interface CulturalIntelligenceCatalogPort {
  engine(): CulturalIntelligenceEngineBundle;
  listProducts(): CulturalIntelligenceProductRow[];
}

export const CULTURAL_INTELLIGENCE_CATALOG_PORT = Symbol('CULTURAL_INTELLIGENCE_CATALOG_PORT');
