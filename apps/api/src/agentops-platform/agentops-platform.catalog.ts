/**
 * Library Phase 154 → AgentOps Platform (VL-287).
 * Over Agent Runtime. policyViolationsVisible=true — surface for humans, not log-only.
 */
export type AgentPolicyViolation = {
  id: string;
  agentId: string;
  action: string;
  outcome: 'blocked' | 'allowed_with_warning';
  policy: string;
  severity: 'high' | 'medium' | 'low';
  visibleToHumans: true;
  notes: string;
};

export function agentopsPolicyViolations(): AgentPolicyViolation[] {
  return [
    {
      id: 'apol-001',
      agentId: 'agent-support-triage',
      action: 'exfiltrate_customer_pii',
      outcome: 'blocked',
      policy: 'data-exfiltration',
      severity: 'high',
      visibleToHumans: true,
      notes: 'Blocked by Policy Runtime — surfaced in AgentOps monitoring.',
    },
    {
      id: 'apol-002',
      agentId: 'agent-ops-runner',
      action: 'invoke_unapproved_tool',
      outcome: 'blocked',
      policy: 'tool-allowlist',
      severity: 'medium',
      visibleToHumans: true,
      notes: 'Tool not on allowlist — human-visible in engine/monitoring.',
    },
    {
      id: 'apol-003',
      agentId: 'agent-research-assist',
      action: 'write_external_email',
      outcome: 'blocked',
      policy: 'external-comms',
      severity: 'high',
      visibleToHumans: true,
      notes: 'External comms blocked — not log-only.',
    },
  ];
}

export function agentopsPlatformEngineCatalog() {
  const policyViolations = agentopsPolicyViolations();
  return {
    product: 'VerbaLab AgentOps Platform',
    capabilities: [
      { id: 'lifecycle', name: 'Lifecycle', status: 'shipped', notes: 'Agent lifecycle states.' },
      { id: 'versioning', name: 'Versioning', status: 'shipped', notes: 'Agent version catalog.' },
      { id: 'eval', name: 'Evaluation', status: 'shipped', notes: 'Agent eval suites.' },
      { id: 'monitoring', name: 'Monitoring', status: 'shipped', notes: 'Human-visible monitoring.' },
      { id: 'replay', name: 'Replay', status: 'shipped', notes: 'Trace replay catalog.' },
      { id: 'memory', name: 'Memory', status: 'shipped', notes: 'Memory ops over Memory Runtime.' },
      { id: 'analytics', name: 'Analytics', status: 'shipped', notes: 'Agent analytics seed.' },
      { id: 'safety', name: 'Safety', status: 'shipped', notes: 'Safety + policy visibility.' },
    ],
    agents: [
      {
        id: 'agent-support-triage',
        name: 'Support triage',
        version: '2.0.1',
        status: 'live',
        notes: 'Over Agent Runtime — Policy-gated.',
      },
      {
        id: 'agent-ops-runner',
        name: 'Ops runner',
        version: '1.1.0',
        status: 'staging',
        notes: 'Staging with AgentOps eval.',
      },
    ],
    policyViolations,
    blockedActions: policyViolations.filter((v) => v.outcome === 'blocked'),
    honesty: {
      regeneratesAgentRuntime: false,
      extendsAgentRuntime: true,
      langGraphOs: false,
      autoGptOs: false,
      policyViolationsVisible: true,
      policyViolationsLogOnly: false,
    },
    safety: {
      policyViolationsVisible: true,
      note: 'Policy violations and blocked actions are surfaced in engine/monitoring for humans — not log-only.',
    },
    docs: '/docs/AGENTOPS_PLATFORM.md',
    note: 'AgentOps Platform (VL-287). Lifecycle/versioning/eval/monitoring/replay/memory/analytics/safety with human-visible policy violations.',
  };
}
