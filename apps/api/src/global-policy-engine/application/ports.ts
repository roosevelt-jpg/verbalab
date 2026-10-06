/** Application ports for Global Policy Engine. */

export type GlobalPolicyEngineProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GlobalPolicyEngineEngineBundle = ReturnType<
  import('../global-policy-engine.service').GlobalPolicyEngineService['engine']
>;

export interface GlobalPolicyEngineCatalogPort {
  engine(): GlobalPolicyEngineEngineBundle;
  listProducts(): GlobalPolicyEngineProductRow[];
}

export const GLOBAL_POLICY_ENGINE_CATALOG_PORT = Symbol('GLOBAL_POLICY_ENGINE_CATALOG_PORT');
