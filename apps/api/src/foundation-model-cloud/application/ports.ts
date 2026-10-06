/** Application ports for Foundation Model Cloud. Implemented by Nest adapters. */

export type FmcProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  modality: string;
  notes: string;
};

export type FmcArchitectureNotes = ReturnType<
  typeof import('../foundation-model-cloud.catalog').foundationModelCloudArchitectureNotes
>;

export type FmcProductsBundle = {
  product: string;
  products: FmcProductRow[];
  architecture: FmcArchitectureNotes;
  honesty: ReturnType<
    typeof import('../foundation-model-cloud.catalog').foundationModelCloudHonesty
  >;
  safety: {
    noFakeTrainedWeights: boolean;
    scaffoldsAreNotModels: boolean;
    note: string;
  };
  docs: string;
  note: string;
};

export interface FoundationModelCloudCatalogPort {
  products(): FmcProductsBundle;
  listProducts(): FmcProductRow[];
}

export const FOUNDATION_MODEL_CLOUD_CATALOG_PORT = Symbol(
  'FOUNDATION_MODEL_CLOUD_CATALOG_PORT',
);
