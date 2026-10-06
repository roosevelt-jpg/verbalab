export type PromptFabricStatus = 'shipped' | 'partial' | 'deferred';

export type PromptFabricCapability = {
  id: string;
  name: string;
  status: PromptFabricStatus;
  api: string | null;
  notes: string;
};

export type PromptFabricRoute = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

/**
 * Prompt Fabric.
 * Cross-cloud prompt routing over Prompt Runtime — not a prompt mesh / research lab OS.
 */
export function promptFabricCapabilityCatalog(): PromptFabricCapability[] {
  return [
    {
      id: 'prompt-fabric',
      name: 'Prompt Fabric',
      status: 'shipped',
      api: 'GET /v1/prompt-fabric/products',
      notes:
        'Prompt platform hub. Extends Prompt Runtime — does not regenerate .',
    },
    {
      id: 'prompt-platform',
      name: 'Prompt Platform',
      status: 'shipped',
      api: 'GET /v1/prompt-fabric/products',
      notes: 'Fabric façade over Prompt Runtime execute/templates/versions.',
    },
    {
      id: 'prompt-routing',
      name: 'Prompt Routing',
      status: 'shipped',
      api: 'POST /v1/prompt-fabric/route',
      notes: 'Feature→key via Prompt Runtime + cloud handoff routes — not prompt mesh OS.',
    },
    {
      id: 'prompt-versioning',
      name: 'Prompt Versioning',
      status: 'shipped',
      api: 'GET /v1/prompt-fabric/versions',
      notes: 'Façade over Prompt Runtime / PromptVersion rows.',
    },
    {
      id: 'prompt-synchronization',
      name: 'Prompt Synchronization',
      status: 'shipped',
      api: 'POST /v1/prompt-fabric/sync',
      notes: 'Same-org workspace sync cursors for prompt keys — not CRDT cluster OS.',
    },
    {
      id: 'prompt-distribution',
      name: 'Prompt Distribution',
      status: 'shipped',
      api: 'POST /v1/prompt-fabric/distribute',
      notes: 'Same-org distribution plans + optional Event Fabric CloudEvents.',
    },
    {
      id: 'prompt-validation',
      name: 'Prompt Validation',
      status: 'shipped',
      api: 'POST /v1/prompt-fabric/validate',
      notes: 'Delegates to Prompt Runtime validate (ceilings + heuristics).',
    },
    {
      id: 'prompt-policies',
      name: 'Prompt Policies',
      status: 'shipped',
      api: 'GET /v1/policy-runtime/engine',
      notes:
        'Discovery handoff to Policy Runtime today; fabric-wide hard gate is Policy Fabric.',
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: 'shipped',
      api: 'GET /v1/prompt-fabric/monitoring',
      notes: 'Route/validate/sync/distribute counters + honesty.',
    },
  ];
}

export function promptFabricRoutingTable(): PromptFabricRoute[] {
  return [
    {
      kind: 'chat',
      name: 'Chat Prompts',
      target: 'prompt-runtime',
      api: 'POST /v1/prompt-runtime/execute',
      cloud: 'ai-kernel',
      notes: 'Managed chat key via Prompt Runtime.',
    },
    {
      kind: 'rag',
      name: 'RAG Prompts',
      target: 'prompt-runtime',
      api: 'POST /v1/prompt-runtime/execute',
      cloud: 'knowledge',
      notes: 'Grounded RAG system prompt key.',
    },
    {
      kind: 'voice_faq',
      name: 'Voice FAQ Prompts',
      target: 'prompt-runtime',
      api: 'POST /v1/prompt-runtime/execute',
      cloud: 'voice',
      notes: 'Voice FAQ managed key.',
    },
    {
      kind: 'translate',
      name: 'Translate Feature Route',
      target: 'prompt-runtime',
      api: 'POST /v1/prompt-runtime/route',
      cloud: 'language',
      notes: 'Sandbox feature→chat map — not dedicated MT prompt OS.',
    },
    {
      kind: 'templates',
      name: 'Prompt Templates',
      target: 'prompt-runtime',
      api: 'GET /v1/prompt-runtime/templates',
      cloud: 'ai-kernel',
      notes: 'Template registry façade.',
    },
    {
      kind: 'versions',
      name: 'Prompt Versions',
      target: 'prompt-runtime',
      api: 'GET /v1/prompt-runtime/versions',
      cloud: 'ai-kernel',
      notes: 'Version list over existing.',
    },
    {
      kind: 'intelligence',
      name: 'Prompt Intelligence',
      target: 'prompt-intelligence',
      api: 'GET /v1/prompt-intelligence/engine',
      cloud: 'intelligence',
      notes: 'Discovery handoff — not regenerated.',
    },
    {
      kind: 'policy',
      name: 'Prompt Policies',
      target: 'policy-runtime',
      api: 'GET /v1/policy-runtime/engine',
      cloud: 'ai-kernel',
      notes: 'Policy Runtime until Policy Fabric.',
    },
    {
      kind: 'context',
      name: 'Context Fabric Prompt',
      target: 'context-fabric',
      api: 'POST /v1/context-fabric/propagate',
      cloud: 'ai-fabric',
      notes: 'Assemble prompt-shaped context via Context Fabric.',
    },
  ];
}

export function promptFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_prompt_fabric',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'delegates_to_prompt_runtime',
    eventDriven: 'optional_event_fabric_cloudevents',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiFabric: true,
    extendsPromptRuntime: true,
    regeneratesPromptRuntime: false,
    regeneratesPromptIntelligence: false,
    regeneratesPriorLayers: false,
    customerFacingProduct: false,
    promptMeshOs: false,
    autoPromptResearchLab: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    note:
      'Prompt Fabric. Router/versioning/sync/distribution/validation over Prompt Runtime. Prompt policies via Policy Runtime until Policy Fabric. Not a prompt mesh or research lab OS.',
  };
}

export function promptFabricHonesty() {
  return {
    customerFacingProduct: false,
    promptMeshOs: false,
    autoPromptResearchLab: false,
    llmAsJudge: false,
    regeneratesPromptRuntime: false,
    regeneratesPromptIntelligence: false,
    regeneratesPriorLayers: false,
    extendsPromptRuntime: true,
    crossWorkspaceSameOrgOnly: true,
    crossOrgDataPlane: false,
    optionalEventFabricPropagation: true,
    promptPoliciesViaPolicyRuntime: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
  };
}
