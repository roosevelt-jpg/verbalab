/** Application ports for Model Registry hub. */

export type MrCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type MrEngineBundle = Awaited<
  ReturnType<import('../model-registry.service').ModelRegistryService['engine']>
>;

export interface ModelRegistryCatalogPort {
  engine: Promise<MrEngineBundle>;
  listCapabilities: MrCapabilityRow[];
}

export const MODEL_REGISTRY_CATALOG_PORT = Symbol('MODEL_REGISTRY_CATALOG_PORT');
