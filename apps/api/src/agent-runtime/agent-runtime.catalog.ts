export type AgentRuntimeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type AgentRuntimeCapability = {
  id: string;
  name: string;
  status: AgentRuntimeCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Permissions an agent may be granted. Anything else is denied. */
export const AGENT_PERMISSIONS = [
  'reason.plan',
  'reason.reason',
  'memory.put',
  'memory.search',
  'context.assemble',
  'tools.suggest',
  'agent.message',
  'agent.schedule',
] as const;

export type AgentPermission = (typeof AGENT_PERMISSIONS)[number];

/** Always denied — never grantable in this runtime. */
export const AGENT_DENIED_ACTIONS = [
  'external.execute',
  'billing.charge',
  'admin.impersonate',
  'plugin.invoke',
  'workflow.execute_live',
  'shell.exec',
] as const;

export function agentRuntimeMode(): 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_AGENT_RUNTIME_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function agentRuntimeCeilings() {
  return {
    maxAgentsPerWorkspace: Math.min(
      100,
      Math.max(1, Number(process.env.LUGEMI_AGENT_RUNTIME_MAX_AGENTS ?? '20') || 20),
    ),
    maxStepsPerRun: Math.min(
      50,
      Math.max(1, Number(process.env.LUGEMI_AGENT_RUNTIME_MAX_STEPS ?? '8') || 8),
    ),
    mode: agentRuntimeMode(),
    liveToolExecution: false,
    note: 'Sandbox agent runtime. Live open tool execution is forbidden in this runtime.',
  };
}

/**
 * Agent Runtime.
 * Scoped permissions + sandbox required. Not open tool execution.
 */
export function agentRuntimeCatalog() {
  return {
    product: 'Lugemi Agent Runtime',
    note:
      'Agent Runtime. Single/multi-agent sandbox with hard permission allowlists, lifecycle, scheduling stubs, agent memory via Memory Runtime, and marketplace listing counts. Actions are sandboxed — not open function calls against real accounts/data. Policy Runtime is wired as a hard gate via AgentPolicyGate. Not an open agent-orchestration OS.',
    capabilities: [
      {
        id: 'single-agents',
        name: 'Single Agents',
        status: 'shipped',
        api: 'POST /v1/agent-runtime/agents',
        notes: 'Create/run one agent with permission allowlist.',
      },
      {
        id: 'multi-agent-systems',
        name: 'Multi-Agent Systems',
        status: 'partial',
        api: 'POST /v1/agent-runtime/collaborate',
        notes: 'Sandbox collaboration session — not a distributed multi-agent OS.',
      },
      {
        id: 'agent-collaboration',
        name: 'Agent Collaboration',
        status: 'partial',
        api: 'POST /v1/agent-runtime/collaborate',
        notes: 'Sandbox message exchange between agents.',
      },
      {
        id: 'agent-scheduling',
        name: 'Agent Scheduling',
        status: 'partial',
        api: 'POST /v1/agent-runtime/schedule',
        notes: 'Record scheduled runAt — not a cron fleet OS.',
      },
      {
        id: 'agent-memory',
        name: 'Agent Memory',
        status: 'shipped',
        api: 'POST /v1/agent-runtime/memory',
        notes: 'Writes Memory Runtime scope=agent with agentId.',
      },
      {
        id: 'agent-permissions',
        name: 'Agent Permissions',
        status: 'shipped',
        api: 'POST /v1/agent-runtime/run',
        notes: 'Hard allowlist gate — missing permission → 403.',
      },
      {
        id: 'agent-workflows',
        name: 'Agent Workflows',
        status: 'partial',
        api: 'POST /v1/agent-runtime/run',
        notes: 'Sandbox step plans; dedicated Workflow Runtime is (/workflow-runtime).',
      },
      {
        id: 'agent-lifecycle',
        name: 'Agent Lifecycle',
        status: 'shipped',
        api: 'POST /v1/agent-runtime/agents/:id/lifecycle',
        notes: 'draft → active → paused → archived.',
      },
      {
        id: 'agent-marketplace-integration',
        name: 'Agent Marketplace Integration',
        status: 'partial',
        api: 'GET /v1/agent-runtime/marketplace',
        notes: 'Counts marketplace listings kind=agent when present.',
      },
      {
        id: 'runtime',
        name: 'Runtime',
        status: 'shipped',
        api: 'GET /v1/agent-runtime/engine',
        notes: 'REST runtime hub.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/agent-runtime/engine',
        notes: 'REST surfaces.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'agentRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'deferred',
        api: null,
        notes: 'Realtime agent bus deferred.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/agent-runtime/monitoring',
        notes: 'Counts + safety honesty.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/AGENT_RUNTIME.md',
        notes: 'Product doc + ADR-0130.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/agent-runtime/run',
        notes: 'Ships with Nest API — sandbox by default.',
      },
    ] satisfies AgentRuntimeCapability[],
    permissions: AGENT_PERMISSIONS.map((id) => ({ id })),
    deniedActions: AGENT_DENIED_ACTIONS.map((id) => ({ id })),
    honesty: {
      openToolExecution: false,
      liveExternalActionsByDefault: false,
      langGraphOs: false,
      autoGptOs: false,
      regeneratesVolumes1to7: false,
      scopedPermissionsRequired: true,
      sandboxRequired: true,
      policyHardGateRequired: true,
      policyRuntimeWired: true,
      localPermissionHardGate: true,
      orgWorkspaceScoped: true,
    },
    links: {
      console: '/agent-runtime',
      hub: '/ai-kernel',
      memoryRuntime: '/memory-runtime',
      reasoningRuntime: '/reasoning-runtime',
      contextRuntime: '/context-runtime',
      workflows: '/workflows',
      marketplace: '/marketplace',
      docs: '/docs/AGENT_RUNTIME.md',
      adr: '/docs/adr/0130-agent-runtime.md',
    },
  };
}
