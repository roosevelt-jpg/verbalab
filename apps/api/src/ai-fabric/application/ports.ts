/** Application ports for AI Fabric Foundation. */

export type FabricBusRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type FabricProductsBundle = ReturnType<
  import('../ai-fabric.service').AiFabricService['products']
>;

export interface AiFabricCatalogPort {
  products: FabricProductsBundle;
  listBuses: FabricBusRow[];
}

export const AI_FABRIC_CATALOG_PORT = Symbol('AI_FABRIC_CATALOG_PORT');
