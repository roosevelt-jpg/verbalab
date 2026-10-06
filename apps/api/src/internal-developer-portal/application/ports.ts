/** Application ports for Internal Developer Portal. */

export type InternalDeveloperPortalProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type InternalDeveloperPortalEngineBundle = ReturnType<
  import('../internal-developer-portal.service').InternalDeveloperPortalService['engine']
>;

export interface InternalDeveloperPortalCatalogPort {
  engine: InternalDeveloperPortalEngineBundle;
  listProducts: InternalDeveloperPortalProductRow[];
}

export const INTERNAL_DEVELOPER_PORTAL_CATALOG_PORT = Symbol('INTERNAL_DEVELOPER_PORTAL_CATALOG_PORT');
