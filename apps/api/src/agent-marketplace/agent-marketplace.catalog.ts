export type AgentMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type AgentMarketplaceCapability = {
  id: string;
  name: string;
  status: AgentMarketplaceStatus;
  api: string | null;
  notes: string;
};

export const AGENT_MARKETPLACE_CATEGORIES = [
  'business',
  'healthcare',
  'government',
  'legal',
  'financial',
  'education',
  'voice',
  'sales',
  'support',
  'research',
] as const;

export type AgentMarketplaceCategory = (typeof AGENT_MARKETPLACE_CATEGORIES)[number];

/**
 * Agent Marketplace.
 * Buy/sell/publish sandboxed agents over Agent Runtime — not open agent-orchestration OS.
 * Platform docs: enforce Agent Runtime sandbox + Policy gate before third-party agents run.
 */
export function agentMarketplaceEngineCatalog() {
  return {
    product: 'Lugemi Agent Marketplace',
    note:
      'Agent Marketplace. Publish/install/run sandboxed enterprise agents. Execution always goes through Agent Runtime run + AgentPolicyGate (hard allowlist) and Policy Fabric hard gate — never open tool execution. Extends listings kind=agent. Not an open agent-orchestration OS.',
    capabilities: [
      {
        id: 'business-agents',
        name: 'Business Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=business.',
      },
      {
        id: 'healthcare-agents',
        name: 'Healthcare Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=healthcare — sandbox metadata only, not clinical OS.',
      },
      {
        id: 'government-agents',
        name: 'Government Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=government.',
      },
      {
        id: 'legal-agents',
        name: 'Legal Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=legal — not a law-practice OS.',
      },
      {
        id: 'financial-agents',
        name: 'Financial Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=financial — not a payments OS.',
      },
      {
        id: 'education-agents',
        name: 'Education Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=education.',
      },
      {
        id: 'voice-agents',
        name: 'Voice Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=voice — ties to voice surfaces; not a voice company OS.',
      },
      {
        id: 'sales-agents',
        name: 'Sales Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=sales.',
      },
      {
        id: 'support-agents',
        name: 'Support Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=support.',
      },
      {
        id: 'research-agents',
        name: 'Research Agents',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings',
        notes: 'category=research.',
      },
      {
        id: 'agent-security',
        name: 'Agent Security',
        status: 'shipped',
        api: 'POST /v1/agent-marketplace/listings/:id/run',
        notes:
          'Run path: FabricPolicyGate → AgentRuntime.run → AgentPolicyGate → sandbox only. liveToolExecution=false.',
      },
      {
        id: 'agent-analytics',
        name: 'Agent Analytics',
        status: 'partial',
        api: 'GET /v1/agent-marketplace/analytics',
        notes: 'Listing/install/review/run aggregates. Commerce depth deferred to Creator Economy.',
      },
      {
        id: 'agent-monetization',
        name: 'Agent Monetization',
        status: 'partial',
        api: 'POST /v1/agent-marketplace/listings/:id/install',
        notes:
          'Paid listings record MarketplaceSale receipts (15% fee). Stripe Connect when configured — not a payment-processor OS.',
      },
    ] satisfies AgentMarketplaceCapability[],
    categories: AGENT_MARKETPLACE_CATEGORIES.map((id) => ({ id })),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsAgentRuntime: true,
      extendsMarketplaceListings: true,
      regeneratesAgentRuntime: false,
      regeneratesMarketplaceVl090: false,
      langGraphOs: false,
      autoGptOs: false,
      liveToolExecution: false,
      sandboxRequired: true,
      agentPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      realMoneyRiskCategory: true,
    },
    honesty: {
      liveToolExecution: false,
      openToolExecution: false,
      langGraphOs: false,
      autoGptOs: false,
      regeneratesAgentRuntime: false,
      regeneratesMarketplaceVl090: false,
      sandboxRequired: true,
      agentPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      realMoneyRiskCategory: true,
      creatorPayoutMathVerifiedLive: false,
    },
    safety: {
      sandboxRequired: true,
      liveToolExecutionForbidden: true,
      agentPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      policyLogOnlyForbidden: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      note:
        ': third-party marketplace agents must not run until Agent Runtime sandbox + Policy gates allow. Denied actions (shell.exec, external.execute, …) always 403.',
    },
    docs: '/docs/AGENT_MARKETPLACE.md',
  };
}
