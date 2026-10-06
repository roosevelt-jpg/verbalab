/** Application ports for Enterprise Engineering System. */

export type EnterpriseEngineeringSystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EnterpriseEngineeringSystemEngineBundle = ReturnType<
  import('../enterprise-engineering-system.service').EnterpriseEngineeringSystemService['products']
>;

export interface EnterpriseEngineeringSystemCatalogPort {
  engine: EnterpriseEngineeringSystemEngineBundle;
  listProducts: EnterpriseEngineeringSystemProductRow[];
}

export const ENTERPRISE_ENGINEERING_SYSTEM_CATALOG_PORT = Symbol('ENTERPRISE_ENGINEERING_SYSTEM_CATALOG_PORT');
