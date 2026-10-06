/** Application ports for Education Intelligence (VL-267). */

export type EducationIntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EducationIntelligenceEngineBundle = ReturnType<
  import('../education-intelligence.service').EducationIntelligenceService['engine']
>;

export interface EducationIntelligenceCatalogPort {
  engine(): EducationIntelligenceEngineBundle;
  listProducts(): EducationIntelligenceProductRow[];
}

export const EDUCATION_INTELLIGENCE_CATALOG_PORT = Symbol('EDUCATION_INTELLIGENCE_CATALOG_PORT');
