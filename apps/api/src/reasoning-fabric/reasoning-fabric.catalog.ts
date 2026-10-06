export type ReasoningFabricStatus = 'shipped' | 'partial' | 'deferred';

export type ReasoningFabricCapability = {
  id: string;
  name: string;
  status: ReasoningFabricStatus;
  api: string | null;
  notes: string;
};

export type ReasoningFabricRoute = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type ReasoningPipeline = {
  id: string;
  name: string;
  steps: string[];
  notes: string;
};

/**
 * Library Phase 111 → Reasoning Fabric (VL-244).
 * Cross-cloud reasoning routing over Reasoning Runtime — not a custom reasoner OS.
 */
export function reasoningFabricCapabilityCatalog(): ReasoningFabricCapability[] {
  return [
    {
      id: 'reasoning-fabric',
      name: 'Reasoning Fabric',
      status: 'shipped',
      api: 'GET /v1/reasoning-fabric/products',
      notes:
        'Reasoning router hub (VL-244). Extends Reasoning Runtime — does not regenerate VL-218 / VL-186.',
    },
    {
      id: 'reasoning-router',
      name: 'Reasoning Router',
      status: 'shipped',
      api: 'POST /v1/reasoning-fabric/route',
      notes: 'Maps reasoning intents to Runtime/Cloud handoffs — not a reasoner mesh OS.',
    },
    {
      id: 'reasoning-distribution',
      name: 'Reasoning Distribution',
      status: 'shipped',
      api: 'POST /v1/reasoning-fabric/distribute',
      notes: 'Same-org distribution plans + optional Event Fabric CloudEvents.',
    },
    {
      id: 'reasoning-replay',
      name: 'Reasoning Replay',
      status: 'shipped',
      api: 'GET /v1/reasoning-fabric/replay/:id',
      notes: 'Façade over Reasoning Runtime history/replay (kernel MemoryRecords).',
    },
    {
      id: 'reasoning-versioning',
      name: 'Reasoning Versioning',
      status: 'shipped',
      api: 'GET /v1/reasoning-fabric/versions',
      notes: 'Strategy/pipeline version catalog — not a model-weight version OS.',
    },
    {
      id: 'reasoning-cache',
      name: 'Reasoning Cache',
      status: 'partial',
      api: 'GET /v1/intelligent-cache/engine',
      notes: 'Discovery handoff to Intelligent Cache — not Redis Cluster OS; Gateway not auto-wired.',
    },
    {
      id: 'reasoning-federation',
      name: 'Reasoning Federation',
      status: 'partial',
      api: 'POST /v1/reasoning-fabric/federate',
      notes: 'Product-handoff federation catalog — not cross-tenant reasoner mesh.',
    },
    {
      id: 'reasoning-pipelines',
      name: 'Reasoning Pipelines',
      status: 'shipped',
      api: 'POST /v1/reasoning-fabric/pipeline',
      notes: 'Ordered strategy step plans — not Airflow/Spark reasoning OS.',
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: 'shipped',
      api: 'GET /v1/reasoning-fabric/monitoring',
      notes: 'Route/pipeline/distribute/replay counters + honesty.',
    },
  ];
}

export function reasoningFabricRoutingTable(): ReasoningFabricRoute[] {
  return [
    {
      kind: 'plan',
      name: 'Planning',
      target: 'reasoning-runtime',
      api: 'POST /v1/reasoning-runtime/plan',
      cloud: 'ai-kernel',
      notes: 'Planning façade via Reasoning Runtime.',
    },
    {
      kind: 'reason',
      name: 'Reason',
      target: 'reasoning-runtime',
      api: 'POST /v1/reasoning-runtime/reason',
      cloud: 'ai-kernel',
      notes: 'Graph/ToT/planning strategies via Runtime → Reasoning Cloud.',
    },
    {
      kind: 'reflect',
      name: 'Reflection',
      target: 'reasoning-runtime',
      api: 'POST /v1/reasoning-runtime/reflect',
      cloud: 'ai-kernel',
      notes: 'Heuristic critique — not deep reflective agent OS.',
    },
    {
      kind: 'evaluate',
      name: 'Self Evaluation',
      target: 'reasoning-runtime',
      api: 'POST /v1/reasoning-runtime/evaluate',
      cloud: 'ai-kernel',
      notes: 'Heuristic score — not LLM-as-judge lab.',
    },
    {
      kind: 'tools',
      name: 'Tool Selection',
      target: 'reasoning-runtime',
      api: 'POST /v1/reasoning-runtime/select-tools',
      cloud: 'ai-kernel',
      notes: 'Catalog suggestion only — does not execute tools.',
    },
    {
      kind: 'model',
      name: 'Model Selection',
      target: 'reasoning-runtime',
      api: 'POST /v1/reasoning-runtime/select-model',
      cloud: 'inference',
      notes: 'AI Router resolve — not model mesh OS.',
    },
    {
      kind: 'decision-tree',
      name: 'Decision Trees',
      target: 'reasoning-runtime',
      api: 'POST /v1/reasoning-runtime/decision-tree',
      cloud: 'intelligence',
      notes: 'Sandbox tree over Decision Engine.',
    },
    {
      kind: 'history',
      name: 'History / Replay',
      target: 'reasoning-runtime',
      api: 'GET /v1/reasoning-runtime/history',
      cloud: 'ai-kernel',
      notes: 'Kernel MemoryRecords for reasoning runs.',
    },
    {
      kind: 'cache',
      name: 'Intelligent Cache',
      target: 'intelligent-cache',
      api: 'GET /v1/intelligent-cache/engine',
      cloud: 'inference',
      notes: 'Opt-in cache namespaces — not Redis Cluster OS.',
    },
    {
      kind: 'cloud',
      name: 'Reasoning Cloud',
      target: 'reasoning-cloud',
      api: 'GET /v1/reasoning-cloud/products',
      cloud: 'intelligence',
      notes: 'Parent Reasoning Cloud discovery — not regenerated.',
    },
  ];
}

export function reasoningFabricPipelines(): ReasoningPipeline[] {
  return [
    {
      id: 'plan-reason-evaluate',
      name: 'Plan → Reason → Evaluate',
      steps: ['plan', 'reason', 'evaluate'],
      notes: 'Default sandbox pipeline — each step is a Runtime handoff.',
    },
    {
      id: 'reason-reflect',
      name: 'Reason → Reflect',
      steps: ['reason', 'reflect'],
      notes: 'Critique loop without tool execution.',
    },
    {
      id: 'select-reason',
      name: 'Select Model/Tools → Reason',
      steps: ['model', 'tools', 'reason'],
      notes: 'Selection catalogs then reason — tools not executed.',
    },
  ];
}

export function reasoningFabricVersions() {
  return [
    {
      id: 'pipeline-v1',
      kind: 'pipeline',
      version: 1,
      status: 'shipped',
      notes: 'Initial fabric pipeline catalog (VL-244).',
    },
    {
      id: 'router-v1',
      kind: 'router',
      version: 1,
      status: 'shipped',
      notes: 'Initial reasoning intent → Runtime route table.',
    },
    {
      id: 'strategy-facade-v1',
      kind: 'strategy',
      version: 1,
      status: 'partial',
      notes: 'Strategies remain owned by Reasoning Cloud/Runtime — fabric catalogs only.',
    },
  ];
}

export function reasoningFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_reasoning_fabric',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'delegates_to_reasoning_runtime',
    eventDriven: 'optional_event_fabric_cloudevents',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiFabric: true,
    extendsReasoningRuntime: true,
    regeneratesReasoningRuntime: false,
    regeneratesReasoningCloud: false,
    regeneratesVolumes1to9: false,
    customerFacingProduct: false,
    customReasonerOs: false,
    symbolicReasonerOs: false,
    toolExecutionAgentOs: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    note:
      'Reasoning Fabric (VL-244). Router/pipelines/replay/distribution over Reasoning Runtime. Not a custom reasoner, symbolic OS, or tool-execution agent OS.',
  };
}

export function reasoningFabricHonesty() {
  return {
    customerFacingProduct: false,
    customReasonerOs: false,
    symbolicReasonerOs: false,
    toolExecutionAgentOs: false,
    llmAsJudge: false,
    regeneratesReasoningRuntime: false,
    regeneratesReasoningCloud: false,
    regeneratesVolumes1to9: false,
    extendsReasoningRuntime: true,
    crossWorkspaceSameOrgOnly: true,
    crossOrgDataPlane: false,
    optionalEventFabricPropagation: true,
    cacheViaIntelligentCache: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
  };
}
