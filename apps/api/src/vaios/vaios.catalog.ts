export type VaiosProductStatus = 'shipped' | 'partial' | 'deferred';

export type VaiosProductRow = {
  id: string;
  name: string;
  status: VaiosProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Library Phase 201 → VAIOS Foundation.
 * Unifying orchestration layer over Kernel + Fabric + Data Plane.
 * Not Linux / not Kubernetes / not a third parallel OS.
 */
export function vaiosProductCatalog(): VaiosProductRow[] {
  return [
    {
      id: 'vaios',
      name: 'VAIOS Foundation',
      status: 'shipped',
      api: 'GET /v1/vaios/products',
      console: '/vaios',
      notes:
        '. Unifying orchestration layer; notLinux/notKubernetes.',
    },
    {
      id: 'ai-scheduler',
      name: 'AI Scheduler',
      status: 'shipped',
      api: 'GET /v1/ai-scheduler/engine',
      console: '/ai-scheduler',
      notes:
        '. Unifies scheduling over global-scheduler/GPU/workflow/agent queues.',
    },
    {
      id: 'runtime-manager',
      name: 'Runtime Manager',
      status: 'shipped',
      api: 'GET /v1/runtime-manager/engine',
      console: '/runtime-manager',
      notes:
        '. Lifecycle catalog over Kernel + Data Plane runtimes.',
    },
    {
      id: 'resource-manager',
      name: 'Resource Manager',
      status: 'shipped',
      api: 'GET /v1/resource-manager/engine',
      console: '/resource-manager',
      notes:
        '. Resource allocation catalog; gpuBudgetLimitsRequired=true.',
    },
    {
      id: 'workflow-operating-system',
      name: 'Workflow Operating System',
      status: 'shipped',
      api: 'GET /v1/workflow-operating-system/engine',
      console: '/workflow-operating-system',
      notes:
        '. Façade over workflow-runtime + marketplace.',
    },
    {
      id: 'agent-operating-system',
      name: 'Agent Operating System',
      status: 'shipped',
      api: 'GET /v1/agent-operating-system/engine',
      console: '/agent-operating-system',
      notes:
        '. Façade over agent-runtime + fabric + marketplace.',
    },
    {
      id: 'ai-memory-operating-system',
      name: 'AI Memory Operating System',
      status: 'shipped',
      api: 'GET /v1/ai-memory-operating-system/engine',
      console: '/ai-memory-operating-system',
      notes:
        '. Façade over memory-runtime + fabric + knowledge-memory.',
    },
    {
      id: 'knowledge-operating-system',
      name: 'Knowledge Operating System',
      status: 'shipped',
      api: 'GET /v1/knowledge-operating-system/engine',
      console: '/knowledge-operating-system',
      notes:
        '. Façade over knowledge-runtime/fabric/cloud + AKG.',
    },
    {
      id: 'plugin-operating-system',
      name: 'Plugin Operating System',
      status: 'shipped',
      api: 'GET /v1/plugin-operating-system/engine',
      console: '/plugin-operating-system',
      notes:
        '. Façade over plugin-runtime + marketplace; existing policy gates.',
    },
    {
      id: 'ai-kernel',
      name: 'AI Kernel (upstream)',
      status: 'shipped',
      api: 'GET /v1/ai-kernel/products',
      console: '/ai-kernel',
      notes:
        'Volume 8 surface unified by VAIOS.',
    },
    {
      id: 'ai-fabric',
      name: 'AI Fabric (upstream)',
      status: 'shipped',
      api: 'GET /v1/ai-fabric/products',
      console: '/ai-fabric',
      notes:
        'Volume 10 surface unified by VAIOS.',
    },
    {
      id: 'data-plane-cloud',
      name: 'Data Plane Cloud (upstream)',
      status: 'shipped',
      api: 'GET /v1/data-plane-cloud/products',
      console: '/data-plane-cloud',
      notes:
        'Volume 18 surface unified by VAIOS.',
    },
    {
      id: 'monitoring',
      name: 'VAIOS Monitoring',
      status: 'shipped',
      api: 'GET /v1/vaios/monitoring',
      console: '/vaios',
      notes:
        'Foundation monitoring snapshot.',
    },
  ];
}

export function vaiosRoutingTable(): Array<{
  id: string;
  path: string;
  purpose: string;
}> {
  return [
    { id: 'products', path: '/v1/vaios/products', purpose: 'Product catalog' },
    { id: 'engine', path: '/v1/vaios/engine', purpose: 'Engine alias' },
    { id: 'routing', path: '/v1/vaios/routing', purpose: 'Static routing table' },
    { id: 'monitoring', path: '/v1/vaios/monitoring', purpose: 'Monitoring snapshot' },
    { id: 'overview', path: '/v1/vaios/overview', purpose: 'Authenticated overview' },
  ];
}

export function vaiosHubInventory(): Array<{
  id: string;
  title: string;
  unifyingOrchestrationLayer: boolean;
  duplicatesKernelOrFabric: boolean;
  routesTo: string[];
}> {
  return [
      {
        id: 'ai-scheduler',
        title: 'AI Scheduler',
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: ['global-scheduler', 'gpu-runtime', 'gpu-platform', 'workflow-runtime', 'agent-runtime'],
      },
      {
        id: 'runtime-manager',
        title: 'Runtime Manager',
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: ['ai-kernel', 'agent-runtime', 'workflow-runtime', 'memory-runtime', 'policy-runtime', 'prompt-runtime', 'context-runtime', 'batch-runtime', 'streaming-runtime', 'data-plane-cloud'],
      },
      {
        id: 'resource-manager',
        title: 'Resource Manager',
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: ['gpu-platform', 'gpu-runtime', 'ai-kernel'],
      },
      {
        id: 'workflow-operating-system',
        title: 'Workflow Operating System',
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: ['workflow-runtime', 'workflow-marketplace', 'ai-kernel'],
      },
      {
        id: 'agent-operating-system',
        title: 'Agent Operating System',
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: ['agent-runtime', 'agent-fabric', 'agent-marketplace', 'ai-kernel', 'ai-fabric'],
      },
      {
        id: 'ai-memory-operating-system',
        title: 'AI Memory Operating System',
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: ['memory-runtime', 'memory-fabric', 'knowledge-memory', 'ai-kernel'],
      },
      {
        id: 'knowledge-operating-system',
        title: 'Knowledge Operating System',
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: ['knowledge-runtime', 'knowledge-fabric', 'knowledge-cloud', 'african-knowledge-graph'],
      },
      {
        id: 'plugin-operating-system',
        title: 'Plugin Operating System',
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: ['plugin-runtime', 'plugin-marketplace', 'ai-kernel', 'policy-runtime'],
      }
  ];
}

export function vaiosUnifiedSurfaces(): Array<{
  id: string;
  volume: number;
  path: string;
  role: string;
}> {
  return [
      {
        id: 'ai-kernel',
        volume: 8,
        path: '/v1/ai-kernel/products',
        role: 'Agent/Workflow/Plugin/Memory/Policy runtimes',
      },
      {
        id: 'ai-fabric',
        volume: 10,
        path: '/v1/ai-fabric/products',
        role: 'Cross-cloud buses (event/context/knowledge/memory/agent/policy)',
      },
      {
        id: 'data-plane-cloud',
        volume: 18,
        path: '/v1/data-plane-cloud/products',
        role: 'Thin execution runtimes (translation/speech/voice/vision/knowledge/embedding/streaming/GPU)',
      },
      {
        id: 'agent-runtime',
        volume: 8,
        path: '/v1/agent-runtime/engine',
        role: 'Agent execution',
      },
      {
        id: 'workflow-runtime',
        volume: 8,
        path: '/v1/workflow-runtime/engine',
        role: 'Workflow execution',
      },
      {
        id: 'memory-runtime',
        volume: 8,
        path: '/v1/memory-runtime/engine',
        role: 'Memory store',
      },
      {
        id: 'plugin-runtime',
        volume: 8,
        path: '/v1/plugin-runtime/engine',
        role: 'Plugin sandbox',
      },
      {
        id: 'global-scheduler',
        volume: 7,
        path: '/v1/global-scheduler/engine',
        role: 'Global scheduling',
      },
      {
        id: 'gpu-runtime',
        volume: 18,
        path: '/v1/gpu-runtime/engine',
        role: 'GPU runtime façade',
      }
  ];
}

export function vaiosArchitectureNotes(): Record<string, unknown> {
  return {
    role: 'vaios-unifying-orchestration',
    extends: [
      'ai-kernel',
      'ai-fabric',
      'data-plane-cloud',
      'agent-runtime',
      'workflow-runtime',
      'memory-runtime',
      'plugin-runtime',
      'global-scheduler',
      'gpu-runtime',
      'gpu-platform',
      'knowledge-runtime',
      'knowledge-fabric',
      'memory-fabric',
      'agent-fabric',
    ],
    notLinux: true,
    notKubernetes: true,
    literalOsKernel: false,
    unifyingOrchestrationLayer: true,
    duplicatesKernelOrFabric: false,
    enterpriseEngineeringSystemOs: false,
    deferredPastVolume19: ['enterprise-engineering-system', 'service-mesh-os'],
  };
}

export function vaiosHonesty(): Record<string, boolean | string> {
  return {
    unifyingOrchestrationLayer: true,
    duplicatesKernelOrFabric: false,
    notLinux: true,
    notKubernetes: true,
    literalOsKernel: false,
    enterpriseEngineeringSystemOs: false,
    integratesExistingSystems: true,
    note:
      'VAIOS unifies Kernel + Fabric + Data Plane as orchestration façades. Not Linux/Kubernetes. Not a third agent/workflow/memory implementation. Enterprise Engineering System deferred past Volume 19.',
  };
}
