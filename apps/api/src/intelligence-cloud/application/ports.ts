/** Application ports for Intelligence Cloud. Implemented by Nest adapters. */

export type IntelligenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type IntelligenceArchitectureNotes = ReturnType<
  typeof import('../intelligence-products.catalog').intelligenceArchitectureNotes
>;

export type IntelligenceProductsBundle = {
  products: IntelligenceProductRow[];
  architecture: IntelligenceArchitectureNotes;
  docs: string;
};

export interface IntelligenceCatalogPort {
  products(): IntelligenceProductsBundle;
  listProducts(): IntelligenceProductRow[];
}

export const INTELLIGENCE_CATALOG_PORT = Symbol('INTELLIGENCE_CATALOG_PORT');
