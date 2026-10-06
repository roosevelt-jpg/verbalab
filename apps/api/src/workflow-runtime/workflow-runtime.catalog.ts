export type WorkflowRuntimeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type WorkflowRuntimeCapability = {
  id: string;
  name: string;
  status: WorkflowRuntimeCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Step permissions a workflow may be granted. Anything else is denied. */
export const WORKFLOW_PERMISSIONS = [
  'reason.plan',
  'memory.put',
  'memory.search',
  'context.assemble',
  'workflow.approve',
  'workflow.rollback',
  'workflow.notify',
  'workflow.schedule',
] as const;

export type WorkflowPermission = (typeof WORKFLOW_PERMISSIONS)[number];

/** Always denied — never grantable in this runtime. */
export const WORKFLOW_DENIED_ACTIONS = [
  'external.execute',
  'billing.charge',
  'admin.impersonate',
  'plugin.invoke',
  'shell.exec',
  'workflow.execute_live',
] as const;

export function workflowRuntimeMode(): 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_WORKFLOW_RUNTIME_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function workflowRuntimeCeilings() {
  return {
    maxWorkflowsPerWorkspace: Math.min(
      100,
      Math.max(1, Number(process.env.LUGEMI_WORKFLOW_RUNTIME_MAX_WORKFLOWS ?? '20') || 20),
    ),
    maxStepsPerRun: Math.min(
      50,
      Math.max(1, Number(process.env.LUGEMI_WORKFLOW_RUNTIME_MAX_STEPS ?? '10') || 10),
    ),
    maxRetries: Math.min(
      5,
      Math.max(0, Number(process.env.LUGEMI_WORKFLOW_RUNTIME_MAX_RETRIES ?? '2') || 2),
    ),
    mode: workflowRuntimeMode(),
    liveStepExecution: false,
    note: 'Sandbox workflow runtime. Live open step execution against real accounts is forbidden in this runtime.',
  };
}

/**
 * Workflow Runtime.
 * Scoped permissions + sandbox required. Extends /v1/workflows — not a distributed-workflow OS.
 */
export function workflowRuntimeCatalog() {
  return {
    product: 'Lugemi Workflow Runtime',
    note:
      'Workflow Runtime. Multi-step sandbox workflows with hard permission allowlists, sequential/parallel step plans, retries, human-approval stubs, rollback markers, versioning, and replay. Extends existing /v1/workflows product — does not regenerate it or invent a distributed-workflow OS. Actions are sandboxed; Policy Runtime is wired as a hard gate via WorkflowPolicyGate.',
    capabilities: [
      {
        id: 'workflow-execution',
        name: 'Workflow Execution',
        status: 'shipped',
        api: 'POST /v1/workflow-runtime/run',
        notes: 'Sandbox sequential/parallel step runs with hard allowlist.',
      },
      {
        id: 'workflow-scheduling',
        name: 'Workflow Scheduling',
        status: 'partial',
        api: 'POST /v1/workflow-runtime/schedule',
        notes: 'Record runAt — not a cron fleet OS.',
      },
      {
        id: 'retries',
        name: 'Retries',
        status: 'partial',
        api: 'POST /v1/workflow-runtime/run',
        notes: 'Bounded sandbox retries on simulated failures.',
      },
      {
        id: 'human-approval',
        name: 'Human Approval',
        status: 'partial',
        api: 'POST /v1/workflow-runtime/approve',
        notes: 'Approval gate stub — not an enterprise BPM OS.',
      },
      {
        id: 'rollback',
        name: 'Rollback',
        status: 'partial',
        api: 'POST /v1/workflow-runtime/rollback',
        notes: 'Marks run rolled back — not distributed saga OS.',
      },
      {
        id: 'parallel-execution',
        name: 'Parallel Execution',
        status: 'partial',
        api: 'POST /v1/workflow-runtime/run',
        notes: 'Sandbox parallel groups — in-process only.',
      },
      {
        id: 'sequential-execution',
        name: 'Sequential Execution',
        status: 'shipped',
        api: 'POST /v1/workflow-runtime/run',
        notes: 'Default step mode.',
      },
      {
        id: 'distributed-execution',
        name: 'Distributed Execution',
        status: 'deferred',
        api: null,
        notes: 'Not a distributed workflow OS (distributed-workflow parity deferred).',
      },
      {
        id: 'workflow-versioning',
        name: 'Workflow Versioning',
        status: 'shipped',
        api: 'POST /v1/workflow-runtime/workflows/:id/version',
        notes: 'Version bump stored as kernel MemoryRecords.',
      },
      {
        id: 'workflow-replay',
        name: 'Workflow Replay',
        status: 'shipped',
        api: 'POST /v1/workflow-runtime/replay',
        notes: 'Replays recorded sandbox run steps (simulated).',
      },
      {
        id: 'runtime',
        name: 'Workflow Runtime',
        status: 'shipped',
        api: 'GET /v1/workflow-runtime/engine',
        notes: 'REST runtime hub.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/workflow-runtime/engine',
        notes: 'REST surfaces.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'workflowRuntimeEngine',
        notes: 'CQRS façade query.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'workflowRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/workflow-runtime/monitoring',
        notes: 'Counts + safety honesty.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/WORKFLOW_RUNTIME.md',
        notes: 'Product doc + ADR-0131.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/workflow-runtime/run',
        notes: 'Ships with Nest API — sandbox by default.',
      },
    ] satisfies WorkflowRuntimeCapability[],
    permissions: WORKFLOW_PERMISSIONS.map((id) => ({ id })),
    deniedActions: WORKFLOW_DENIED_ACTIONS.map((id) => ({ id })),
    honesty: {
      openToolExecution: false,
      liveStepExecution: false,
      temporalOs: false,
      airflowOs: false,
      distributedWorkflowOs: false,
      regeneratesVolumes1to7: false,
      regeneratesWorkflowsProduct: false,
      extendsWorkflowsProduct: true,
      scopedPermissionsRequired: true,
      sandboxRequired: true,
      policyHardGateRequired: true,
      policyRuntimeWired: true,
      localPermissionHardGate: true,
      orgWorkspaceScoped: true,
    },
    links: {
      console: '/workflow-runtime',
      hub: '/ai-kernel',
      workflowsProduct: '/workflows',
      agentRuntime: '/agent-runtime',
      memoryRuntime: '/memory-runtime',
      reasoningRuntime: '/reasoning-runtime',
      docs: '/docs/WORKFLOW_RUNTIME.md',
      adr: '/docs/adr/0131-workflow-runtime.md',
    },
  };
}
