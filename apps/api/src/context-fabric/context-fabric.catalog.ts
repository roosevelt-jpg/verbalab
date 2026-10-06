export type ContextFabricStatus = 'shipped' | 'partial' | 'deferred';

export type ContextFabricCapability = {
  id: string;
  name: string;
  status: ContextFabricStatus;
  api: string | null;
  notes: string;
};

export type ContextFabricRoute = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

/**
 * Context Fabric.
 * Cross-cloud context routing over Context Runtime — not infinite-context OS.
 */
export function contextFabricCapabilityCatalog(): ContextFabricCapability[] {
  return [
    {
      id: 'context-fabric',
      name: 'Context Fabric',
      status: 'shipped',
      api: 'GET /v1/context-fabric/products',
      notes:
        'Cross-cloud context router. Extends Context Runtime — does not regenerate .',
    },
    {
      id: 'context-router',
      name: 'Context Router',
      status: 'shipped',
      api: 'POST /v1/context-fabric/route',
      notes: 'Maps context kinds to cloud/runtime handoff targets.',
    },
    {
      id: 'user-context',
      name: 'User Context',
      status: 'shipped',
      api: 'POST /v1/context-fabric/propagate',
      notes: 'Routes via Context Runtime assemble include.user.',
    },
    {
      id: 'workspace-context',
      name: 'Workspace Context',
      status: 'shipped',
      api: 'POST /v1/context-fabric/propagate',
      notes: 'Workspace + workspace memories via Context Runtime.',
    },
    {
      id: 'conversation-context',
      name: 'Conversation Context',
      status: 'shipped',
      api: 'POST /v1/context-fabric/propagate',
      notes: 'Conversation-scoped assembly via Context Runtime.',
    },
    {
      id: 'agent-context',
      name: 'Agent Context',
      status: 'partial',
      api: 'GET /v1/context-fabric/routes',
      notes: 'Discovery link to Agent Runtime; sandboxed + Policy-gated. Full agent fabric later.',
    },
    {
      id: 'language-context',
      name: 'Language Context',
      status: 'shipped',
      api: 'POST /v1/context-fabric/propagate',
      notes: 'Workspace language defaults via Context Runtime.',
    },
    {
      id: 'project-context',
      name: 'Project Context',
      status: 'shipped',
      api: 'POST /v1/context-fabric/propagate',
      notes: 'projectKey-scoped memories via Context Runtime.',
    },
    {
      id: 'knowledge-context',
      name: 'Knowledge Context',
      status: 'shipped',
      api: 'POST /v1/context-fabric/propagate',
      notes: 'Documents + knowledge-graph blocks via Context Runtime.',
    },
    {
      id: 'model-context',
      name: 'Model Context',
      status: 'shipped',
      api: 'POST /v1/context-fabric/propagate',
      notes: 'Model/provider hints via Context Runtime model block.',
    },
    {
      id: 'realtime-apis',
      name: 'Realtime APIs',
      status: 'partial',
      api: 'GET /v1/context-fabric/stream',
      notes: 'SSE status ticks + optional Event Fabric CloudEvents — not WebSocket OS.',
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: 'shipped',
      api: 'GET /v1/context-fabric/monitoring',
      notes: 'Route/propagate counters + honesty.',
    },
  ];
}

export function contextFabricRoutingTable(): ContextFabricRoute[] {
  return [
    {
      kind: 'user',
      name: 'User Context',
      target: 'context-runtime',
      api: 'POST /v1/context-runtime/assemble',
      cloud: 'ai-kernel',
      notes: 'Subject user memories + profile blocks.',
    },
    {
      kind: 'workspace',
      name: 'Workspace Context',
      target: 'context-runtime',
      api: 'POST /v1/context-runtime/assemble',
      cloud: 'ai-kernel',
      notes: 'Workspace defaults and memories.',
    },
    {
      kind: 'conversation',
      name: 'Conversation Context',
      target: 'context-runtime',
      api: 'POST /v1/context-runtime/assemble',
      cloud: 'ai-kernel',
      notes: 'conversationId-scoped assembly.',
    },
    {
      kind: 'agent',
      name: 'Agent Context',
      target: 'agent-runtime',
      api: 'GET /v1/agent-runtime/engine',
      cloud: 'ai-kernel',
      notes: 'Handoff discovery; Agent Fabric coordinates later.',
    },
    {
      kind: 'language',
      name: 'Language Context',
      target: 'context-runtime',
      api: 'POST /v1/context-runtime/assemble',
      cloud: 'language',
      notes: 'Language Cloud defaults via workspace languages.',
    },
    {
      kind: 'project',
      name: 'Project Context',
      target: 'context-runtime',
      api: 'POST /v1/context-runtime/assemble',
      cloud: 'ai-kernel',
      notes: 'projectKey memories.',
    },
    {
      kind: 'knowledge',
      name: 'Knowledge Context',
      target: 'context-runtime',
      api: 'POST /v1/context-runtime/assemble',
      cloud: 'knowledge',
      notes: 'Knowledge Cloud docs/graph via Context Runtime.',
    },
    {
      kind: 'model',
      name: 'Model Context',
      target: 'context-runtime',
      api: 'POST /v1/context-runtime/assemble',
      cloud: 'inference',
      notes: 'Model/provider hints for Inference Cloud.',
    },
  ];
}

export function contextFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_context_fabric',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'delegates_to_context_runtime',
    eventDriven: 'optional_event_fabric_cloudevents',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiFabric: true,
    extendsContextRuntime: true,
    regeneratesContextRuntime: false,
    regeneratesVolumes1to9: false,
    customerFacingProduct: false,
    infiniteContextWindow: false,
    websocketOs: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    note:
      'Context Fabric. Cross-cloud router over Context Runtime assemble/retrieve. Optional Event Fabric propagation. Not infinite-context or WebSocket OS.',
  };
}

export function contextFabricHonesty() {
  return {
    customerFacingProduct: false,
    infiniteContextWindow: false,
    websocketOs: false,
    regeneratesContextRuntime: false,
    regeneratesContextEngine: false,
    regeneratesVolumes1to9: false,
    extendsContextRuntime: true,
    optionalEventFabricPropagation: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    sseRealtimeTicks: true,
  };
}
