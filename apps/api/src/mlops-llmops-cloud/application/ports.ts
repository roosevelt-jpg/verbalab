/** Application ports for MLOps & LLMOps Cloud. */

export type MlopsLlmopsCloudProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type MlopsLlmopsCloudEngineBundle = ReturnType<
  import('../mlops-llmops-cloud.service').MlopsLlmopsCloudService['products']
>;

export interface MlopsLlmopsCloudCatalogPort {
  engine: MlopsLlmopsCloudEngineBundle;
  listProducts: MlopsLlmopsCloudProductRow[];
}

export const MLOPS_LLMOPS_CLOUD_CATALOG_PORT = Symbol('MLOPS_LLMOPS_CLOUD_CATALOG_PORT');
