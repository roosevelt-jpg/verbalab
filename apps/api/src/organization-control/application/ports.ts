/** Application ports for Organization Control. */

export type OrganizationControlProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type OrganizationControlEngineBundle = ReturnType<
  import('../organization-control.service').OrganizationControlService['engine']
>;

export interface OrganizationControlCatalogPort {
  engine(): OrganizationControlEngineBundle;
  listProducts(): OrganizationControlProductRow[];
}

export const ORGANIZATION_CONTROL_CATALOG_PORT = Symbol('ORGANIZATION_CONTROL_CATALOG_PORT');
