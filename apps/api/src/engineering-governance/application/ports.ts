/** Application ports for Engineering Governance. */

export type EngineeringGovernanceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EngineeringGovernanceEngineBundle = ReturnType<
  import('../engineering-governance.service').EngineeringGovernanceService['engine']
>;

export interface EngineeringGovernanceCatalogPort {
  engine(): EngineeringGovernanceEngineBundle;
  listProducts(): EngineeringGovernanceProductRow[];
}

export const ENGINEERING_GOVERNANCE_CATALOG_PORT = Symbol('ENGINEERING_GOVERNANCE_CATALOG_PORT');
