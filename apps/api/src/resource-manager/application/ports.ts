/** Application ports for Resource Manager. */

export type ResourceManagerProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ResourceManagerEngineBundle = ReturnType<
  import('../resource-manager.service').ResourceManagerService['engine']
>;

export interface ResourceManagerCatalogPort {
  engine: ResourceManagerEngineBundle;
  listProducts: ResourceManagerProductRow[];
}

export const RESOURCE_MANAGER_CATALOG_PORT = Symbol('RESOURCE_MANAGER_CATALOG_PORT');
