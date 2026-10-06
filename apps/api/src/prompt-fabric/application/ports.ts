/** Application ports for Prompt Fabric. */

export type PromptFabricCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type PromptFabricRouteRow = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type PromptFabricProductsBundle = ReturnType<
  import('../prompt-fabric.service').PromptFabricService['products']
>;

export interface PromptFabricCatalogPort {
  products(): PromptFabricProductsBundle;
  listCapabilities(): PromptFabricCapabilityRow[];
  listRoutes(): PromptFabricRouteRow[];
}

export const PROMPT_FABRIC_CATALOG_PORT = Symbol('PROMPT_FABRIC_CATALOG_PORT');
