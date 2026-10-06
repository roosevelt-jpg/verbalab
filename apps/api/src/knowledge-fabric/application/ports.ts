/** Application ports for Knowledge Fabric. */

export type KnowledgeFabricCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type KnowledgeFabricRouteRow = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type KnowledgeFabricProductsBundle = ReturnType<
  import('../knowledge-fabric.service').KnowledgeFabricService['products']
>;

export interface KnowledgeFabricCatalogPort {
  products: KnowledgeFabricProductsBundle;
  listCapabilities: KnowledgeFabricCapabilityRow[];
  listRoutes: KnowledgeFabricRouteRow[];
}

export const KNOWLEDGE_FABRIC_CATALOG_PORT = Symbol('KNOWLEDGE_FABRIC_CATALOG_PORT');
