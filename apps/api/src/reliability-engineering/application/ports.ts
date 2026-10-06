/** Application ports for Reliability Engineering. */

export type ReliabilityEngineeringProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ReliabilityEngineeringEngineBundle = ReturnType<
  import('../reliability-engineering.service').ReliabilityEngineeringService['engine']
>;

export interface ReliabilityEngineeringCatalogPort {
  engine: ReliabilityEngineeringEngineBundle;
  listProducts: ReliabilityEngineeringProductRow[];
}

export const RELIABILITY_ENGINEERING_CATALOG_PORT = Symbol('RELIABILITY_ENGINEERING_CATALOG_PORT');
