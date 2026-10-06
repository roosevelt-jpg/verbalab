/** Application ports for Ecosystem Cloud Foundation. */

export type EcosystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EcosystemProductsBundle = ReturnType<
  import('../ecosystem-cloud.service').EcosystemCloudService['products']
>;

export interface EcosystemCatalogPort {
  products(): EcosystemProductsBundle;
  listProducts(): EcosystemProductRow[];
}

export const ECOSYSTEM_CATALOG_PORT = Symbol('ECOSYSTEM_CATALOG_PORT');
