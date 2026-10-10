/** Application ports for Infrastructure Engineering Standards. */

export type InfrastructureEngineeringStandardsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type InfrastructureEngineeringStandardsEngineBundle = ReturnType<
  import('../infrastructure-engineering-standards.service').InfrastructureEngineeringStandardsService['engine']
>;

export interface InfrastructureEngineeringStandardsCatalogPort {
  engine(): InfrastructureEngineeringStandardsEngineBundle;
  listProducts(): InfrastructureEngineeringStandardsProductRow[];
}

export const INFRASTRUCTURE_ENGINEERING_STANDARDS_CATALOG_PORT = Symbol('INFRASTRUCTURE_ENGINEERING_STANDARDS_CATALOG_PORT');
