export type MlopsLlmopsCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type MlopsLlmopsCloudProductRow = {
  id: string;
  name: string;
  status: MlopsLlmopsCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

export type MlopsAssetTypeId =
  | 'datasets'
  | 'models'
  | 'embeddings'
  | 'prompts'
  | 'agents'
  | 'ragPipelines'
  | 'knowledgeGraph'
  | 'inference'
  | 'evaluation'
  | 'deployment'
  | 'monitoring'
  | 'continuousLearning';

/**
 * Library Phase 148 → MLOps & LLMOps Cloud Foundation (VL-281).
 * Ops layer over Inference/Kernel/Foundation Models (7–9), RAG (Volume 6),
 * Agent Runtime (Volume 8), and Prompt Runtime. Not Kubeflow/SageMaker/Vertex/
 * W&B/MLflow/LangSmith/Ray cluster OS. Trust Cloud deferred to Volume 15+.
 */
export function mlopsLlmopsCloudProductCatalog(): MlopsLlmopsCloudProductRow[] {
  return [
    {
      id: 'mlops-llmops-cloud',
      name: 'MLOps & LLMOps Cloud',
      status: 'shipped',
      api: 'GET /v1/mlops-llmops-cloud/products',
      console: '/mlops-llmops-cloud',
      notes:
        'Foundation hub (VL-281). Extends Inference/Kernel/Foundation/RAG/Agent/Prompt — does not regenerate Volumes 1–13.',
    },
    {
      id: 'dataset-pipeline',
      name: 'Dataset Pipeline',
      status: 'shipped',
      api: 'GET /v1/dataset-pipeline/engine',
      console: '/dataset-pipeline',
      notes: 'VL-282. Extends dataset marketplace / VL-101 — does not regenerate.',
    },
    {
      id: 'training-pipeline',
      name: 'Training Pipeline',
      status: 'shipped',
      api: 'GET /v1/training-pipeline/engine',
      console: '/training-pipeline',
      notes: 'VL-283. LoRA/QLoRA/DPO/RLHF/SFT catalog. distributedTrainingOs=false.',
    },
    {
      id: 'continuous-evaluation',
      name: 'Continuous Evaluation',
      status: 'shipped',
      api: 'GET /v1/continuous-evaluation/engine',
      console: '/continuous-evaluation',
      notes: 'VL-284. Extends evaluation-platform / model-evaluation — gate status for Continuous Learning.',
    },
    {
      id: 'promptops-platform',
      name: 'PromptOps Platform',
      status: 'shipped',
      api: 'GET /v1/promptops-platform/engine',
      console: '/promptops-platform',
      notes: 'VL-285. Over Prompt Runtime / Prompt Fabric. Not LangSmith OS.',
    },
    {
      id: 'ragops-platform',
      name: 'RAGOps Platform',
      status: 'shipped',
      api: 'GET /v1/ragops-platform/engine',
      console: '/ragops-platform',
      notes: 'VL-286. Over Volume 6 RAG. Not vector-DB OS.',
    },
    {
      id: 'agentops-platform',
      name: 'AgentOps Platform',
      status: 'shipped',
      api: 'GET /v1/agentops-platform/engine',
      console: '/agentops-platform',
      notes: 'VL-287. policyViolationsVisible=true for human monitoring.',
    },
    {
      id: 'ai-drift-detection',
      name: 'AI Drift Detection',
      status: 'shipped',
      api: 'GET /v1/ai-drift-detection/engine',
      console: '/ai-drift-detection',
      notes: 'VL-288. driftClear check required before Continuous Learning promote.',
    },
    {
      id: 'continuous-learning',
      name: 'Continuous Learning',
      status: 'shipped',
      api: 'GET /v1/continuous-learning/engine',
      console: '/continuous-learning',
      notes:
        'VL-289. humanApprovalRequiredBeforePromote=true; poisonedInputGuard=true; requiresDriftClear + requiresContinuousEvalPass.',
    },
    {
      id: 'ai-operations-dashboard',
      name: 'AI Operations Dashboard',
      status: 'shipped',
      api: 'GET /v1/ai-operations-dashboard/engine',
      console: '/ai-operations-dashboard',
      notes: 'VL-290. Unified sibling hub snapshot.',
    },
  ];
}

export function mlopsAssetTypesCatalog(): Array<{
  id: MlopsAssetTypeId;
  name: string;
  status: MlopsLlmopsCloudProductStatus;
  notes: string;
}> {
  return [
    { id: 'datasets', name: 'Datasets', status: 'shipped', notes: 'Dataset Pipeline lifecycle.' },
    { id: 'models', name: 'Models', status: 'shipped', notes: 'Training + registry handoff.' },
    { id: 'embeddings', name: 'Embeddings', status: 'shipped', notes: 'Embedding refresh via RAGOps.' },
    { id: 'prompts', name: 'Prompts', status: 'shipped', notes: 'PromptOps registry/versioning.' },
    { id: 'agents', name: 'Agents', status: 'shipped', notes: 'AgentOps over Agent Runtime.' },
    { id: 'ragPipelines', name: 'RAG Pipelines', status: 'shipped', notes: 'RAGOps over Volume 6 RAG.' },
    { id: 'knowledgeGraph', name: 'Knowledge Graph', status: 'shipped', notes: 'Ops view — not graph DB OS.' },
    { id: 'inference', name: 'Inference', status: 'shipped', notes: 'Extends Inference Cloud.' },
    { id: 'evaluation', name: 'Evaluation', status: 'shipped', notes: 'Continuous Evaluation gates.' },
    { id: 'deployment', name: 'Deployment', status: 'shipped', notes: 'Promote gated by Continuous Learning.' },
    { id: 'monitoring', name: 'Monitoring', status: 'shipped', notes: 'Drift + AgentOps + dashboard.' },
    {
      id: 'continuousLearning',
      name: 'Continuous Learning',
      status: 'shipped',
      notes: 'Human-approved promote only — never auto-promote.',
    },
  ];
}

export function mlopsLlmopsCloudArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_mlops_llmops_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'in_process_catalogs_and_existing_clouds',
    eventDriven: 'audit_jobs_and_event_fabric',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    extendsInferenceCloud: true,
    extendsAiKernel: true,
    extendsFoundationModelCloud: true,
    extendsRagVolume6: true,
    extendsAgentRuntime: true,
    extendsPromptRuntime: true,
    regeneratesVolumes1to13: false,
    kubeflowOs: false,
    sageMakerOs: false,
    vertexOs: false,
    weightsAndBiasesOs: false,
    mlflowOs: false,
    langSmithOs: false,
    rayClusterOs: false,
    trustCloudOs: false,
    note:
      'Volume 14 MLOps & LLMOps Cloud hub. Ops layer over Inference/Kernel/Foundation/RAG/Agent/Prompt. Not Kubeflow/SageMaker/Vertex/W&B/MLflow/LangSmith/Ray OS. Trust Cloud deferred to Volume 15+.',
  };
}

export function mlopsLlmopsCloudHonesty() {
  return {
    regeneratesVolumes1to13: false,
    kubeflowOs: false,
    sageMakerOs: false,
    vertexOs: false,
    weightsAndBiasesOs: false,
    mlflowOs: false,
    langSmithOs: false,
    rayClusterOs: false,
    distributedTrainingOs: false,
    trustCloudOs: false,
    humanApprovalRequiredBeforePromote: true,
    poisonedInputGuard: true,
    requiresDriftClear: true,
    requiresContinuousEvalPass: true,
    policyViolationsVisible: true,
    coverageComplete: false,
  };
}

export function mlopsLlmopsCloudRoutingTable() {
  return [
    { surface: 'dataset-pipeline', path: '/dataset-pipeline', api: '/v1/dataset-pipeline/engine' },
    { surface: 'training-pipeline', path: '/training-pipeline', api: '/v1/training-pipeline/engine' },
    {
      surface: 'continuous-evaluation',
      path: '/continuous-evaluation',
      api: '/v1/continuous-evaluation/engine',
    },
    { surface: 'promptops-platform', path: '/promptops-platform', api: '/v1/promptops-platform/engine' },
    { surface: 'ragops-platform', path: '/ragops-platform', api: '/v1/ragops-platform/engine' },
    { surface: 'agentops-platform', path: '/agentops-platform', api: '/v1/agentops-platform/engine' },
    { surface: 'ai-drift-detection', path: '/ai-drift-detection', api: '/v1/ai-drift-detection/engine' },
    {
      surface: 'continuous-learning',
      path: '/continuous-learning',
      api: '/v1/continuous-learning/engine',
    },
    {
      surface: 'ai-operations-dashboard',
      path: '/ai-operations-dashboard',
      api: '/v1/ai-operations-dashboard/engine',
    },
    { surface: 'inference-cloud', path: '/inference-cloud', api: '/v1/inference-cloud/products' },
    { surface: 'evaluation-platform', path: '/evaluation-platform', api: '/v1/evaluation-platform/engine' },
    { surface: 'prompt-runtime', path: '/prompt-runtime', api: '/v1/prompt-runtime/engine' },
    { surface: 'agent-runtime', path: '/agent-runtime', api: '/v1/agent-runtime/engine' },
    { surface: 'dataset-marketplace', path: '/dataset-marketplace', api: '/v1/dataset-marketplace/engine' },
  ];
}
