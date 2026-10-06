/** Application ports for Global Configuration Platform (VL-316). */

export type GlobalConfigurationPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GlobalConfigurationPlatformEngineBundle = ReturnType<
  import('../global-configuration-platform.service').GlobalConfigurationPlatformService['engine']
>;

export interface GlobalConfigurationPlatformCatalogPort {
  engine(): GlobalConfigurationPlatformEngineBundle;
  listProducts(): GlobalConfigurationPlatformProductRow[];
}

export const GLOBAL_CONFIGURATION_PLATFORM_CATALOG_PORT = Symbol('GLOBAL_CONFIGURATION_PLATFORM_CATALOG_PORT');
