/** Application ports for Evaluation Platform. */

export type EvaluationPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type EvaluationPlatformEngineBundle = ReturnType<
  import('../evaluation-platform.service').EvaluationPlatformService['engine']
>;

export interface EvaluationPlatformCatalogPort {
  engine: EvaluationPlatformEngineBundle;
  listProducts: EvaluationPlatformProductRow[];
}

export const EVALUATION_PLATFORM_CATALOG_PORT = Symbol('EVALUATION_PLATFORM_CATALOG_PORT');
