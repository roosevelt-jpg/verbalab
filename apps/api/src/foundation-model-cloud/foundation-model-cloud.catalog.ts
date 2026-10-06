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
 * Library Phase 91 → Foundation Model Cloud Foundation (VL-224).
 * Catalog of Lugemi model-family products. Named models are scaffolds —
 * this hub does not train competitive foundation weights (Volume 9 README).
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
        'First-class model-family hub (VL-224). Extends Inference Cloud + AI Kernel — does not regenerate Volumes 1–8. Does not ship trained competitive weights.',
    },
    {
      id: 'atlas',
      name: 'Lugemi Atlas',
      status: 'partial',
      api: 'GET /v1/atlas/engine',
      console: '/atlas',
      modality: 'multilingual_reasoning',
      notes:
        'Large multilingual reasoning family scaffold (Phase 92 / VL-225). Interface + MLOps handoffs — not trained Atlas weights.',
    },
    {
      id: 'baobab',
      name: 'Lugemi Baobab',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'african_languages',
      notes: 'African language foundation family scaffold (Phase 93 / VL-226).',
    },
    {
      id: 'echo',
      name: 'Lugemi Echo',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'speech_audio',
      notes: 'Speech/audio family scaffold (Phase 94 / VL-227). Extends Speech Cloud — not a new STT OS.',
    },
    {
      id: 'voice',
      name: 'Lugemi Voice',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'voice_synthesis',
      notes: 'Voice synthesis/cloning family scaffold (Phase 95 / VL-228). Extends Voice Cloud.',
    },
    {
      id: 'vision',
      name: 'Lugemi Vision',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'vision_documents',
      notes: 'Vision/document understanding family scaffold (Phase 96 / VL-229).',
    },
    {
      id: 'vector',
      name: 'Lugemi Vector',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'embeddings',
      notes: 'Embedding family scaffold (Phase 97 / VL-230). Extends Embedding Cloud.',
    },
    {
      id: 'reason',
      name: 'Lugemi Reason',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'reasoning_planning',
      notes: 'Reasoning/planning family scaffold (Phase 98 / VL-231). Extends Reasoning Cloud/Runtime.',
    },
    {
      id: 'edge',
      name: 'Lugemi Edge',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'on_device_slm',
      notes: 'On-device SLM family scaffold (Phase 99 / VL-232).',
    },
    {
      id: 'fusion',
      name: 'Lugemi Fusion',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'multimodal',
      notes: 'Multimodal fusion family scaffold (Phase 100 / VL-233).',
    },
    {
      id: 'translate',
      name: 'Lugemi Translate',
      status: 'deferred',
      api: null,
      console: null,
      modality: 'translation',
      notes: 'Translation family scaffold (Phase 101 / VL-234). Extends Language Cloud — not a new MT OS.',
    },
    {
      id: 'model-training-platform',
      name: 'Model Training Platform',
      status: 'partial',
      api: 'GET /v1/model-training-platform/engine',
      console: '/model-training-platform',
      modality: 'mlops',
      notes:
        'Training orchestration over VL-111 (Phase 102 / VL-235). Experiment plans + LoRA/instruction handoff — not distributed/RLHF lab.',
    },
    {
      id: 'model-evaluation-platform',
      name: 'Model Evaluation Platform',
      status: 'partial',
      api: 'GET /v1/model-evaluation-platform/engine',
      console: '/model-evaluation-platform',
      modality: 'mlops',
      notes:
        'Eval hub over VL-100 + sandbox bias/safety/latency (Phase 103 / VL-236). MMLU/HumanEval deferred; no SOTA claims.',
    },
    {
      id: 'model-registry',
      name: 'Model Registry',
      status: 'partial',
      api: 'GET /v1/model-registry/engine',
      console: '/model-registry',
      modality: 'mlops',
      notes:
        'Registry governance over VL-110 (Phase 104 / VL-237). Cards/versions/approvals/deploy plans — not MLflow/traffic-mesh OS.',
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
      'Volume 9 README: Cursor delivers MLOps/platform scaffolding — not trained competitive foundation models. Named families (Atlas…Translate) stay deferred until later phases; Training/Eval/Registry are the high-value MLOps track.',
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
