/** Application ports for Supply Chain Security. */

export type SupplyChainSecurityProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type SupplyChainSecurityEngineBundle = ReturnType<
  import('../supply-chain-security.service').SupplyChainSecurityService['engine']
>;

export interface SupplyChainSecurityCatalogPort {
  engine(): SupplyChainSecurityEngineBundle;
  listProducts(): SupplyChainSecurityProductRow[];
}

export const SUPPLY_CHAIN_SECURITY_CATALOG_PORT = Symbol('SUPPLY_CHAIN_SECURITY_CATALOG_PORT');
