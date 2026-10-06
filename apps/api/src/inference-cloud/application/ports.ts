/** Application ports for Inference Cloud (VL-204). Implemented by Nest adapters. */

export type InferenceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type InferenceArchitectureNotes = ReturnType<
  typeof import('../inference-products.catalog').inferenceArchitectureNotes
>;

export type InferenceProductsBundle = {
  products: InferenceProductRow[];
  architecture: InferenceArchitectureNotes;
  docs: string;
};

export interface InferenceCatalogPort {
  products(): InferenceProductsBundle;
  listProducts(): InferenceProductRow[];
}

export const INFERENCE_CATALOG_PORT = Symbol('INFERENCE_CATALOG_PORT');
