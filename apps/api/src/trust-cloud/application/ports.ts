/** Application ports for Trust Cloud. */

export type TrustCloudProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type TrustCloudEngineBundle = ReturnType<
  import('../trust-cloud.service').TrustCloudService['products']
>;

export interface TrustCloudCatalogPort {
  engine: TrustCloudEngineBundle;
  listProducts: TrustCloudProductRow[];
}

export const TRUST_CLOUD_CATALOG_PORT = Symbol('TRUST_CLOUD_CATALOG_PORT');
