/** Application ports for Service Catalog. */

export type ServiceCatalogProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ServiceCatalogEngineBundle = ReturnType<
  import('../service-catalog.service').ServiceCatalogService['engine']
>;

export interface ServiceCatalogCatalogPort {
  engine: ServiceCatalogEngineBundle;
  listProducts: ServiceCatalogProductRow[];
}

export const SERVICE_CATALOG_CATALOG_PORT = Symbol('SERVICE_CATALOG_CATALOG_PORT');
