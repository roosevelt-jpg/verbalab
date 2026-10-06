export type ExperimentStatus = 'shipped' | 'partial' | 'deferred';

export type ExperimentRun = {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  hyperparameters: Record<string, string | number | boolean>;
  datasetId: string;
  artifactIds: string[];
  lineageParentId: string | null;
  metrics: Record<string, number>;
  notes: string;
};

/**
 * Library Phase 139 → Experiment Platform.
 * Experiment tracking catalog — not Weights & Biases OS, not MLflow OS.
 */
export function experimentPlatformEngineCatalog {
  const runs: ExperimentRun[] = [
    {
      id: 'exp-sw-asr-001',
      name: 'Swahili ASR baseline',
      status: 'completed',
      hyperparameters: { lr: 0.0003, epochs: 3, batchSize: 16 },
      datasetId: 'ds-sw-asr-seed',
      artifactIds: ['art-ckpt-001'],
      lineageParentId: null,
      metrics: { wer: 0.28, latencyMs: 420 },
      notes: 'Seed run for Research Cloud experiment tracking.',
    },
    {
      id: 'exp-sw-asr-002',
      name: 'Swahili ASR LoRA sweep',
      status: 'completed',
      hyperparameters: { lr: 0.0001, epochs: 5, loraRank: 8 },
      datasetId: 'ds-sw-asr-seed',
      artifactIds: ['art-ckpt-002'],
      lineageParentId: 'exp-sw-asr-001',
      metrics: { wer: 0.24, latencyMs: 455 },
      notes: 'Child run demonstrating lineage.',
    },
    {
      id: 'exp-yo-mt-001',
      name: 'Yoruba MT comparison',
      status: 'running',
      hyperparameters: { beam: 4, maxLen: 128 },
      datasetId: 'ds-yo-mt-seed',
      artifactIds: [],
      lineageParentId: null,
      metrics: { bleu: 18.2 },
      notes: 'In-progress comparison slot.',
    },
  ];
  return {
    product: 'Lugemi Experiment Platform',
    note:
      'Experiment Platform. Tracks runs with hyperparameters, lineage, artifacts, datasets, and comparison — not Weights & Biases OS or MLflow OS.',
    capabilities: [
      {
        id: 'tracking',
        name: 'Experiment tracking',
        status: 'shipped' as ExperimentStatus,
        api: 'GET /v1/experiment-platform/runs',
        notes: 'Seed runs with hyperparameters + metrics.',
      },
      {
        id: 'lineage',
        name: 'Experiment lineage',
        status: 'shipped' as ExperimentStatus,
        api: 'GET /v1/experiment-platform/runs',
        notes: 'Parent/child lineageParentId links.',
      },
      {
        id: 'comparison',
        name: 'Model comparison',
        status: 'shipped' as ExperimentStatus,
        api: 'GET /v1/experiment-platform/query',
        notes: 'Query/filter runs for comparison.',
      },
      {
        id: 'hyperparameter-search',
        name: 'Hyperparameter search',
        status: 'partial' as ExperimentStatus,
        api: null,
        notes: 'Catalog posture — not a distributed sweep OS.',
      },
    ],
    runs,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to12: false,
      weightsAndBiasesOs: false,
      mlflowOs: false,
    },
    honesty: {
      regeneratesVolumes1to12: false,
      weightsAndBiasesOs: false,
      mlflowOs: false,
      coverageComplete: false,
    },
    docs: '/docs/EXPERIMENT_PLATFORM.md',
  };
}
