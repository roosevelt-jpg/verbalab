/** Application ports for Memory Fabric. */

export type MemoryFabricCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type MemoryFabricRouteRow = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type MemoryFabricProductsBundle = ReturnType<
  import('../memory-fabric.service').MemoryFabricService['products']
>;

export interface MemoryFabricCatalogPort {
  products(): MemoryFabricProductsBundle;
  listCapabilities(): MemoryFabricCapabilityRow[];
  listRoutes(): MemoryFabricRouteRow[];
}

export const MEMORY_FABRIC_CATALOG_PORT = Symbol('MEMORY_FABRIC_CATALOG_PORT');
