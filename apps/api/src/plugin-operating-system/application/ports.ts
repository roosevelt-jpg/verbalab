/** Application ports for Plugin Operating System (VL-342). */

export type PluginOperatingSystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type PluginOperatingSystemEngineBundle = ReturnType<
  import('../plugin-operating-system.service').PluginOperatingSystemService['engine']
>;

export interface PluginOperatingSystemCatalogPort {
  engine(): PluginOperatingSystemEngineBundle;
  listProducts(): PluginOperatingSystemProductRow[];
}

export const PLUGIN_OPERATING_SYSTEM_CATALOG_PORT = Symbol('PLUGIN_OPERATING_SYSTEM_CATALOG_PORT');
