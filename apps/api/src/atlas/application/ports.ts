/** Application ports for Atlas scaffold. */

export type AtlasCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type AtlasEngineBundle = ReturnType<
  import('../atlas.service').AtlasService['engine']
>;

export interface AtlasCatalogPort {
  engine: AtlasEngineBundle;
  listCapabilities: AtlasCapabilityRow[];
}

export const ATLAS_CATALOG_PORT = Symbol('ATLAS_CATALOG_PORT');
