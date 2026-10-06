/** Application ports for Continuous Learning. */

export type ContinuousLearningProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ContinuousLearningEngineBundle = ReturnType<
  import('../continuous-learning.service').ContinuousLearningService['engine']
>;

export interface ContinuousLearningCatalogPort {
  engine: ContinuousLearningEngineBundle;
  listProducts: ContinuousLearningProductRow[];
}

export const CONTINUOUS_LEARNING_CATALOG_PORT = Symbol('CONTINUOUS_LEARNING_CATALOG_PORT');
