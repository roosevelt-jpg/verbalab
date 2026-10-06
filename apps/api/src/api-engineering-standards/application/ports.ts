/** Application ports for API Engineering Standards. */

export type ApiEngineeringStandardsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ApiEngineeringStandardsEngineBundle = ReturnType<
  import('../api-engineering-standards.service').ApiEngineeringStandardsService['engine']
>;

export interface ApiEngineeringStandardsCatalogPort {
  engine(): ApiEngineeringStandardsEngineBundle;
  listProducts(): ApiEngineeringStandardsProductRow[];
}

export const API_ENGINEERING_STANDARDS_CATALOG_PORT = Symbol('API_ENGINEERING_STANDARDS_CATALOG_PORT');
