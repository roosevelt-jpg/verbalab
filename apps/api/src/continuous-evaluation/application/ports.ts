/** Application ports for Continuous Evaluation. */

export type ContinuousEvaluationProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ContinuousEvaluationEngineBundle = ReturnType<
  import('../continuous-evaluation.service').ContinuousEvaluationService['engine']
>;

export interface ContinuousEvaluationCatalogPort {
  engine(): ContinuousEvaluationEngineBundle;
  listProducts(): ContinuousEvaluationProductRow[];
}

export const CONTINUOUS_EVALUATION_CATALOG_PORT = Symbol('CONTINUOUS_EVALUATION_CATALOG_PORT');
