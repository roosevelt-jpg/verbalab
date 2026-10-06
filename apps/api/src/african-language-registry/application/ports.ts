/** Application ports for African Language Registry. */

export type AfricanLanguageRegistryProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AfricanLanguageRegistryEngineBundle = ReturnType<
  import('../african-language-registry.service').AfricanLanguageRegistryService['engine']
>;

export interface AfricanLanguageRegistryCatalogPort {
  engine: AfricanLanguageRegistryEngineBundle;
  listProducts: AfricanLanguageRegistryProductRow[];
}

export const AFRICAN_LANGUAGE_REGISTRY_CATALOG_PORT = Symbol('AFRICAN_LANGUAGE_REGISTRY_CATALOG_PORT');
