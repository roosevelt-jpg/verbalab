export type FabricBusStatus = 'shipped' | 'partial' | 'deferred';

export type FabricBusRow = {
  id: string;
  name: string;
  status: FabricBusStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Library Phase 106 → AI Fabric Foundation (VL-239).
 * Internal communication hub connecting Lugemi clouds — not a Kafka hyperscaler OS.
 * Volume 10 README: buildable event/message-bus architecture; Policy Fabric must hard-gate.
 */
export function aiFabricBusCatalog(): FabricBusRow[] {
  return [
    {
      id: 'ai-fabric',
      name: 'AI Fabric',
      status: 'shipped',
      api: 'GET /v1/ai-fabric/products',
      console: '/ai-fabric',
      notes:
        'Internal communication hub (VL-239). Extends AI Kernel + Inference Cloud — does not regenerate Volumes 1–9. Not a customer product mesh OS.',
    },
    {
      id: 'event-fabric',
      name: 'Event Fabric',
      status: 'shipped',
      api: 'GET /v1/event-fabric/products',
      console: '/event-fabric',
      notes:
        'Redis Streams + CloudEvents bus (VL-240). Kafka/NATS/RabbitMQ adapters deferred.',
    },
    {
      id: 'context-fabric',
      name: 'Context Fabric',
      status: 'shipped',
      api: 'GET /v1/context-fabric/products',
      console: '/context-fabric',
      notes:
        'Cross-cloud context router over Context Runtime (VL-241). Not infinite-context OS.',
    },
    {
      id: 'knowledge-fabric',
      name: 'Knowledge Fabric',
      status: 'shipped',
      api: 'GET /v1/knowledge-fabric/products',
      console: '/knowledge-fabric',
      notes:
        'Knowledge router over Knowledge Cloud (VL-242). Same-org distribute/sync — not Confluence/Neo4j OS.',
    },
    {
      id: 'prompt-fabric',
      name: 'Prompt Fabric',
      status: 'shipped',
      api: 'GET /v1/prompt-fabric/products',
      console: '/prompt-fabric',
      notes:
        'Prompt router over Prompt Runtime (VL-243). Not prompt mesh/research lab OS.',
    },
    {
      id: 'reasoning-fabric',
      name: 'Reasoning Fabric',
      status: 'shipped',
      api: 'GET /v1/reasoning-fabric/products',
      console: '/reasoning-fabric',
      notes:
        'Reasoning router over Reasoning Runtime (VL-244). Not custom reasoner OS.',
    },
    {
      id: 'memory-fabric',
      name: 'Memory Fabric',
      status: 'shipped',
      api: 'GET /v1/memory-fabric/products',
      console: '/memory-fabric',
      notes:
        'Memory router over Memory Runtime (VL-245). Not Mem0 / multi-region replication OS.',
    },
    {
      id: 'agent-fabric',
      name: 'Agent Fabric',
      status: 'shipped',
      api: 'GET /v1/agent-fabric/products',
      console: '/agent-fabric',
      notes:
        'Agent router over Agent Runtime (VL-246). Sandboxed + Policy-gated; not LangGraph/AutoGPT OS.',
    },
    {
      id: 'policy-fabric',
      name: 'Policy Fabric',
      status: 'shipped',
      api: 'GET /v1/policy-fabric/products',
      console: '/policy-fabric',
      notes:
        'Fabric-wide hard gate (VL-247). Enforces via FabricPolicyGate — not log-only. Not OPA/Cedar OS.',
    },
    {
      id: 'workflow-bus',
      name: 'Workflow Bus',
      status: 'partial',
      api: 'GET /v1/workflow-runtime/engine',
      console: '/workflow-runtime',
      notes: 'Discovery link to Workflow Runtime until dedicated fabric bus ships.',
    },
    {
      id: 'identity-bus',
      name: 'Identity Bus',
      status: 'partial',
      api: 'GET /v1/ai-fabric/routing',
      console: '/ai-fabric',
      notes: 'Identity propagation via existing Clerk/session + request IDs — not a new IdP.',
    },
    {
      id: 'inference-bus',
      name: 'Inference Bus',
      status: 'partial',
      api: 'GET /v1/ai-router/engine',
      console: '/ai-router',
      notes: 'Discovery link to AI Router / Inference Cloud.',
    },
    {
      id: 'telemetry-bus',
      name: 'Telemetry Bus',
      status: 'partial',
      api: 'GET /v1/ai-fabric/monitoring',
      console: '/ai-fabric',
      notes: 'Uses existing observability/request IDs — not a new APM OS.',
    },
    {
      id: 'billing-bus',
      name: 'Billing Bus',
      status: 'partial',
      api: 'GET /v1/cost-optimization/engine',
      console: '/billing',
      notes: 'Discovery link to billing/cost surfaces — not a ledger rewrite.',
    },
    {
      id: 'plugin-bus',
      name: 'Plugin Bus',
      status: 'partial',
      api: 'GET /v1/plugin-runtime/engine',
      console: '/plugin-runtime',
      notes: 'Discovery link to Plugin Runtime (sandboxed).',
    },
    {
      id: 'security-bus',
      name: 'Security Bus',
      status: 'partial',
      api: 'GET /v1/policy-runtime/engine',
      console: '/policy-runtime',
      notes: 'Policy Runtime hard-gate today; Policy Fabric extends fabric-wide later.',
    },
    {
      id: 'streaming-bus',
      name: 'Streaming Bus',
      status: 'partial',
      api: 'GET /v1/streaming-runtime/engine',
      console: '/streaming-runtime',
      notes: 'Discovery link to Streaming Runtime.',
    },
    {
      id: 'service-discovery',
      name: 'Service Discovery',
      status: 'partial',
      api: 'GET /v1/ai-fabric/routing',
      console: '/ai-fabric',
      notes: 'Static catalog of cloud/runtime routes — not Consul/etcd OS.',
    },
  ];
}

export function aiFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_ai_fabric_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_and_existing_buses',
    eventDriven: 'audit_jobs_and_future_event_fabric',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiKernel: true,
    extendsInferenceCloud: true,
    regeneratesVolumes1to9: false,
    customerFacingProduct: false,
    kafkaHyperscalerOs: false,
    serviceMeshOs: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    brokerBackendsDeferred: false,
    redisStreamsActive: true,
    kafkaAdapterDeferred: true,
    note:
      'Volume 10 README: buildable internal bus architecture. Foundation ships discovery/routing hub; Event Fabric (VL-240) wires Redis Streams + CloudEvents. Kafka/NATS/Rabbit adapters remain deferred. Policy Fabric must hard-gate when shipped.',
  };
}

export function aiFabricHonesty() {
  return {
    customerFacingProduct: false,
    kafkaHyperscalerOs: false,
    natsClusterOs: false,
    serviceMeshOs: false,
    regeneratesVolumes1to9: false,
    regeneratesAiKernel: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    brokerBackendsDeferred: false,
    redisStreamsActive: true,
    kafkaAdapterDeferred: true,
    staticRoutingCatalog: true,
  };
}

export function aiFabricRoutingTable() {
  return [
    { cloud: 'language', path: '/language', api: '/v1/language-cloud/products' },
    { cloud: 'speech', path: '/speech', api: '/v1/speech-cloud/products' },
    { cloud: 'voice', path: '/voice-cloud', api: '/v1/voice-cloud/products' },
    { cloud: 'intelligence', path: '/intelligence-cloud', api: '/v1/intelligence-cloud/products' },
    { cloud: 'knowledge', path: '/knowledge-cloud', api: '/v1/knowledge-cloud/products' },
    { cloud: 'inference', path: '/inference-cloud', api: '/v1/inference-cloud/products' },
    { cloud: 'ai-kernel', path: '/ai-kernel', api: '/v1/ai-kernel/products' },
    { cloud: 'foundation-model-cloud', path: '/foundation-model-cloud', api: '/v1/foundation-model-cloud/products' },
    { cloud: 'enterprise', path: '/enterprise', api: null },
    { cloud: 'developer', path: '/developers', api: null },
    { cloud: 'gateway', path: '/gateway', api: '/v1/gateway/products' },
  ];
}
