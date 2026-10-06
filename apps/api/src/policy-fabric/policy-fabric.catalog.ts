export type PolicyFabricStatus = 'shipped' | 'partial' | 'deferred';

export type PolicyFabricCapability = {
  id: string;
  name: string;
  status: PolicyFabricStatus;
  api: string | null;
  notes: string;
};

export type PolicyFabricRoute = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

export type PolicyPipeline = {
  id: string;
  name: string;
  steps: string[];
  notes: string;
};

/** Fabric-bus actions that are always hard-denied (never log-only). */
export const FABRIC_GLOBAL_DENIES = [
  'fabric.execute_live',
  'fabric.cross_org_sync',
  'fabric.open_tool_execution',
  'fabric.bypass_policy',
  'external.execute',
  'shell.exec',
] as const;

export const FABRIC_BUSES = [
  'event-fabric',
  'context-fabric',
  'knowledge-fabric',
  'prompt-fabric',
  'reasoning-fabric',
  'memory-fabric',
  'agent-fabric',
  'policy-fabric',
  'plugin-marketplace',
  'model-marketplace',
  'dataset-marketplace',
  'prompt-marketplace',
  'agent-marketplace',
  'workflow-marketplace',
  'connector-marketplace',
  'voice-language-marketplace',
  'creator-economy',
  'african-intelligence-cloud',
  'open-science-platform',
  'synthetic-data-platform',
  'research-cloud',
  'continuous-learning',
  'agentops-platform',
  'mlops-llmops-cloud',
  'cultural-intelligence',
  'african-knowledge-graph',
  'government-intelligence',
  'healthcare-intelligence',
  'financial-intelligence',
] as const;

/**
 * Library Phase 114 → Policy Fabric (VL-247).
 * Fabric-wide hard gate over Policy Runtime — not log-only, not OPA/Cedar enterprise OS.
 */
export function policyFabricCapabilityCatalog(): PolicyFabricCapability[] {
  return [
    {
      id: 'policy-fabric',
      name: 'Policy Fabric',
      status: 'shipped',
      api: 'GET /v1/policy-fabric/products',
      notes:
        'Policy router + fabric-wide hard gate (VL-247). Extends Policy Runtime — does not regenerate VL-222.',
    },
    {
      id: 'policy-engine',
      name: 'Policy Engine',
      status: 'shipped',
      api: 'POST /v1/policy-fabric/assert',
      notes: 'Hard-gate assert/evaluate — denies return 403, never log-only.',
    },
    {
      id: 'policy-synchronization',
      name: 'Policy Synchronization',
      status: 'shipped',
      api: 'POST /v1/policy-fabric/sync',
      notes: 'Same-org sync plan of policy catalogs — not multi-region policy mesh.',
    },
    {
      id: 'policy-distribution',
      name: 'Policy Distribution',
      status: 'shipped',
      api: 'POST /v1/policy-fabric/distribute',
      notes: 'Same-org distribution plans + optional Event Fabric; gated by FabricPolicyGate.',
    },
    {
      id: 'policy-federation',
      name: 'Policy Federation',
      status: 'partial',
      api: 'POST /v1/policy-fabric/federate',
      notes: 'Product-handoff federation catalog — not cross-tenant policy mesh.',
    },
    {
      id: 'security-policies',
      name: 'Security Policies',
      status: 'shipped',
      api: 'POST /v1/policy-runtime/policies',
      notes: 'Handoff to Policy Runtime kind=security.',
    },
    {
      id: 'compliance-policies',
      name: 'Compliance Policies',
      status: 'partial',
      api: 'POST /v1/policy-runtime/policies',
      notes: 'Handoff to Policy Runtime kind=compliance — not GRC OS.',
    },
    {
      id: 'billing-policies',
      name: 'Billing Policies',
      status: 'partial',
      api: 'POST /v1/policy-runtime/policies',
      notes: 'Handoff to Policy Runtime kind=billing.',
    },
    {
      id: 'organization-policies',
      name: 'Organization Policies',
      status: 'shipped',
      api: 'POST /v1/policy-runtime/policies',
      notes: 'Handoff to Policy Runtime kind=organization.',
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: 'shipped',
      api: 'GET /v1/policy-fabric/monitoring',
      notes: 'Assert/deny/distribute counters + honesty.',
    },
  ];
}

export function policyFabricRoutingTable(): PolicyFabricRoute[] {
  return [
    {
      kind: 'security',
      name: 'Security Policies',
      target: 'policy-runtime',
      api: 'POST /v1/policy-runtime/policies',
      cloud: 'ai-kernel',
      notes: 'Security deny rules via Policy Runtime.',
    },
    {
      kind: 'compliance',
      name: 'Compliance Policies',
      target: 'policy-runtime',
      api: 'POST /v1/policy-runtime/policies',
      cloud: 'ai-kernel',
      notes: 'Compliance deny rules — not GRC OS.',
    },
    {
      kind: 'billing',
      name: 'Billing Policies',
      target: 'policy-runtime',
      api: 'POST /v1/policy-runtime/policies',
      cloud: 'ai-kernel',
      notes: 'Billing deny rules via Policy Runtime.',
    },
    {
      kind: 'organization',
      name: 'Organization Policies',
      target: 'policy-runtime',
      api: 'POST /v1/policy-runtime/policies',
      cloud: 'ai-kernel',
      notes: 'Org/workspace deny lists.',
    },
    {
      kind: 'evaluate',
      name: 'Evaluate',
      target: 'policy-runtime',
      api: 'POST /v1/policy-runtime/evaluate',
      cloud: 'ai-kernel',
      notes: 'Decision without throw — still hardGate:true.',
    },
    {
      kind: 'assert',
      name: 'Hard Gate Assert',
      target: 'policy-fabric',
      api: 'POST /v1/policy-fabric/assert',
      cloud: 'ai-kernel',
      notes: '403 on deny — fabric-wide hard gate.',
    },
    {
      kind: 'sync',
      name: 'Synchronization',
      target: 'policy-fabric',
      api: 'POST /v1/policy-fabric/sync',
      cloud: 'ai-kernel',
      notes: 'Same-org policy catalog sync plan.',
    },
  ];
}

export function policyFabricPipelines(): PolicyPipeline[] {
  return [
    {
      id: 'evaluate-assert',
      name: 'Evaluate → Assert',
      steps: ['evaluate', 'assert'],
      notes: 'Preview decision then hard-gate assert.',
    },
    {
      id: 'security-sync',
      name: 'Security → Sync',
      steps: ['security', 'sync'],
      notes: 'Security policy handoff then same-org sync plan.',
    },
    {
      id: 'org-compliance',
      name: 'Organization → Compliance',
      steps: ['organization', 'compliance'],
      notes: 'Org then compliance policy handoffs.',
    },
  ];
}

export function policyFabricVersions() {
  return [
    {
      id: 'hard-gate-v1',
      kind: 'engine',
      version: 1,
      status: 'shipped',
      notes: 'Fabric-wide hard gate (VL-247) — log-only forbidden.',
    },
    {
      id: 'router-v1',
      kind: 'router',
      version: 1,
      status: 'shipped',
      notes: 'Initial policy-kind → Runtime route table.',
    },
    {
      id: 'pipeline-v1',
      kind: 'pipeline',
      version: 1,
      status: 'shipped',
      notes: 'Initial fabric pipeline catalog.',
    },
  ];
}

export function policyFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_policy_fabric',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'delegates_to_policy_runtime',
    eventDriven: 'optional_event_fabric_cloudevents',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiFabric: true,
    extendsPolicyRuntime: true,
    regeneratesPolicyRuntime: false,
    regeneratesVolumes1to9: false,
    customerFacingProduct: false,
    opaCedarOs: false,
    grcOs: false,
    logOnlyMode: false,
    hardGate: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    note:
      'Policy Fabric (VL-247). Fabric-wide hard gate over Policy Runtime. Denies return 403 — never log-only. Not OPA/Cedar/GRC OS.',
  };
}

export function policyFabricHonesty() {
  return {
    customerFacingProduct: false,
    opaCedarOs: false,
    grcOs: false,
    logOnlyMode: false,
    hardGate: true,
    regeneratesPolicyRuntime: false,
    regeneratesVolumes1to9: false,
    extendsPolicyRuntime: true,
    crossWorkspaceSameOrgOnly: true,
    crossOrgDataPlane: false,
    optionalEventFabricPropagation: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    wiredIntoFabricDistribute: true,
  };
}
