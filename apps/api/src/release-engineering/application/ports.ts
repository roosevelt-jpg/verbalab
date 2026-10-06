/** Application ports for Release Engineering. */

export type ReleaseEngineeringProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ReleaseEngineeringEngineBundle = ReturnType<
  import('../release-engineering.service').ReleaseEngineeringService['engine']
>;

export interface ReleaseEngineeringCatalogPort {
  engine: ReleaseEngineeringEngineBundle;
  listProducts: ReleaseEngineeringProductRow[];
}

export const RELEASE_ENGINEERING_CATALOG_PORT = Symbol('RELEASE_ENGINEERING_CATALOG_PORT');
