/** Application ports for Repository Standards (VL-347). */

export type RepositoryStandardsProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type RepositoryStandardsEngineBundle = ReturnType<
  import('../repository-standards.service').RepositoryStandardsService['engine']
>;

export interface RepositoryStandardsCatalogPort {
  engine(): RepositoryStandardsEngineBundle;
  listProducts(): RepositoryStandardsProductRow[];
}

export const REPOSITORY_STANDARDS_CATALOG_PORT = Symbol('REPOSITORY_STANDARDS_CATALOG_PORT');
