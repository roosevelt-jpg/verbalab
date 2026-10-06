/** Application ports for Reasoning Fabric (VL-244). */

export type ReasoningFabricCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type ReasoningFabricRouteRow = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type ReasoningFabricProductsBundle = ReturnType<
  import('../reasoning-fabric.service').ReasoningFabricService['products']
>;

export interface ReasoningFabricCatalogPort {
  products(): ReasoningFabricProductsBundle;
  listCapabilities(): ReasoningFabricCapabilityRow[];
  listRoutes(): ReasoningFabricRouteRow[];
}

export const REASONING_FABRIC_CATALOG_PORT = Symbol('REASONING_FABRIC_CATALOG_PORT');
