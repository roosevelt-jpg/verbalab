/** Application ports for Policy Fabric (VL-247). */

export type PolicyFabricCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type PolicyFabricRouteRow = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type PolicyFabricProductsBundle = ReturnType<
  import('../policy-fabric.service').PolicyFabricService['products']
>;

export interface PolicyFabricCatalogPort {
  products(): PolicyFabricProductsBundle;
  listCapabilities(): PolicyFabricCapabilityRow[];
  listRoutes(): PolicyFabricRouteRow[];
}

export const POLICY_FABRIC_CATALOG_PORT = Symbol('POLICY_FABRIC_CATALOG_PORT');
