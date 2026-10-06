export type EcosystemProductStatus = 'shipped' | 'partial' | 'deferred';

export type EcosystemProductRow = {
  id: string;
  name: string;
  status: EcosystemProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Library Phase 116 → Ecosystem Foundation (VL-249).
 * Marketplace + monetization hub over existing VL-090+ / voice marketplace —
 * not a payment-processor OS or regenerate of Volumes 1–10.
 * Volume 11 README: real-money risk; Stripe (or equivalent) only; no raw cards.
 */
export function ecosystemProductCatalog(): EcosystemProductRow[] {
  return [
    {
      id: 'ecosystem-cloud',
      name: 'Ecosystem Cloud',
      status: 'shipped',
      api: 'GET /v1/ecosystem-cloud/products',
      console: '/ecosystem-cloud',
      notes:
        'Ecosystem hub (VL-249). Discovery + honesty for marketplaces/monetization. Extends VL-090+/voice marketplace — does not regenerate Volumes 1–10.',
    },
    {
      id: 'content-marketplace',
      name: 'Content Marketplace',
      status: 'shipped',
      api: 'GET /v1/marketplace/listings',
      console: '/marketplace',
      notes:
        'Existing VL-090–092 glossary/prompt/dataset listings + Stripe Connect (ADR-0031–0033). Foundation links here; dedicated kind marketplaces extend later.',
    },
    {
      id: 'voice-marketplace',
      name: 'Voice Marketplace',
      status: 'shipped',
      api: 'GET /v1/voice-marketplace/engine',
      console: '/voice-marketplace',
      notes:
        'Existing voice/pack/language_pack/enterprise marketplace (VL-177 / ADR-0088). Voice & Language Marketplace (VL-257) extends — does not replace.',
    },
    {
      id: 'plugin-marketplace',
      name: 'Plugin Marketplace',
      status: 'shipped',
      api: 'GET /v1/plugin-marketplace/engine',
      console: '/plugin-marketplace',
      notes:
        'VL-250 / Phase 117. Publish/install/run via Plugin Runtime sandbox + PluginPolicyGate + FabricPolicyGate. liveCodeExecution=false.',
    },
    {
      id: 'model-marketplace',
      name: 'Model Marketplace',
      status: 'shipped',
      api: 'GET /v1/model-marketplace/engine',
      console: '/model-marketplace',
      notes:
        'VL-251 / Phase 118. License SKUs over Model Registry; FabricPolicyGate + Stripe honesty. Not Hugging Face / weight CDN OS.',
    },
    {
      id: 'dataset-marketplace',
      name: 'Dataset Marketplace',
      status: 'shipped',
      api: 'GET /v1/dataset-marketplace/engine',
      console: '/dataset-marketplace',
      notes:
        'VL-252 / Phase 119. Extends dataset kind + VL-101 assets; FabricPolicyGate + Stripe honesty. Not Label Studio / Dataset Cloud OS.',
    },
    {
      id: 'prompt-marketplace',
      name: 'Prompt Marketplace',
      status: 'shipped',
      api: 'GET /v1/prompt-marketplace/engine',
      console: '/prompt-marketplace',
      notes:
        'VL-253 / Phase 120. Extends prompt kind + Prompt Fabric; FabricPolicyGate + Stripe honesty. Not a prompt mesh OS.',
    },
    {
      id: 'agent-marketplace',
      name: 'Agent Marketplace',
      status: 'shipped',
      api: 'GET /v1/agent-marketplace/engine',
      console: '/agent-marketplace',
      notes:
        'VL-254 / Phase 121. Agent Runtime sandbox + AgentPolicyGate + FabricPolicyGate; Stripe honesty. Not LangGraph/AutoGPT OS.',
    },
    {
      id: 'workflow-marketplace',
      name: 'Workflow Marketplace',
      status: 'shipped',
      api: 'GET /v1/workflow-marketplace/engine',
      console: '/workflow-marketplace',
      notes:
        'VL-255 / Phase 122. Workflow Runtime sandbox + WorkflowPolicyGate + FabricPolicyGate; Stripe honesty. Not Zapier/Temporal OS.',
    },
    {
      id: 'connector-marketplace',
      name: 'Connector Marketplace',
      status: 'shipped',
      api: 'GET /v1/connector-marketplace/engine',
      console: '/connector-marketplace',
      notes:
        'VL-256 / Phase 123. Entitlement SKUs over connector catalog + Slack (ADR-0026); FabricPolicyGate + Stripe honesty. Not Zapier/iPaaS OS.',
    },
    {
      id: 'voice-language-marketplace',
      name: 'Voice & Language Marketplace',
      status: 'shipped',
      api: 'GET /v1/voice-language-marketplace/engine',
      console: '/voice-language-marketplace',
      notes:
        'VL-257 / Phase 124. Entitlement SKUs over VL-177 voice marketplace + Volume 1 packs; FabricPolicyGate + Stripe honesty. Not ElevenLabs / voice CDN OS.',
    },
    {
      id: 'creator-economy',
      name: 'Creator Economy',
      status: 'shipped',
      api: 'GET /v1/creator-economy/engine',
      console: '/creator-economy',
      notes:
        'VL-258 / Phase 125. Extends VL-092 Connect + MarketplaceSale; hand-checked royalty math; tax/dispute gaps explicit. Stripe-only — not a payment-processor OS.',
    },
    {
      id: 'sdk-marketplace',
      name: 'SDK Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder from Phase 116 product list. Not a package registry OS in Foundation.',
    },
    {
      id: 'template-marketplace',
      name: 'Template Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder from Phase 116 product list. Templates stay deferred until a dedicated phase.',
    },
    {
      id: 'extension-marketplace',
      name: 'Extension Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder from Phase 116 product list. Extensions map to Plugin Marketplace later.',
    },
    {
      id: 'billing-analytics',
      name: 'Ecosystem Billing & Analytics',
      status: 'partial',
      api: 'GET /v1/marketplace/sales',
      console: '/billing',
      notes:
        'Discovery link to existing billing/usage + marketplace sales. Not a new ledger rewrite in Foundation.',
    },
  ];
}

export function ecosystemArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_ecosystem_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_and_existing_marketplace',
    eventDriven: 'audit_jobs_and_event_fabric',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsContentMarketplace: true,
    extendsVoiceMarketplace: true,
    regeneratesVolumes1to10: false,
    regeneratesMarketplaceVl090: false,
    paymentProcessorOs: false,
    storesRawCardData: false,
    stripeOrEquivalentRequired: true,
    pluginAgentSandboxRequired: true,
    taxDisputeOs: false,
    realMoneyRiskCategory: true,
    note:
      'Volume 11 README: real payments/licensing/royalties. Foundation ships discovery hub + honesty. Later phases extend marketplaces; Creator Economy must hand-check payout math; Plugin/Agent marketplaces must enforce Volume 8 sandboxes before third-party code runs.',
  };
}

export function ecosystemHonesty() {
  return {
    paymentProcessorOs: false,
    storesRawCardData: false,
    stripeOrEquivalentRequired: true,
    rollsOwnCardVault: false,
    regeneratesVolumes1to10: false,
    regeneratesMarketplaceVl090: false,
    regeneratesVoiceMarketplace: false,
    pluginAgentSandboxRequired: true,
    taxHandlingComplete: false,
    disputeChargebackComplete: false,
    creatorPayoutMathVerifiedLive: false,
    realMoneyRiskCategory: true,
    pciSelfAssessmentRequiredBeforeLiveCards: true,
  };
}

export function ecosystemRoutingTable() {
  return [
    { surface: 'content-marketplace', path: '/marketplace', api: '/v1/marketplace/listings' },
    { surface: 'voice-marketplace', path: '/voice-marketplace', api: '/v1/voice-marketplace/engine' },
    {
      surface: 'plugin-marketplace',
      path: '/plugin-marketplace',
      api: '/v1/plugin-marketplace/engine',
    },
    {
      surface: 'model-marketplace',
      path: '/model-marketplace',
      api: '/v1/model-marketplace/engine',
    },
    {
      surface: 'dataset-marketplace',
      path: '/dataset-marketplace',
      api: '/v1/dataset-marketplace/engine',
    },
    {
      surface: 'prompt-marketplace',
      path: '/prompt-marketplace',
      api: '/v1/prompt-marketplace/engine',
    },
    {
      surface: 'agent-marketplace',
      path: '/agent-marketplace',
      api: '/v1/agent-marketplace/engine',
    },
    {
      surface: 'workflow-marketplace',
      path: '/workflow-marketplace',
      api: '/v1/workflow-marketplace/engine',
    },
    {
      surface: 'connector-marketplace',
      path: '/connector-marketplace',
      api: '/v1/connector-marketplace/engine',
    },
    {
      surface: 'voice-language-marketplace',
      path: '/voice-language-marketplace',
      api: '/v1/voice-language-marketplace/engine',
    },
    {
      surface: 'creator-economy',
      path: '/creator-economy',
      api: '/v1/creator-economy/engine',
    },
    { surface: 'creator-sales', path: '/marketplace', api: '/v1/marketplace/sales' },
    { surface: 'billing', path: '/billing', api: '/v1/billing/summary' },
    { surface: 'plugin-runtime', path: '/plugin-runtime', api: '/v1/plugin-runtime/engine' },
    { surface: 'agent-runtime', path: '/agent-runtime', api: '/v1/agent-runtime/engine' },
    { surface: 'agent-fabric', path: '/agent-fabric', api: '/v1/agent-fabric/products' },
    { surface: 'policy-fabric', path: '/policy-fabric', api: '/v1/policy-fabric/products' },
    { surface: 'model-registry', path: '/model-registry', api: '/v1/model-registry/engine' },
    { surface: 'developer-cloud', path: '/developers', api: '/v1/developer-cloud/products' },
  ];
}
