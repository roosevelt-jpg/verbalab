/** Application ports for GitOps Platform (VL-306). */

export type GitopsPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GitopsPlatformEngineBundle = ReturnType<
  import('../gitops-platform.service').GitopsPlatformService['engine']
>;

export interface GitopsPlatformCatalogPort {
  engine(): GitopsPlatformEngineBundle;
  listProducts(): GitopsPlatformProductRow[];
}

export const GITOPS_PLATFORM_CATALOG_PORT = Symbol('GITOPS_PLATFORM_CATALOG_PORT');
