export type KernelRuntimeStatus = 'shipped' | 'partial' | 'deferred';

export type KernelRuntimeRow = {
  id: string;
  name: string;
  status: KernelRuntimeStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Runtime map. Internal OS hub — not a customer product. */
export function aiKernelRuntimeCatalog(): KernelRuntimeRow[] {
  return [
    {
      id: 'ai-kernel',
      name: 'Lugemi AI Kernel',
      status: 'shipped',
      api: 'GET /v1/ai-kernel/products',
      console: '/ai-kernel',
      notes:
        'Internal runtime hub. Not a customer-facing product. Routes future Agent/Workflow/Plugin execution through Nest kernel modules — not a Linux/VAIOS rewrite.',
    },
    {
      id: 'memory-runtime',
      name: 'Memory Runtime',
      status: 'partial',
      api: 'GET /v1/memory-runtime/engine',
      console: '/memory-runtime',
      notes:
        'Kernel memory over existing MemoryRecord. Extends Memory Cloud — not Mem0/replication OS.',
    },
    {
      id: 'prompt-runtime',
      name: 'Prompt Runtime',
      status: 'partial',
      api: 'GET /v1/prompt-runtime/engine',
      console: '/prompt-runtime',
      notes:
        'Kernel prompt execution over existing. Variables/validate/cache — not research lab/mesh OS.',
    },
    {
      id: 'context-runtime',
      name: 'Context Runtime',
      status: 'partial',
      api: 'GET /v1/context-runtime/engine',
      console: '/context-runtime',
      notes:
        'Kernel assembly over existing Context Engine. Prioritize/compress/retrieve — not infinite-context OS.',
    },
    {
      id: 'reasoning-runtime',
      name: 'Reasoning Runtime',
      status: 'partial',
      api: 'GET /v1/reasoning-runtime/engine',
      console: '/reasoning-runtime',
      notes:
        'Kernel reasoning over existing. Plan/reflect/eval/history — not custom reasoner/tool-exec OS.',
    },
    {
      id: 'agent-runtime',
      name: 'Agent Runtime',
      status: 'partial',
      api: 'GET /v1/agent-runtime/engine',
      console: '/agent-runtime',
      notes:
        'Sandbox agents with hard permission allowlists. Not open tool execution; Policy Runtime hardens further.',
    },
    {
      id: 'workflow-runtime',
      name: 'Workflow Runtime',
      status: 'partial',
      api: 'GET /v1/workflow-runtime/engine',
      console: '/workflow-runtime',
      notes:
        'Sandbox multi-step workflows with hard permission allowlists. Extends /v1/workflows; not a distributed-workflow OS.',
    },
    {
      id: 'plugin-runtime',
      name: 'Plugin Runtime',
      status: 'partial',
      api: 'GET /v1/plugin-runtime/engine',
      console: '/plugin-runtime',
      notes:
        'Sandbox plugin registry with hard permission allowlists. Not live code/network plugins; Policy Runtime hardens further.',
    },
    {
      id: 'policy-runtime',
      name: 'Policy Runtime',
      status: 'partial',
      api: 'GET /v1/policy-runtime/engine',
      console: '/policy-runtime',
      notes:
        'Hard-gate enforcement for Agent/Workflow/Plugin. Blocks with 403 — not log-only.',
    },
    {
      id: 'kernel-telemetry',
      name: 'Kernel Telemetry',
      status: 'partial',
      api: 'GET /v1/ai-kernel/monitoring',
      console: '/ai-kernel',
      notes: 'Foundation monitoring snapshot — full kernel telemetry deferred with runtimes.',
    },
  ];
}

export function aiKernelArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_ai_kernel_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    rest: true,
    graphql: true,
    sdk: '@lugemi/sdk',
    cli: '@lugemi/cli',
    docker: true,
    terraform: true,
    kubernetes: true,
    primaryRegion: 'af-south-1',
    deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    customerFacingProduct: false,
    linuxOsRewrite: false,
    vaiosOs: false,
    regeneratesVolumes1to7: false,
    extendsInferenceCloud: true,
    extendsMemoryCloud: true,
    extendsPromptIntelligence: true,
    extendsContextEngine: true,
    extendsReasoningCloud: true,
    extendsAiOrchestration: true,
    agentActionBoundariesRequired: true,
    policyHardGateRequired: true,
    policyLogOnlyForbidden: true,
  };
}

export function aiKernelSafetyNotes() {
  return {
    agentWorkflowPluginMustSandbox: true,
    scopedPermissionsRequired: true,
    policyMustHardGate: true,
    policyLogOnlyRejected: true,
    note:
      'Platform docs: Agent/Workflow/Plugin Runtimes must have scoped permissions and sandboxing — not open function calls. Policy Runtime must be a hard gate wired into those runtimes, not decoration that only logs.',
  };
}
