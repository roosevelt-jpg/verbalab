/** Application ports for FinOps Platform. */

export type FinopsPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type FinopsPlatformEngineBundle = ReturnType<
  import('../finops-platform.service').FinopsPlatformService['engine']
>;

export interface FinopsPlatformCatalogPort {
  engine(): FinopsPlatformEngineBundle;
  listProducts(): FinopsPlatformProductRow[];
}

export const FINOPS_PLATFORM_CATALOG_PORT = Symbol('FINOPS_PLATFORM_CATALOG_PORT');
