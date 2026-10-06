/** Application ports for Agricultural Intelligence (VL-268). */

export type AgriculturalIntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AgriculturalIntelligenceEngineBundle = ReturnType<
  import('../agricultural-intelligence.service').AgriculturalIntelligenceService['engine']
>;

export interface AgriculturalIntelligenceCatalogPort {
  engine(): AgriculturalIntelligenceEngineBundle;
  listProducts(): AgriculturalIntelligenceProductRow[];
}

export const AGRICULTURAL_INTELLIGENCE_CATALOG_PORT = Symbol('AGRICULTURAL_INTELLIGENCE_CATALOG_PORT');
