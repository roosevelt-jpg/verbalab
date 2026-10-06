export type MtpCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type MtpCapability = {
  id: string;
  name: string;
  status: MtpCapabilityStatus;
  api: string | null;
  notes: string;
};

export type MtpMethodId =
  | 'distributed_training'
  | 'lora'
  | 'qlora'
  | 'rlhf'
  | 'dpo'
  | 'instruction_tuning'
  | 'synthetic_data'
  | 'checkpointing'
  | 'model_versioning'
  | 'gpu_scheduling'
  | 'experiment_tracking';

export type MtpMethod = {
  id: MtpMethodId;
  name: string;
  status: MtpCapabilityStatus;
  launchable: boolean;
  existingApi: string | null;
  notes: string;
};

/**
 * Library Phase 102 → Model Training Platform (VL-235).
 * Orchestration hub over VL-111 rented-GPU jobs — not a frontier training cluster.
 */
export function modelTrainingPlatformCatalog() {
  return {
    product: 'VerbaLab Model Training Platform',
    note:
      'Model Training Platform (VL-235). Catalogs LoRA/instruction-tuning orchestration over existing `/v1/training-jobs` (VL-111). Experiment plans are sandbox-tracked. Does not ship distributed GPU clusters, RLHF/DPO labs, or trained competitive foundation weights (Volume 9 README).',
    capabilities: [
      {
        id: 'training-orchestration',
        name: 'Training Orchestration',
        status: 'partial',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'Experiment plans + handoff to VL-111 launchers.',
      },
      {
        id: 'lora',
        name: 'LoRA',
        status: 'partial',
        api: 'POST /v1/training-jobs',
        notes: 'Supported method → rented-GPU / manual jobs (VL-111).',
      },
      {
        id: 'instruction-tuning',
        name: 'Instruction Tuning',
        status: 'partial',
        api: 'POST /v1/training-jobs',
        notes: 'Pack metadata via VL-111; not a research lab.',
      },
      {
        id: 'experiment-tracking',
        name: 'Experiment Tracking',
        status: 'partial',
        api: 'GET /v1/model-training-platform/experiments',
        notes: 'Org-scoped sandbox experiment records — not W&B/MLflow OS.',
      },
      {
        id: 'checkpointing',
        name: 'Checkpointing',
        status: 'partial',
        api: 'POST /v1/model-training-platform/experiments/:id/checkpoint',
        notes: 'Metadata checkpoints on experiment plans — not distributed FS.',
      },
      {
        id: 'gpu-scheduling',
        name: 'GPU Scheduling',
        status: 'partial',
        api: 'GET /v1/training-jobs/launchers',
        notes: 'Buy Modal/Vertex/manual launchers (ADR-0040) — not K8s device plugins.',
      },
      {
        id: 'model-versioning',
        name: 'Model Versioning',
        status: 'partial',
        api: 'GET /v1/models/live',
        notes: 'Links VL-110 registry; full FMC registry is VL-237.',
      },
      {
        id: 'distributed-training',
        name: 'Distributed Training',
        status: 'deferred',
        api: null,
        notes: 'No multi-node training fabric in this phase.',
      },
      {
        id: 'qlora',
        name: 'QLoRA',
        status: 'deferred',
        api: null,
        notes: 'Quantized LoRA stack deferred — method listed for roadmap honesty.',
      },
      {
        id: 'rlhf',
        name: 'RLHF',
        status: 'deferred',
        api: null,
        notes: 'RLHF lab deferred — needs reward models + human feedback ops.',
      },
      {
        id: 'dpo',
        name: 'DPO',
        status: 'deferred',
        api: null,
        notes: 'DPO preference-tuning deferred.',
      },
      {
        id: 'synthetic-data',
        name: 'Synthetic Data',
        status: 'deferred',
        api: null,
        notes: 'Synthetic data generation pipeline deferred.',
      },
    ] satisfies MtpCapability[],
    honesty: modelTrainingPlatformHonesty(),
    docs: '/docs/MODEL_TRAINING_PLATFORM.md',
  };
}

export function modelTrainingMethods(): MtpMethod[] {
  return [
    {
      id: 'lora',
      name: 'LoRA',
      status: 'partial',
      launchable: true,
      existingApi: 'POST /v1/training-jobs',
      notes: 'Create experiment then hand off to VL-111 rented-GPU / manual launch.',
    },
    {
      id: 'instruction_tuning',
      name: 'Instruction Tuning',
      status: 'partial',
      launchable: true,
      existingApi: 'POST /v1/training-jobs',
      notes: 'Same VL-111 job path with instruction-tuning method tag.',
    },
    {
      id: 'checkpointing',
      name: 'Checkpointing',
      status: 'partial',
      launchable: false,
      existingApi: 'POST /v1/model-training-platform/experiments/:id/checkpoint',
      notes: 'Sandbox checkpoint index on experiment plans.',
    },
    {
      id: 'experiment_tracking',
      name: 'Experiment Tracking',
      status: 'partial',
      launchable: false,
      existingApi: 'GET /v1/model-training-platform/experiments',
      notes: 'Sandbox org-scoped plans — not W&B replacement.',
    },
    {
      id: 'gpu_scheduling',
      name: 'GPU Scheduling',
      status: 'partial',
      launchable: false,
      existingApi: 'GET /v1/training-jobs/launchers',
      notes: 'Surfaces VL-111 launcher configuration.',
    },
    {
      id: 'model_versioning',
      name: 'Model Versioning',
      status: 'partial',
      launchable: false,
      existingApi: 'GET /v1/models/live',
      notes: 'Defers full FMC registry to VL-237; uses VL-110 today.',
    },
    {
      id: 'qlora',
      name: 'QLoRA',
      status: 'deferred',
      launchable: false,
      existingApi: null,
      notes: 'Deferred quantized adaptation stack.',
    },
    {
      id: 'rlhf',
      name: 'RLHF',
      status: 'deferred',
      launchable: false,
      existingApi: null,
      notes: 'Deferred — not a reward-model lab.',
    },
    {
      id: 'dpo',
      name: 'DPO',
      status: 'deferred',
      launchable: false,
      existingApi: null,
      notes: 'Deferred preference optimization.',
    },
    {
      id: 'synthetic_data',
      name: 'Synthetic Data',
      status: 'deferred',
      launchable: false,
      existingApi: null,
      notes: 'Deferred synthetic corpus pipeline.',
    },
    {
      id: 'distributed_training',
      name: 'Distributed Training',
      status: 'deferred',
      launchable: false,
      existingApi: null,
      notes: 'Deferred — no multi-node scheduler.',
    },
  ];
}

export function modelTrainingPlatformArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_model_training_platform',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_finetune_jobs_plus_sandbox_experiments',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsTrainingJobs: true,
    extendsFineTunes: true,
    extendsGpuPlatform: true,
    extendsFoundationModelCloud: true,
    regeneratesVl111: false,
    trainsCompetitiveFoundationWeights: false,
    distributedTrainingOs: false,
    rlhfLabOs: false,
    wandbMlflowOs: false,
    customerFacingProduct: true,
    note:
      'Volume 9 Phase 102: real orchestration APIs over rented-GPU jobs. Not frontier-lab distributed training.',
  };
}

export function modelTrainingPlatformHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    distributedTrainingOs: false,
    rlhfLabOs: false,
    dpoLabOs: false,
    syntheticDataOs: false,
    wandbMlflowOs: false,
    kubernetesDevicePluginOs: false,
    regeneratesVl111: false,
    regeneratesVolumes1to8: false,
    openAiReplacementOs: false,
    extendsTrainingJobs: true,
    sandboxExperimentTracking: true,
  };
}

export function modelTrainingCeilings() {
  return {
    maxExperimentsPerOrg: 100,
    maxCheckpointsPerExperiment: 50,
    maxHyperparamKeys: 32,
    mode: 'sandbox',
    note:
      'Sandbox ceilings for experiment plans. Real GPU spend remains gated by VL-111 Pro + Cost Optimization.',
  };
}
