export type FmcProductStatus = 'shipped' | 'partial' | 'deferred';

export type FmcProductRow = {
  id: string;
  name: string;
  status: FmcProductStatus;
  api: string | null;
  console: string | null;
  modality: string;
  notes: string;
};

/**
 * Foundation Model Cloud Foundation.
 * Catalog of Lugemi model-family products. Named models are scaffolds
 * this hub does not train competitive foundation weights.
 */
export function foundationModelCloudCatalog(): FmcProductRow[] {
  return [
    {
      id: 'foundation-model-cloud',
      name: 'Foundation Model Cloud',
      status: 'shipped',
      api: 'GET /v1/foundation-model-cloud/products',
      console: '/foundation-model-cloud',
      modality: 'hub',
      notes:
        'First-class model-family hub. Extends Inference Cloud + AI Kernel — does not regenerate. Does not ship trained competitive weights.',
    },
    {
      id: 'atlas',
      name: 'Lugemi Atlas',
      status: 'partial',
      api: 'GET /v1/atlas/engine',
      console: '/atlas',
      modality: 'multilingual_reasoning',
      notes:
        'Large multilingual reasoning family scaffold. Interface + MLOps handoffs — not trained Atlas weights.',
    },
    {
      id: 'baobab',
      name: 'Lugemi Baobab',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'african_languages',
      notes: 'African language foundation family scaffold.',
    },
    {
      id: 'echo',
      name: 'Lugemi Echo',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'speech_audio',
      notes: 'Speech/audio family scaffold. Extends Speech Cloud — not a new STT OS.',
    },
    {
      id: 'voice',
      name: 'Lugemi Voice',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'voice_synthesis',
      notes: 'Voice synthesis/cloning family scaffold. Extends Voice Cloud.',
    },
    {
      id: 'vision',
      name: 'Lugemi Vision',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'vision_documents',
      notes: 'Vision/document understanding family scaffold.',
    },
    {
      id: 'vector',
      name: 'Lugemi Vector',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'embeddings',
      notes: 'Embedding family scaffold. Extends Embedding Cloud.',
    },
    {
      id: 'reason',
      name: 'Lugemi Reason',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'reasoning_planning',
      notes: 'Reasoning/planning family scaffold. Extends Reasoning Cloud/Runtime.',
    },
    {
      id: 'edge',
      name: 'Lugemi Edge',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'on_device_slm',
      notes: 'On-device SLM family scaffold.',
    },
    {
      id: 'fusion',
      name: 'Lugemi Fusion',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'multimodal',
      notes: 'Multimodal fusion family scaffold.',
    },
    {
      id: 'translate',
      name: 'Lugemi Translate',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'translation',
      notes: 'Translation family scaffold. Extends Language Cloud — not a new MT OS.',
    },
    {
      id: 'model-training-platform',
      name: 'Model Training Platform',
      status: 'partial',
      api: 'GET /v1/model-training-platform/engine',
      console: '/model-training-platform',
      modality: 'mlops',
      notes:
        'Training orchestration over existing. Experiment plans + LoRA/instruction handoff — not distributed/RLHF lab.',
    },
    {
      id: 'model-evaluation-platform',
      name: 'Model Evaluation Platform',
      status: 'partial',
      api: 'GET /v1/model-evaluation-platform/engine',
      console: '/model-evaluation-platform',
      modality: 'mlops',
      notes:
        'Eval hub over sandbox bias/safety/latency. MMLU/HumanEval deferred; no SOTA claims.',
    },
    {
      id: 'model-registry',
      name: 'Model Registry',
      status: 'partial',
      api: 'GET /v1/model-registry/engine',
      console: '/model-registry',
      modality: 'mlops',
      notes:
        'Registry governance over existing. Cards/versions/approvals/deploy plans — not MLflow/traffic-mesh OS.',
    },
  ];
}

export function foundationModelCloudArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_foundation_model_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    kubernetes: true,
    kubernetesPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsInferenceCloud: true,
    extendsAiKernel: true,
    regeneratesVolumes1to8: false,
    customerFacingProduct: true,
    trainsCompetitiveFoundationWeights: false,
    openAiReplacementOs: false,
    modelFamilyScaffoldCatalog: true,
    note:
      'Platform docs: Cursor delivers MLOps/platform scaffolding — not trained competitive foundation models. Named families (Atlas…Translate) stay deferred until later phases; Training/Eval/Registry are the high-value MLOps track.',
  };
}

export function foundationModelCloudHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    shipsTrainedAtlasBaobabEtc: false,
    openAiReplacementOs: false,
    regeneratesVolumes1to8: false,
    regeneratesInferenceCloud: false,
    regeneratesAiKernel: false,
    modelFamilyScaffoldCatalog: true,
    mLOpsPlatformShipped: false,
    modelTrainingPlatformPartial: true,
    modelEvaluationPlatformPartial: true,
    modelRegistryPartial: true,
    hexagonalRewrite: false,
    linuxOsRewrite: false,
  };
}
