export type WorkflowMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type WorkflowMarketplaceCapability = {
  id: string;
  name: string;
  status: WorkflowMarketplaceStatus;
  api: string | null;
  notes: string;
};

export const WORKFLOW_MARKETPLACE_CATEGORIES = [
  'automation',
  'templates',
  'industry',
  'business',
  'ai-chains',
  'approval',
  'scheduling',
] as const;

export type WorkflowMarketplaceCategory = (typeof WORKFLOW_MARKETPLACE_CATEGORIES)[number];

/**
 * Library Phase 122 → Workflow Marketplace.
 * Buy/sell/publish sandboxed workflows over Workflow Runtime — not Zapier/Temporal OS.
 * Volume 11: enforce Workflow Runtime sandbox + Policy gate before third-party workflows run.
 */
export function workflowMarketplaceEngineCatalog {
  return {
    product: 'Lugemi Workflow Marketplace',
    note:
      'Workflow Marketplace. Publish/install/run sandboxed workflow templates. Execution always goes through Workflow Runtime run + WorkflowPolicyGate (hard allowlist) and Policy Fabric hard gate — never live step execution. Extends listings kind=workflow. Not a Zapier/Temporal/Airflow OS.',
    capabilities: [
      {
        id: 'automation-templates',
        name: 'Automation Templates',
        status: 'shipped',
        api: 'POST /v1/workflow-marketplace/listings',
        notes: 'category=automation.',
      },
      {
        id: 'workflow-templates',
        name: 'Workflow Templates',
        status: 'shipped',
        api: 'POST /v1/workflow-marketplace/listings',
        notes: 'category=templates.',
      },
      {
        id: 'industry-packs',
        name: 'Industry Packs',
        status: 'shipped',
        api: 'POST /v1/workflow-marketplace/listings',
        notes: 'category=industry.',
      },
      {
        id: 'business-packs',
        name: 'Business Packs',
        status: 'shipped',
        api: 'POST /v1/workflow-marketplace/listings',
        notes: 'category=business.',
      },
      {
        id: 'ai-chains',
        name: 'AI Chains',
        status: 'shipped',
        api: 'POST /v1/workflow-marketplace/listings',
        notes: 'category=ai-chains — sandboxed reason/memory steps, not an AI orchestration OS.',
      },
      {
        id: 'approval-workflows',
        name: 'Approval Workflows',
        status: 'shipped',
        api: 'POST /v1/workflow-marketplace/listings',
        notes: 'category=approval — uses Workflow Runtime approval stubs.',
      },
      {
        id: 'scheduling-templates',
        name: 'Scheduling Templates',
        status: 'shipped',
        api: 'POST /v1/workflow-marketplace/listings',
        notes: 'category=scheduling — not a cron fleet OS.',
      },
      {
        id: 'workflow-security',
        name: 'Workflow Security',
        status: 'shipped',
        api: 'POST /v1/workflow-marketplace/listings/:id/run',
        notes:
          'Run path: FabricPolicyGate → WorkflowRuntime.run → WorkflowPolicyGate → sandbox only. liveStepExecution=false.',
      },
      {
        id: 'workflow-analytics',
        name: 'Workflow Analytics',
        status: 'partial',
        api: 'GET /v1/workflow-marketplace/analytics',
        notes: 'Listing/install/review/run aggregates. Commerce depth deferred to Creator Economy.',
      },
      {
        id: 'workflow-monetization',
        name: 'Workflow Monetization',
        status: 'partial',
        api: 'POST /v1/workflow-marketplace/listings/:id/install',
        notes:
          'Paid listings record MarketplaceSale receipts (15% fee). Stripe Connect when configured — not a payment-processor OS.',
      },
    ] satisfies WorkflowMarketplaceCapability[],
    categories: WORKFLOW_MARKETPLACE_CATEGORIES.map((id) => ({ id })),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsWorkflowRuntime: true,
      extendsMarketplaceListings: true,
      regeneratesWorkflowRuntime: false,
      regeneratesMarketplaceVl090: false,
      zapierOs: false,
      temporalOs: false,
      airflowOs: false,
      liveStepExecution: false,
      sandboxRequired: true,
      workflowPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      realMoneyRiskCategory: true,
    },
    honesty: {
      liveStepExecution: false,
      openToolExecution: false,
      zapierOs: false,
      temporalOs: false,
      airflowOs: false,
      regeneratesWorkflowRuntime: false,
      regeneratesMarketplaceVl090: false,
      sandboxRequired: true,
      workflowPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      realMoneyRiskCategory: true,
      creatorPayoutMathVerifiedLive: false,
    },
    safety: {
      sandboxRequired: true,
      liveStepExecutionForbidden: true,
      workflowPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      policyLogOnlyForbidden: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      note:
        'Volume 11: third-party marketplace workflows must not run until Workflow Runtime sandbox + Policy gates allow. Denied actions (shell.exec, workflow.execute_live, …) always 403.',
    },
    docs: '/docs/WORKFLOW_MARKETPLACE.md',
  };
}
