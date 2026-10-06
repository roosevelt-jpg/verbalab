export type PolicyRuntimeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type PolicyRuntimeCapability = {
  id: string;
  name: string;
  status: PolicyRuntimeCapabilityStatus;
  api: string | null;
  notes: string;
};

export type PolicyKind =
  | 'security'
  | 'compliance'
  | 'organization'
  | 'ai'
  | 'billing'
  | 'regional'
  | 'routing'
  | 'governance';

export const POLICY_KINDS: PolicyKind[] = [
  'security',
  'compliance',
  'organization',
  'ai',
  'billing',
  'regional',
  'routing',
  'governance',
];

export type PolicyRuntimeTarget =
  | 'agent-runtime'
  | 'workflow-runtime'
  | 'plugin-runtime'
  | '*';

/** Globally denied by Policy Runtime for all kernel action runtimes. */
export const POLICY_GLOBAL_DENIES = [
  'external.execute',
  'billing.charge',
  'admin.impersonate',
  'shell.exec',
  'network.fetch',
  'filesystem.write',
  'plugin.invoke_live',
  'workflow.execute_live',
] as const;

export function policyRuntimeMode(): 'enforce' | 'disabled' {
  const raw = (process.env.LUGEMI_POLICY_RUNTIME_MODE ?? 'enforce').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'enforce';
}

export function policyRuntimeCeilings() {
  return {
    maxPoliciesPerWorkspace: Math.min(
      200,
      Math.max(1, Number(process.env.LUGEMI_POLICY_RUNTIME_MAX_POLICIES ?? '50') || 50),
    ),
    mode: policyRuntimeMode(),
    logOnlyForbidden: true,
    hardGateRequired: true,
    note: 'Policy Runtime hard-gates Agent/Workflow/Plugin. Log-only mode is forbidden.',
  };
}

/**
 * Policy Runtime.
 * Must hard-gate Agent/Workflow/Plugin — not log/flag decoration.
 */
export function policyRuntimeCatalog() {
  return {
    product: 'Lugemi Policy Runtime',
    note:
      'Policy Runtime. Shared hard-gate enforcement for Agent/Workflow/Plugin Runtimes. Org policies (deny rules) and global denies block actions with 403 — not log-only. Extends local runtime allowlists; does not invent OPA/Cedar enterprise policy OS. Wired into AgentPolicyGate / WorkflowPolicyGate / PluginPolicyGate.',
    capabilities: [
      {
        id: 'security-policies',
        name: 'Security Policies',
        status: 'shipped',
        api: 'POST /v1/policy-runtime/policies',
        notes: 'Deny rules + global security denies.',
      },
      {
        id: 'compliance-policies',
        name: 'Compliance Policies',
        status: 'partial',
        api: 'POST /v1/policy-runtime/policies',
        notes: 'Org-scoped compliance deny rules — not a GRC OS.',
      },
      {
        id: 'organization-policies',
        name: 'Organization Policies',
        status: 'shipped',
        api: 'POST /v1/policy-runtime/policies',
        notes: 'Workspace deny/allow lists for kernel runtimes.',
      },
      {
        id: 'ai-policies',
        name: 'AI Policies',
        status: 'shipped',
        api: 'POST /v1/policy-runtime/evaluate',
        notes: 'Hard-gates AI kernel action runtimes.',
      },
      {
        id: 'billing-policies',
        name: 'Billing Policies',
        status: 'partial',
        api: 'POST /v1/policy-runtime/evaluate',
        notes: 'billing.charge globally denied; not a billing OS.',
      },
      {
        id: 'regional-policies',
        name: 'Regional Policies',
        status: 'partial',
        api: 'POST /v1/policy-runtime/policies',
        notes: 'Optional region tag on policies — not multi-region policy OS.',
      },
      {
        id: 'routing-policies',
        name: 'Routing Policies',
        status: 'partial',
        api: 'POST /v1/policy-runtime/policies',
        notes: 'Declarative routing denies — AI Router remains separate product.',
      },
      {
        id: 'governance-policies',
        name: 'Governance Policies',
        status: 'partial',
        api: 'POST /v1/policy-runtime/policies',
        notes: 'Governance deny rules — not enterprise GRC OS.',
      },
      {
        id: 'policy-engine',
        name: 'Policy Engine',
        status: 'shipped',
        api: 'POST /v1/policy-runtime/evaluate',
        notes: 'Hard allow/deny decisions; log-only forbidden.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/policy-runtime/engine',
        notes: 'REST surfaces.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'policyRuntimeEngine',
        notes: 'CQRS façade query.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'policyRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/policy-runtime/monitoring',
        notes: 'Deny counts + wiring honesty.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/POLICY_RUNTIME.md',
        notes: 'Product documentation.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/policy-runtime/evaluate',
        notes: 'Ships with Nest API — enforce by default.',
      },
    ] satisfies PolicyRuntimeCapability[],
    globalDenies: POLICY_GLOBAL_DENIES.map((id) => ({ id })),
    kinds: POLICY_KINDS.map((id) => ({ id })),
    honesty: {
      hardGate: true,
      logOnly: false,
      logOnlyForbidden: true,
      opaOs: false,
      cedarOs: false,
      enterpriseGrcOs: false,
      regeneratesVolumes1to7: false,
      wiredIntoAgentRuntime: true,
      wiredIntoWorkflowRuntime: true,
      wiredIntoPluginRuntime: true,
      orgWorkspaceScoped: true,
    },
    links: {
      console: '/policy-runtime',
      hub: '/ai-kernel',
      agentRuntime: '/agent-runtime',
      workflowRuntime: '/workflow-runtime',
      pluginRuntime: '/plugin-runtime',
      docs: '/docs/POLICY_RUNTIME.md',
      adr: '/docs/adr/0133-policy-runtime.md',
    },
  };
}
