/** Application ports for Runtime Manager. */

export type RuntimeManagerProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type RuntimeManagerEngineBundle = ReturnType<
  import('../runtime-manager.service').RuntimeManagerService['engine']
>;

export interface RuntimeManagerCatalogPort {
  engine: RuntimeManagerEngineBundle;
  listProducts: RuntimeManagerProductRow[];
}

export const RUNTIME_MANAGER_CATALOG_PORT = Symbol('RUNTIME_MANAGER_CATALOG_PORT');
