/**
 * Agent Operating System.
 * Agent Operating System. Façade over agent-runtime + agent-fabric + agent-marketplace. Registry/lifecycle/security/collaboration/memory as routed — not a third agent executor.
 */
export function agentOperatingSystemEngineCatalog() {
  return {
    product: 'Lugemi Agent Operating System',
    unifyingOrchestrationLayer: true,
    duplicatesKernelOrFabric: false,
    notLinux: true,
    notKubernetes: true,
    literalOsKernel: false,
    capabilities: [
      { id: 'registry', name: 'Agent Registry Routing', status: 'shipped', notes: ' routed capability — not a new engine.' },
      { id: 'lifecycle', name: 'Agent Lifecycle Routing', status: 'shipped', notes: ' routed capability — not a new engine.' },
      { id: 'security', name: 'Agent Security Routing', status: 'shipped', notes: ' routed capability — not a new engine.' },
      { id: 'collaboration', name: 'Agent Collaboration Routing', status: 'shipped', notes: ' routed capability — not a new engine.' },
      { id: 'memory', name: 'Agent Memory Routing', status: 'shipped', notes: ' routed capability — not a new engine.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'agent-runtime',
        path: '/v1/agent-runtime/engine',
        role: 'Agent Runtime',
        status: 'shipped',
        notes: 'Upstream Kernel/Fabric/Data Plane surface — unifying layer routes here.',
      },
      {
        id: 'route-2',
        module: 'agent-fabric',
        path: '/v1/agent-fabric/products',
        role: 'Agent Fabric',
        status: 'shipped',
        notes: 'Upstream Kernel/Fabric/Data Plane surface — unifying layer routes here.',
      },
      {
        id: 'route-3',
        module: 'agent-marketplace',
        path: '/v1/agent-marketplace/engine',
        role: 'Agent Marketplace',
        status: 'shipped',
        notes: 'Upstream Kernel/Fabric/Data Plane surface — unifying layer routes here.',
      },
      {
        id: 'route-4',
        module: 'ai-kernel',
        path: '/v1/ai-kernel/products',
        role: 'AI Kernel agent surface',
        status: 'shipped',
        notes: 'Upstream Kernel/Fabric/Data Plane surface — unifying layer routes here.',
      },
      {
        id: 'route-5',
        module: 'ai-fabric',
        path: '/v1/ai-fabric/products',
        role: 'AI Fabric',
        status: 'shipped',
        notes: 'Upstream Kernel/Fabric/Data Plane surface — unifying layer routes here.',
      }
    ],
    routesTo: [
      { module: 'agent-runtime', path: '/v1/agent-runtime/engine', role: 'Agent Runtime' },
      { module: 'agent-fabric', path: '/v1/agent-fabric/products', role: 'Agent Fabric' },
      { module: 'agent-marketplace', path: '/v1/agent-marketplace/engine', role: 'Agent Marketplace' },
      { module: 'ai-kernel', path: '/v1/ai-kernel/products', role: 'AI Kernel agent surface' },
      { module: 'ai-fabric', path: '/v1/ai-fabric/products', role: 'AI Fabric' }
    ],
    honesty: {
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      notLinux: true,
      notKubernetes: true,
      literalOsKernel: false,
      enterpriseEngineeringSystemOs: false,
      integratesExistingSystems: true,
      newAgentExecutor: false,
    },
    safety: {
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      notLinux: true,
      notKubernetes: true,
      literalOsKernel: false,
      enterpriseEngineeringSystemOs: false,
      note: 'Agent Operating System. Façade over agent-runtime + agent-fabric + agent-marketplace. Registry/lifecycle/security/collaboration/memory as routed — not a third agent executor.',
    },
    docs: '/docs/AGENT_OPERATING_SYSTEM.md',
    note: 'Agent Operating System. Façade over agent-runtime + agent-fabric + agent-marketplace. Registry/lifecycle/security/collaboration/memory as routed — not a third agent executor.',
  };
}
