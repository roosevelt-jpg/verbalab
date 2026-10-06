/** Application ports for Identity Federation. */

export type IdentityFederationProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type IdentityFederationEngineBundle = ReturnType<
  import('../identity-federation.service').IdentityFederationService['engine']
>;

export interface IdentityFederationCatalogPort {
  engine: IdentityFederationEngineBundle;
  listProducts: IdentityFederationProductRow[];
}

export const IDENTITY_FEDERATION_CATALOG_PORT = Symbol('IDENTITY_FEDERATION_CATALOG_PORT');
