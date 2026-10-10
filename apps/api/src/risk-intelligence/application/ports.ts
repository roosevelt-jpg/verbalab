/** Application ports for Risk Intelligence. */

export type RiskIntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type RiskIntelligenceEngineBundle = ReturnType<
  import('../risk-intelligence.service').RiskIntelligenceService['engine']
>;

export interface RiskIntelligenceCatalogPort {
  engine(): RiskIntelligenceEngineBundle;
  listProducts(): RiskIntelligenceProductRow[];
}

export const RISK_INTELLIGENCE_CATALOG_PORT = Symbol('RISK_INTELLIGENCE_CATALOG_PORT');
