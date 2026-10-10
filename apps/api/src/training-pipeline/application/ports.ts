/** Application ports for Training Pipeline. */

export type TrainingPipelineProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type TrainingPipelineEngineBundle = ReturnType<
  import('../training-pipeline.service').TrainingPipelineService['engine']
>;

export interface TrainingPipelineCatalogPort {
  engine(): TrainingPipelineEngineBundle;
  listProducts(): TrainingPipelineProductRow[];
}

export const TRAINING_PIPELINE_CATALOG_PORT = Symbol('TRAINING_PIPELINE_CATALOG_PORT');
