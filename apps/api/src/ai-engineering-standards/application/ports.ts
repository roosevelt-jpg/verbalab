/** Application ports for AI Engineering Standards. */

export type AiEngineeringStandardsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiEngineeringStandardsEngineBundle = ReturnType<
  import('../ai-engineering-standards.service').AiEngineeringStandardsService['engine']
>;

export interface AiEngineeringStandardsCatalogPort {
  engine(): AiEngineeringStandardsEngineBundle;
  listProducts(): AiEngineeringStandardsProductRow[];
}

export const AI_ENGINEERING_STANDARDS_CATALOG_PORT = Symbol('AI_ENGINEERING_STANDARDS_CATALOG_PORT');
