/**
 * Library Phase 161 → AI Governance Platform (VL-294).
 * Real human approval workflow — not post-facto log only.
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ApprovalKind =
  | 'model_promotion'
  | 'policy_change'
  | 'marketplace_listing'
  | 'prompt_approval'
  | 'dataset_approval'
  | 'agent_approval';

export type ApprovalRequest = {
  id: string;
  kind: ApprovalKind;
  title: string;
  requester: string;
  status: ApprovalStatus;
  humanSignOffRequired: true;
  riskLevel: 'high' | 'medium' | 'low';
  notes: string;
  continuousLearningPromoteGateRef?: string;
};

export function seedApprovalRequests(): ApprovalRequest[] {
  return [
    {
      id: 'gov-model-001',
      kind: 'model_promotion',
      title: 'Promote support-triage v2.1',
      requester: 'mlops-bot',
      status: 'pending',
      humanSignOffRequired: true,
      riskLevel: 'high',
      notes: 'Requires human sign-off before Continuous Learning promote.',
      continuousLearningPromoteGateRef: 'promo-ready-001',
    },
    {
      id: 'gov-policy-001',
      kind: 'policy_change',
      title: 'Tighten external-comms deny',
      requester: 'trust-admin',
      status: 'pending',
      humanSignOffRequired: true,
      riskLevel: 'high',
      notes: 'Policy Runtime change — human approval required.',
    },
    {
      id: 'gov-mkt-001',
      kind: 'marketplace_listing',
      title: 'List agent-research-assist',
      requester: 'marketplace-ops',
      status: 'pending',
      humanSignOffRequired: true,
      riskLevel: 'medium',
      notes: 'Marketplace listing cannot go live without approval.',
    },
    {
      id: 'gov-prompt-001',
      kind: 'prompt_approval',
      title: 'Approve customer-faq prompt v3',
      requester: 'promptops',
      status: 'approved',
      humanSignOffRequired: true,
      riskLevel: 'low',
      notes: 'Human approved prompt change.',
    },
    {
      id: 'gov-dataset-001',
      kind: 'dataset_approval',
      title: 'Approve training corpus batch-17',
      requester: 'data-ops',
      status: 'rejected',
      humanSignOffRequired: true,
      riskLevel: 'high',
      notes: 'Rejected — provenance incomplete.',
    },
    {
      id: 'gov-agent-001',
      kind: 'agent_approval',
      title: 'Approve ops-runner agent staging→live',
      requester: 'agentops',
      status: 'pending',
      humanSignOffRequired: true,
      riskLevel: 'medium',
      notes: 'Agent promotion requires human sign-off.',
    },
  ];
}

export function aiGovernancePlatformEngineCatalog(approvals: ApprovalRequest[]) {
  return {
    product: 'Lugemi AI Governance Platform',
    capabilities: [
      { id: 'model_approval', name: 'Model Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'prompt_approval', name: 'Prompt Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'dataset_approval', name: 'Dataset Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'agent_approval', name: 'Agent Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'policy_approval', name: 'Policy Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'change_control', name: 'Change Control', status: 'shipped', notes: 'pending|approved|rejected.' },
      { id: 'risk_assessment', name: 'Risk Assessment', status: 'shipped', notes: 'Risk levels on requests.' },
      { id: 'approval_workflow', name: 'Approval Workflow', status: 'shipped', notes: 'Real workflow, not post-facto log.' },
      { id: 'model_cards', name: 'Model Cards', status: 'shipped', notes: 'Card catalog seed.' },
      { id: 'dataset_cards', name: 'Dataset Cards', status: 'shipped', notes: 'Card catalog seed.' },
      { id: 'ai_cards', name: 'AI Cards', status: 'shipped', notes: 'Card catalog seed.' },
    ],
    approvals,
    pending: approvals.filter((a) => a.status === 'pending'),
    honesty: {
      humanSignOffRequired: true,
      postFactoLogOnly: false,
      regeneratesContinuousLearning: false,
      referencesContinuousLearningPromoteGates: true,
      regeneratesPolicyRuntime: false,
    },
    safety: {
      humanSignOffRequired: true,
      note:
        'Consequential decisions (model promotion, policy change, marketplace listing) require human approve/reject — not post-facto logging.',
    },
    docs: '/docs/AI_GOVERNANCE_PLATFORM.md',
    note: 'AI Governance Platform (VL-294). Human approval workflow with pending|approved|rejected statuses.',
  };
}
