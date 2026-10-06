/** Application ports for Healthcare Intelligence. */

export type HealthcareIntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type HealthcareIntelligenceEngineBundle = ReturnType<
  import('../healthcare-intelligence.service').HealthcareIntelligenceService['engine']
>;

export interface HealthcareIntelligenceCatalogPort {
  engine: HealthcareIntelligenceEngineBundle;
  listProducts: HealthcareIntelligenceProductRow[];
}

export const HEALTHCARE_INTELLIGENCE_CATALOG_PORT = Symbol('HEALTHCARE_INTELLIGENCE_CATALOG_PORT');
