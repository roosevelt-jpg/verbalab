export type MemoryFabricStatus = 'shipped' | 'partial' | 'deferred';

export type MemoryFabricCapability = {
  id: string;
  name: string;
  status: MemoryFabricStatus;
  api: string | null;
  notes: string;
};

export type MemoryFabricRoute = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type MemoryPipeline = {
  id: string;
  name: string;
  steps: string[];
  notes: string;
};

/**
 * Library Phase 112 → Memory Fabric.
 * Cross-cloud memory routing over Memory Runtime — not Mem0 / multi-region replication OS.
 */
export function memoryFabricCapabilityCatalog(): MemoryFabricCapability[] {
  return [
    {
      id: 'memory-fabric',
      name: 'Memory Fabric',
      status: 'shipped',
      api: 'GET /v1/memory-fabric/products',
      notes:
        'Memory router hub. Extends Memory Runtime — does not regenerate .',
    },
    {
      id: 'memory-router',
      name: 'Memory Router',
      status: 'shipped',
      api: 'POST /v1/memory-fabric/route',
      notes: 'Maps memory intents to Runtime/Cloud handoffs — not a memory mesh OS.',
    },
    {
      id: 'memory-synchronization',
      name: 'Memory Synchronization',
      status: 'shipped',
      api: 'POST /v1/memory-fabric/sync',
      notes: 'Façade over Memory Runtime sandbox sync stamp — not multi-region replication.',
    },
    {
      id: 'memory-replication',
      name: 'Memory Replication',
      status: 'partial',
      api: 'POST /v1/memory-fabric/replicate',
      notes: 'Same-org replication plan only — not multi-region replication OS.',
    },
    {
      id: 'memory-federation',
      name: 'Memory Federation',
      status: 'partial',
      api: 'POST /v1/memory-fabric/federate',
      notes: 'Product-handoff federation catalog — not cross-tenant memory mesh.',
    },
    {
      id: 'memory-distribution',
      name: 'Memory Distribution',
      status: 'shipped',
      api: 'POST /v1/memory-fabric/distribute',
      notes: 'Same-org distribution plans + optional Event Fabric CloudEvents.',
    },
    {
      id: 'short-term-memory',
      name: 'Short-term Memory',
      status: 'shipped',
      api: 'POST /v1/memory-runtime/put',
      notes: 'Handoff to Memory Runtime kind=short_term.',
    },
    {
      id: 'long-term-memory',
      name: 'Long-term Memory',
      status: 'shipped',
      api: 'POST /v1/memory-runtime/put',
      notes: 'Handoff to Memory Runtime kind=long_term.',
    },
    {
      id: 'workspace-memory',
      name: 'Workspace Memory',
      status: 'shipped',
      api: 'GET /v1/memory-runtime/memories',
      notes: 'Handoff to Memory Runtime scope=workspace.',
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: 'shipped',
      api: 'GET /v1/memory-fabric/monitoring',
      notes: 'Route/sync/distribute/replicate counters + honesty.',
    },
  ];
}

export function memoryFabricRoutingTable(): MemoryFabricRoute[] {
  return [
    {
      kind: 'short_term',
      name: 'Short-term Memory',
      target: 'memory-runtime',
      api: 'POST /v1/memory-runtime/put',
      cloud: 'ai-kernel',
      notes: 'TTL-backed short-term writes via Memory Runtime.',
    },
    {
      kind: 'long_term',
      name: 'Long-term Memory',
      target: 'memory-runtime',
      api: 'POST /v1/memory-runtime/put',
      cloud: 'ai-kernel',
      notes: 'Long-lived kernel MemoryRecords via Memory Runtime.',
    },
    {
      kind: 'workspace',
      name: 'Workspace Memory',
      target: 'memory-runtime',
      api: 'GET /v1/memory-runtime/memories',
      cloud: 'ai-kernel',
      notes: 'Workspace-scoped list/search via Memory Runtime.',
    },
    {
      kind: 'sync',
      name: 'Synchronization',
      target: 'memory-runtime',
      api: 'POST /v1/memory-runtime/sync',
      cloud: 'ai-kernel',
      notes: 'Sandbox sync stamp — not multi-region replication.',
    },
    {
      kind: 'search',
      name: 'Search',
      target: 'memory-runtime',
      api: 'POST /v1/memory-runtime/search',
      cloud: 'ai-kernel',
      notes: 'Heuristic search over kernel MemoryRecords.',
    },
    {
      kind: 'snapshot',
      name: 'Snapshot',
      target: 'memory-runtime',
      api: 'POST /v1/memory-runtime/snapshots',
      cloud: 'ai-kernel',
      notes: 'Sandbox snapshots — not backup appliance OS.',
    },
    {
      kind: 'cloud',
      name: 'Memory Cloud',
      target: 'memory-cloud',
      api: 'GET /v1/memory-cloud/engine',
      cloud: 'intelligence',
      notes: 'Parent Memory Cloud discovery — not regenerated.',
    },
    {
      kind: 'cache',
      name: 'Intelligent Cache',
      target: 'intelligent-cache',
      api: 'GET /v1/intelligent-cache/engine',
      cloud: 'inference',
      notes: 'Opt-in cache namespaces — not Redis Cluster OS.',
    },
  ];
}

export function memoryFabricPipelines(): MemoryPipeline[] {
  return [
    {
      id: 'write-sync',
      name: 'Write → Sync',
      steps: ['short_term', 'sync'],
      notes: 'Default short-term write then sandbox sync stamp.',
    },
    {
      id: 'long-term-workspace',
      name: 'Long-term → Workspace',
      steps: ['long_term', 'workspace'],
      notes: 'Persist long-term then list workspace memories.',
    },
    {
      id: 'search-snapshot',
      name: 'Search → Snapshot',
      steps: ['search', 'snapshot'],
      notes: 'Search then capture sandbox snapshot.',
    },
  ];
}

export function memoryFabricVersions() {
  return [
    {
      id: 'router-v1',
      kind: 'router',
      version: 1,
      status: 'shipped',
      notes: 'Initial memory intent → Runtime route table.',
    },
    {
      id: 'pipeline-v1',
      kind: 'pipeline',
      version: 1,
      status: 'shipped',
      notes: 'Initial fabric pipeline catalog.',
    },
    {
      id: 'sync-facade-v1',
      kind: 'sync',
      version: 1,
      status: 'partial',
      notes: 'Sync/replicate remain sandbox plans — Runtime owns MemoryRecords.',
    },
  ];
}

export function memoryFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_memory_fabric',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'delegates_to_memory_runtime',
    eventDriven: 'optional_event_fabric_cloudevents',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiFabric: true,
    extendsMemoryRuntime: true,
    regeneratesMemoryRuntime: false,
    regeneratesMemoryCloud: false,
    regeneratesVolumes1to9: false,
    customerFacingProduct: false,
    mem0Os: false,
    multiRegionReplicationOs: false,
    infinitePersonalizationOs: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    note:
      'Memory Fabric. Router/sync/distribute/federation over Memory Runtime. Not Mem0, multi-region replication, or infinite personalization OS.',
  };
}

export function memoryFabricHonesty() {
  return {
    customerFacingProduct: false,
    mem0Os: false,
    multiRegionReplicationOs: false,
    infinitePersonalizationOs: false,
    regeneratesMemoryRuntime: false,
    regeneratesMemoryCloud: false,
    regeneratesVolumes1to9: false,
    extendsMemoryRuntime: true,
    crossWorkspaceSameOrgOnly: true,
    crossOrgDataPlane: false,
    optionalEventFabricPropagation: true,
    cacheViaIntelligentCache: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
  };
}
