/** Application ports for Architecture Governance. */

export type ArchitectureGovernanceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ArchitectureGovernanceEngineBundle = ReturnType<
  import('../architecture-governance.service').ArchitectureGovernanceService['engine']
>;

export interface ArchitectureGovernanceCatalogPort {
  engine: ArchitectureGovernanceEngineBundle;
  listProducts: ArchitectureGovernanceProductRow[];
}

export const ARCHITECTURE_GOVERNANCE_CATALOG_PORT = Symbol('ARCHITECTURE_GOVERNANCE_CATALOG_PORT');
