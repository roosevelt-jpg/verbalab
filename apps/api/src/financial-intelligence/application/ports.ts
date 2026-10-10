/** Application ports for Financial Intelligence. */

export type FinancialIntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type FinancialIntelligenceEngineBundle = ReturnType<
  import('../financial-intelligence.service').FinancialIntelligenceService['engine']
>;

export interface FinancialIntelligenceCatalogPort {
  engine(): FinancialIntelligenceEngineBundle;
  listProducts(): FinancialIntelligenceProductRow[];
}

export const FINANCIAL_INTELLIGENCE_CATALOG_PORT = Symbol('FINANCIAL_INTELLIGENCE_CATALOG_PORT');
