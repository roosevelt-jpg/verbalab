/** Application ports for Dataset Pipeline. */

export type DatasetPipelineProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type DatasetPipelineEngineBundle = ReturnType<
  import('../dataset-pipeline.service').DatasetPipelineService['engine']
>;

export interface DatasetPipelineCatalogPort {
  engine(): DatasetPipelineEngineBundle;
  listProducts(): DatasetPipelineProductRow[];
}

export const DATASET_PIPELINE_CATALOG_PORT = Symbol('DATASET_PIPELINE_CATALOG_PORT');
