/** Application ports for PromptOps Platform. */

export type PromptopsPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type PromptopsPlatformEngineBundle = ReturnType<
  import('../promptops-platform.service').PromptopsPlatformService['engine']
>;

export interface PromptopsPlatformCatalogPort {
  engine(): PromptopsPlatformEngineBundle;
  listProducts(): PromptopsPlatformProductRow[];
}

export const PROMPTOPS_PLATFORM_CATALOG_PORT = Symbol('PROMPTOPS_PLATFORM_CATALOG_PORT');
