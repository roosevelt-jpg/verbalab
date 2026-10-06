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
      status: 'shipped',
      api: 'GET /v1/atlas/engine',
      console: '/atlas',
      modality: 'multilingual_reasoning',
      notes:
        'Proprietary multilingual reasoning family for complex tasks, dialect nuance, and vertical packs. Runtime: Lugemi Atlas adapter.',
    },
    {
      id: 'baobab',
      name: 'Lugemi Baobab',
      status: 'shipped',
      api: 'GET /v1/models/live',
      console: '/models',
      modality: 'african_languages',
      notes: 'Proprietary Africa-first language + MT family for complex multilingual and dialect-aware tasks.',
    },
    {
      id: 'echo',
      name: 'Lugemi Echo',
      status: 'shipped',
      api: 'GET /v1/speech/engine',
      console: '/speech-recognition',
      modality: 'speech_audio',
      notes: 'Proprietary Echo Listen ASR + Echo Voice TTS for African accents and complex speech tasks.',
    },
    {
      id: 'voice',
      name: 'Lugemi Echo Voice',
      status: 'shipped',
      api: 'GET /v1/tts/engine',
      console: '/neural-tts',
      modality: 'voice_synthesis',
      notes: 'Proprietary neural voice family (own:*) for speaking agents and dubbing.',
    },
    {
      id: 'vision',
      name: 'Lugemi Vision',
      status: 'shipped',
      api: 'GET /v1/models/live',
      console: '/models',
      modality: 'vision_documents',
      notes: 'Document understanding family for multilingual forms and notices.',
    },
    {
      id: 'vector',
      name: 'Lugemi Vector',
      status: 'shipped',
      api: 'GET /v1/embeddings/engine',
      console: '/embedding-cloud',
      modality: 'embeddings',
      notes: 'Proprietary multilingual retrieval embeddings — local engine default.',
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
      status: 'shipped',
      api: 'GET /v1/models/live',
      console: '/models',
      modality: 'multimodal',
      notes: 'Fusion Video voice for complex dubbing and content pipelines.',
    },
    {
      id: 'translate',
      name: 'Lugemi Baobab Translate',
      status: 'shipped',
      api: 'GET /v1/translate/engine',
      console: '/translate',
      modality: 'translation',
      notes: 'Baobab MT for complex multilingual translation — Lugemi-owned default path.',
    },
    {
      id: 'model-training-platform',
      name: 'Model Training Platform',
      status: 'shipped',
      api: 'GET /v1/model-training-platform/engine',
      console: '/model-training-platform',
      modality: 'mlops',
      notes:
        'Training orchestration over existing. Experiment plans + LoRA/instruction handoff — not distributed/RLHF lab.',
    },
    {
      id: 'model-evaluation-platform',
      name: 'Model Evaluation Platform',
      status: 'shipped',
      api: 'GET /v1/model-evaluation-platform/engine',
      console: '/model-evaluation-platform',
      modality: 'mlops',
      notes:
        'Eval hub over sandbox bias/safety/latency. MMLU/HumanEval deferred; no SOTA claims.',
    },
    {
      id: 'model-registry',
      name: 'Model Registry',
      status: 'shipped',
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
    eks: true,
    eksPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsInferenceCloud: true,
    extendsAiKernel: true,
    regeneratesPriorLayers: false,
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
    regeneratesPriorLayers: false,
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
