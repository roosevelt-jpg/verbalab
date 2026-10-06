/** Application ports for Model Evaluation Platform. */

export type MepSuiteRow = {
  id: string;
  name: string;
  status: string;
  runnable: boolean;
  existingApi: string | null;
  notes: string;
};

export type MepEngineBundle = ReturnType<
  import('../model-evaluation-platform.service').ModelEvaluationPlatformService['engine']
>;

export interface ModelEvaluationPlatformCatalogPort {
  engine: MepEngineBundle;
  listSuites: MepSuiteRow[];
}

export const MODEL_EVALUATION_PLATFORM_CATALOG_PORT = Symbol(
  'MODEL_EVALUATION_PLATFORM_CATALOG_PORT',
);
