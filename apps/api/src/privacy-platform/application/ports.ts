/** Application ports for Privacy Platform. */

export type PrivacyPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type PrivacyPlatformEngineBundle = ReturnType<
  import('../privacy-platform.service').PrivacyPlatformService['engine']
>;

export interface PrivacyPlatformCatalogPort {
  engine(): PrivacyPlatformEngineBundle;
  listProducts(): PrivacyPlatformProductRow[];
}

export const PRIVACY_PLATFORM_CATALOG_PORT = Symbol('PRIVACY_PLATFORM_CATALOG_PORT');
