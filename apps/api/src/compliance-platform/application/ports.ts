/** Application ports for Compliance Platform. */

export type CompliancePlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type CompliancePlatformEngineBundle = ReturnType<
  import('../compliance-platform.service').CompliancePlatformService['engine']
>;

export interface CompliancePlatformCatalogPort {
  engine(): CompliancePlatformEngineBundle;
  listProducts(): CompliancePlatformProductRow[];
}

export const COMPLIANCE_PLATFORM_CATALOG_PORT = Symbol('COMPLIANCE_PLATFORM_CATALOG_PORT');
