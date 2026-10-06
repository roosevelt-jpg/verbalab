/** Application ports for Context Fabric (VL-241). */

export type ContextFabricCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type ContextFabricRouteRow = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type ContextFabricProductsBundle = ReturnType<
  import('../context-fabric.service').ContextFabricService['products']
>;

export interface ContextFabricCatalogPort {
  products(): ContextFabricProductsBundle;
  listCapabilities(): ContextFabricCapabilityRow[];
  listRoutes(): ContextFabricRouteRow[];
}

export const CONTEXT_FABRIC_CATALOG_PORT = Symbol('CONTEXT_FABRIC_CATALOG_PORT');
