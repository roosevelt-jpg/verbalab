export type ResearchCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type ResearchCloudProductRow = {
  id: string;
  name: string;
  status: ResearchCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ResearchAreaId =
  | 'language'
  | 'speech'
  | 'voice'
  | 'vision'
  | 'reasoning'
  | 'multimodal'
  | 'embeddings'
  | 'agents'
  | 'roboticsInterfaces'
  | 'edgeAi'
  | 'quantumAiResearchReadiness'
  | 'syntheticData'
  | 'evaluation'
  | 'benchmarking'
  | 'responsibleAi';

/**
 * Library Phase 138 → Research Cloud Foundation.
 * Incubates R&D that graduates into production — not Weights & Biases OS, not Hugging Face hub OS,
 * not DOI registry OS, not USPTO patent OS, not MLflow OS. AI Sovereignty Cloud deferred to Volume 14+.
 */
export function researchCloudProductCatalog(): ResearchCloudProductRow[] {
  return [
    {
      id: 'research-cloud',
      name: 'Research Cloud',
      status: 'shipped',
      api: 'GET /v1/research-cloud/products',
      console: '/research-cloud',
      notes:
        'Foundation hub. Extends Intelligence/Knowledge/Foundation Model clouds — does not regenerate Volumes 1–12.',
    },
    {
      id: 'experiment-platform',
      name: 'Experiment Platform',
      status: 'shipped',
      api: 'GET /v1/experiment-platform/engine',
      console: '/experiment-platform',
      notes: '. Experiment tracking catalog — not W&B/MLflow OS.',
    },
    {
      id: 'synthetic-data-platform',
      name: 'Synthetic Data Platform',
      status: 'shipped',
      api: 'GET /v1/synthetic-data-platform/engine',
      console: '/synthetic-data-platform',
      notes: '. syntheticLabelRequired=true; artifacts marked isSynthetic=true.',
    },
    {
      id: 'benchmark-platform',
      name: 'Benchmark Platform',
      status: 'shipped',
      api: 'GET /v1/benchmark-platform/engine',
      console: '/benchmark-platform',
      notes: '. Suites + leaderboard seed — not public leaderboard OS.',
    },
    {
      id: 'evaluation-platform',
      name: 'Evaluation Platform',
      status: 'shipped',
      api: 'GET /v1/evaluation-platform/engine',
      console: '/evaluation-platform',
      notes: '. Extends model-evaluation-platform / eval surfaces — does not regenerate them.',
    },
    {
      id: 'ai-publication-platform',
      name: 'AI Publication Platform',
      status: 'shipped',
      api: 'GET /v1/ai-publication-platform/engine',
      console: '/ai-publication-platform',
      notes: '. Papers/reports/datasets with versioning. doiRegistryOs=false.',
    },
    {
      id: 'patent-innovation-platform',
      name: 'Patent & Innovation Platform',
      status: 'shipped',
      api: 'GET /v1/patent-innovation-platform/engine',
      console: '/patent-innovation-platform',
      notes: '. Disclosure workflow + IP portfolio seed. usptoOs=false.',
    },
    {
      id: 'open-science-platform',
      name: 'Open Science Platform',
      status: 'shipped',
      api: 'GET /v1/open-science-platform/engine',
      console: '/open-science-platform',
      notes:
        '. traditionalKnowledgeConsentRequired=true; blocks restricted/unverified cultural open releases.',
    },
    {
      id: 'research-analytics',
      name: 'Research Analytics',
      status: 'shipped',
      api: 'GET /v1/research-analytics/engine',
      console: '/research-analytics',
      notes: '. Aggregates sibling Research Cloud catalogs into TRL/ROI snapshot.',
    },
  ];
}

export function researchAreasCatalog(): Array<{
  id: ResearchAreaId;
  name: string;
  status: ResearchCloudProductStatus;
  notes: string;
}> {
  return [
    { id: 'language', name: 'Language AI', status: 'shipped', notes: 'Multilingual / African language research.' },
    { id: 'speech', name: 'Speech AI', status: 'shipped', notes: 'ASR/TTS research incubation.' },
    { id: 'voice', name: 'Voice AI', status: 'shipped', notes: 'Voice cloning / conversational voice research.' },
    { id: 'vision', name: 'Vision AI', status: 'shipped', notes: 'Vision and document-vision research.' },
    { id: 'reasoning', name: 'Reasoning AI', status: 'shipped', notes: 'Planning / tool-use / chain evaluation.' },
    { id: 'multimodal', name: 'Multimodal AI', status: 'shipped', notes: 'Cross-modal fusion research.' },
    { id: 'embeddings', name: 'Embeddings', status: 'shipped', notes: 'Representation learning research.' },
    { id: 'agents', name: 'Agents', status: 'shipped', notes: 'Agent behaviour / safety research.' },
    {
      id: 'roboticsInterfaces',
      name: 'Robotics Interfaces',
      status: 'partial',
      notes: 'Interface catalog only — not a robotics OS.',
    },
    { id: 'edgeAi', name: 'Edge AI', status: 'partial', notes: 'Edge deployment research readiness.' },
    {
      id: 'quantumAiResearchReadiness',
      name: 'Quantum AI Research Readiness',
      status: 'deferred',
      notes: 'Readiness notes only — not a quantum computing OS.',
    },
    { id: 'syntheticData', name: 'Synthetic Data', status: 'shipped', notes: ' modality catalog.' },
    { id: 'evaluation', name: 'Evaluation', status: 'shipped', notes: ' evaluation catalog.' },
    { id: 'benchmarking', name: 'Benchmarking', status: 'shipped', notes: ' benchmark suites.' },
    { id: 'responsibleAi', name: 'Responsible AI', status: 'shipped', notes: 'Bias/fairness/safety research posture.' },
  ];
}

export function researchCloudArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_research_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'in_process_catalogs_and_existing_clouds',
    eventDriven: 'audit_jobs_and_event_fabric',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    extendsIntelligenceCloud: true,
    extendsKnowledgeCloud: true,
    extendsFoundationModelCloud: true,
    regeneratesVolumes1to12: false,
    weightsAndBiasesOs: false,
    huggingFaceHubOs: false,
    doiRegistryOs: false,
    usptoOs: false,
    mlflowOs: false,
    aiSovereigntyOs: false,
    note:
      'Volume 13 Research Cloud hub. Incubates R&D that graduates into production. Not W&B/MLflow/HF/DOI/USPTO OS. AI Sovereignty Cloud deferred to Volume 14+.',
  };
}

export function researchCloudHonesty() {
  return {
    regeneratesVolumes1to12: false,
    weightsAndBiasesOs: false,
    huggingFaceHubOs: false,
    doiRegistryOs: false,
    usptoOs: false,
    mlflowOs: false,
    publicLeaderboardOs: false,
    aiSovereigntyOs: false,
    syntheticLabelRequired: true,
    traditionalKnowledgeConsentRequired: true,
    coverageComplete: false,
  };
}

export function researchCloudRoutingTable() {
  return [
    { surface: 'experiment-platform', path: '/experiment-platform', api: '/v1/experiment-platform/engine' },
    {
      surface: 'synthetic-data-platform',
      path: '/synthetic-data-platform',
      api: '/v1/synthetic-data-platform/engine',
    },
    { surface: 'benchmark-platform', path: '/benchmark-platform', api: '/v1/benchmark-platform/engine' },
    { surface: 'evaluation-platform', path: '/evaluation-platform', api: '/v1/evaluation-platform/engine' },
    {
      surface: 'ai-publication-platform',
      path: '/ai-publication-platform',
      api: '/v1/ai-publication-platform/engine',
    },
    {
      surface: 'patent-innovation-platform',
      path: '/patent-innovation-platform',
      api: '/v1/patent-innovation-platform/engine',
    },
    { surface: 'open-science-platform', path: '/open-science-platform', api: '/v1/open-science-platform/engine' },
    { surface: 'research-analytics', path: '/research-analytics', api: '/v1/research-analytics/engine' },
    { surface: 'intelligence-cloud', path: '/intelligence-cloud', api: '/v1/intelligence-cloud/products' },
    { surface: 'knowledge-cloud', path: '/knowledge-cloud', api: '/v1/knowledge-cloud/products' },
    {
      surface: 'foundation-model-cloud',
      path: '/foundation-model-cloud',
      api: '/v1/foundation-model-cloud/products',
    },
    {
      surface: 'model-evaluation-platform',
      path: '/model-evaluation-platform',
      api: '/v1/model-evaluation-platform/engine',
    },
  ];
}
