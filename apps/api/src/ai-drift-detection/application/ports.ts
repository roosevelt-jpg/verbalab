/** Application ports for AI Drift Detection (VL-288). */

export type AiDriftDetectionProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiDriftDetectionEngineBundle = ReturnType<
  import('../ai-drift-detection.service').AiDriftDetectionService['engine']
>;

export interface AiDriftDetectionCatalogPort {
  engine(): AiDriftDetectionEngineBundle;
  listProducts(): AiDriftDetectionProductRow[];
}

export const AI_DRIFT_DETECTION_CATALOG_PORT = Symbol('AI_DRIFT_DETECTION_CATALOG_PORT');
