/** Coverage thresholds for failed-pair candidates (reference metrics only). */
export const FINETUNE_FAIL_EXACT_MATCH_MAX = 0.5;
export const FINETUNE_FAIL_CHAR_SIM_MAX = 0.4;

export const DEFAULT_FINETUNE_BASE_MODEL = 'nllb-200-distilled-600M';

export type FineTuneLauncher = 'manual' | 'modal' | 'vertex' | 'fixture';
export type FineTuneJobStatus =
  | 'queued'
  | 'awaiting_gpu'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type FineTuneArtifactKind = 'phrase_map' | 'http_endpoint';

export type ModelRegistryStatus = 'draft' | 'ready' | 'retired';

export type ReadyFineTuneRoute = {
  id: string;
  slug: string;
  sourceLang: string;
  targetLang: string;
  artifactKind: FineTuneArtifactKind;
  artifactUri: string;
  baseModel: string;
};

export function isFineTuneLauncher(value: string): value is FineTuneLauncher {
  return value === 'manual' || value === 'modal' || value === 'vertex' || value === 'fixture';
}

export function isFineTuneArtifactKind(value: string): value is FineTuneArtifactKind {
  return value === 'phrase_map' || value === 'http_endpoint';
}

