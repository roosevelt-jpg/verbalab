/** Application ports for Database Engineering Standards (VL-351). */

export type DatabaseEngineeringStandardsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type DatabaseEngineeringStandardsEngineBundle = ReturnType<
  import('../database-engineering-standards.service').DatabaseEngineeringStandardsService['engine']
>;

export interface DatabaseEngineeringStandardsCatalogPort {
  engine(): DatabaseEngineeringStandardsEngineBundle;
  listProducts(): DatabaseEngineeringStandardsProductRow[];
}

export const DATABASE_ENGINEERING_STANDARDS_CATALOG_PORT = Symbol('DATABASE_ENGINEERING_STANDARDS_CATALOG_PORT');
