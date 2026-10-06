export type AtlasCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type AtlasCapability = {
  id: string;
  name: string;
  status: AtlasCapabilityStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 92 → Atlas (VL-225).
 * Large multilingual reasoning family scaffold — not trained competitive weights.
 */
export function atlasCatalog() {
  return {
    product: 'VerbaLab Atlas',
    note:
      'Atlas (VL-225). Interface scaffold for a large multilingual reasoning family. Capabilities map to existing Gateway/Reasoning Runtime/MLOps hubs. Does not ship trained Atlas weights, OpenAI replacement, or frontier-lab compute (Volume 9 README).',
    capabilities: [
      {
        id: 'reasoning',
        name: 'Reasoning',
        status: 'partial',
        api: 'GET /v1/reasoning-runtime/engine',
        notes: 'Handoff to Reasoning Runtime — not a custom Atlas reasoner.',
      },
      {
        id: 'planning',
        name: 'Planning',
        status: 'partial',
        api: 'POST /v1/reasoning-runtime/plan',
        notes: 'Plan/reflect via Reasoning Runtime; no tool execution OS.',
      },
      {
        id: 'coding',
        name: 'Coding',
        status: 'deferred',
        api: null,
        notes: 'Code-specialist Atlas weights deferred.',
      },
      {
        id: 'math',
        name: 'Math',
        status: 'deferred',
        api: null,
        notes: 'Math-specialist weights deferred.',
      },
      {
        id: 'scientific-reasoning',
        name: 'Scientific Reasoning',
        status: 'deferred',
        api: null,
        notes: 'Scientific specialist deferred.',
      },
      {
        id: 'business-reasoning',
        name: 'Business Reasoning',
        status: 'deferred',
        api: null,
        notes: 'Business specialist deferred.',
      },
      {
        id: 'legal-reasoning',
        name: 'Legal Reasoning',
        status: 'deferred',
        api: null,
        notes: 'Legal specialist deferred — not legal advice product.',
      },
      {
        id: 'medical-reasoning',
        name: 'Medical Reasoning',
        status: 'deferred',
        api: null,
        notes: 'Medical specialist deferred — not clinical product.',
      },
      {
        id: 'financial-reasoning',
        name: 'Financial Reasoning',
        status: 'deferred',
        api: null,
        notes: 'Financial specialist deferred — not investment advice.',
      },
      {
        id: 'multilingual',
        name: 'Multilingual',
        status: 'partial',
        api: 'POST /v1/chat/completions',
        notes: 'Vendor chat/Gateway today — not Atlas-trained multilingual weights.',
      },
      {
        id: 'long-context',
        name: 'Long Context',
        status: 'partial',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Context Runtime assemble/compress — not infinite-context OS.',
      },
      {
        id: 'function-calling',
        name: 'Function Calling',
        status: 'partial',
        api: 'POST /v1/agent-runtime/runs',
        notes: 'Agent Runtime sandbox + Policy hard-gate — not open tools.',
      },
      {
        id: 'tool-use',
        name: 'Tool Use',
        status: 'partial',
        api: 'POST /v1/agent-runtime/runs',
        notes: 'Same Agent Runtime sandbox path.',
      },
      {
        id: 'training-pipeline',
        name: 'Training Pipeline',
        status: 'partial',
        api: 'POST /v1/model-training-platform/experiments',
        notes: 'Handoff to Model Training Platform / VL-111.',
      },
      {
        id: 'inference',
        name: 'Inference',
        status: 'partial',
        api: 'POST /v1/chat/completions',
        notes: 'Gateway chat — not Atlas-hosted weights.',
      },
      {
        id: 'evaluation',
        name: 'Evaluation',
        status: 'partial',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Model Evaluation Platform — MMLU suite still deferred.',
      },
      {
        id: 'benchmarking',
        name: 'Benchmarking',
        status: 'partial',
        api: 'GET /v1/model-evaluation-platform/leaderboard',
        notes: 'Org-scoped sandbox ranks — not LMSYS.',
      },
      {
        id: 'serving-platform',
        name: 'Serving Platform',
        status: 'partial',
        api: 'GET /v1/model-serving/engine',
        notes: 'Model Serving hub — not Atlas cluster OS.',
      },
    ] satisfies AtlasCapability[],
    honesty: atlasHonesty(),
    docs: '/docs/ATLAS.md',
  };
}

export function atlasCapabilities(): AtlasCapability[] {
  return atlasCatalog().capabilities;
}

export function atlasArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_atlas_scaffold',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'handoffs_to_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsGateway: true,
    extendsReasoningRuntime: true,
    extendsModelTrainingPlatform: true,
    extendsModelEvaluationPlatform: true,
    extendsFoundationModelCloud: true,
    regeneratesVolumes1to8: false,
    trainsCompetitiveFoundationWeights: false,
    shipsTrainedAtlasWeights: false,
    openAiReplacementOs: false,
    frontierLabOs: false,
    customerFacingProduct: true,
    scaffoldOnly: true,
    note:
      'Volume 9 Phase 92: Atlas as discoverable family scaffold. Real inference uses bought Gateway models until research charter + compute exist (ADR-0041 / ADR-0135).',
  };
}

export function atlasHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    shipsTrainedAtlasWeights: false,
    openAiReplacementOs: false,
    frontierLabOs: false,
    regeneratesVolumes1to8: false,
    regeneratesReasoningRuntime: false,
    scaffoldOnly: true,
    extendsGateway: true,
    extendsMlopsTrack: true,
  };
}
