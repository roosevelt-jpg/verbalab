export type OrchCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type OrchCapability = {
  id: string;
  name: string;
  status: OrchCapabilityStatus;
  api: string | null;
  notes: string;
};

/** AI Orchestration. Coordinate gateway/engines — not multi-cloud agent OS. */
export function aiOrchestrationCatalog() {
  return {
    product: 'Lugemi AI Orchestration',
    note:
      'Load-bearing orchestration over the AI Gateway + engines. Runs real e2e pipelines (detect→translate, translate→chat, decide→act, tool/model chains). Extends existing workflows. Not a multi-cloud agent OS, open agent-orchestration OS, or distributed AI fabric.',
    capabilities: [
      {
        id: 'multi-model-execution',
        name: 'Multi Model Execution',
        status: 'partial',
        api: 'POST /v1/ai-orchestration/run',
        notes: 'pipeline=model_chain — sequential gateway chat calls. Not cross-vendor mesh.',
      },
      {
        id: 'multi-cloud-routing',
        name: 'Multi Cloud Routing',
        status: 'deferred',
        api: null,
        notes: 'Multi-cloud agent OS / geo mesh deferred ( out of scope).',
      },
      {
        id: 'workflow-orchestration',
        name: 'Workflow Orchestration',
        status: 'shipped',
        api: 'POST /v1/ai-orchestration/run',
        notes: 'Named pipelines + v1/workflows job steps.',
      },
      {
        id: 'agent-collaboration',
        name: 'Agent Collaboration',
        status: 'deferred',
        api: null,
        notes: 'Multi-agent collaboration OS deferred.',
      },
      {
        id: 'tool-chaining',
        name: 'Tool Chaining',
        status: 'shipped',
        api: 'POST /v1/ai-orchestration/run',
        notes: 'pipeline=tool_chain — sequential allowlisted ops (detect/translate/chat/decide).',
      },
      {
        id: 'model-chaining',
        name: 'Model Chaining',
        status: 'partial',
        api: 'POST /v1/ai-orchestration/run',
        notes: 'pipeline=model_chain — draft then refine via chat gateway.',
      },
      {
        id: 'pipeline-execution',
        name: 'Pipeline Execution',
        status: 'shipped',
        api: 'POST /v1/ai-orchestration/run',
        notes: 'Real e2e runs through Translate/Chat/Gateway/Decision Engine.',
      },
      {
        id: 'distributed-ai',
        name: 'Distributed AI',
        status: 'deferred',
        api: null,
        notes: 'Distributed AI fabric deferred.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/ai-orchestration/analytics',
        notes: 'Run audit aggregates.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/ai-orchestration/monitoring',
        notes: 'Hub monitoring snapshot.',
      },
    ] satisfies OrchCapability[],
    honesty: {
      multiCloudAgentOs: false,
      langGraphOs: false,
      distributedAiFabric: false,
      loadBearingE2e: true,
      executesRealRequests: true,
    },
    links: {
      console: '/ai-orchestration',
      hub: '/intelligence-cloud',
      workflows: '/workflows',
      chat: '/chat',
      decisionEngine: '/decision-engine',
      run: 'POST /v1/ai-orchestration/run',
      openapi: '/v1/openapi.json',
      docs: '/docs/AI_ORCHESTRATION.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@lugemi/sdk',
      cli: '@lugemi/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      backend: 'gateway_pipelines',
    },
  };
}

export const ORCH_PIPELINES = [
  {
    id: 'detect_translate',
    name: 'Detect then translate',
    steps: ['detect', 'translate'],
    status: 'shipped' as const,
  },
  {
    id: 'translate_chat',
    name: 'Translate then chat',
    steps: ['translate', 'chat'],
    status: 'shipped' as const,
  },
  {
    id: 'decide_act',
    name: 'Decide route then act',
    steps: ['decide', 'act'],
    status: 'shipped' as const,
  },
  {
    id: 'tool_chain',
    name: 'Tool chain',
    steps: ['ops[]'],
    status: 'shipped' as const,
  },
  {
    id: 'model_chain',
    name: 'Model chain (draft→refine)',
    steps: ['chat', 'chat'],
    status: 'partial' as const,
  },
  {
    id: 'assemble_chat',
    name: 'Assemble context then chat',
    steps: ['assemble', 'chat'],
    status: 'partial' as const,
  },
  {
    id: 'multi_cloud',
    name: 'Multi-cloud routing',
    steps: [],
    status: 'deferred' as const,
  },
] as const;

export type OrchPipelineId = (typeof ORCH_PIPELINES)[number]['id'];

export const ORCH_TOOL_OPS = ['detect', 'translate', 'chat', 'decide'] as const;
export type OrchToolOp = (typeof ORCH_TOOL_OPS)[number];
