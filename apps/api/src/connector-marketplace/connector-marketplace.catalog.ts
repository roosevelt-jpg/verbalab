export type ConnectorMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type ConnectorMarketplaceCapability = {
  id: string;
  name: string;
  status: ConnectorMarketplaceStatus;
  api: string | null;
  notes: string;
};

export const CONNECTOR_MARKETPLACE_CATEGORIES = [
  'crm',
  'erp',
  'hr',
  'finance',
  'healthcare',
  'government',
  'cloud',
  'identity',
  'email',
  'telephony',
  'payments',
] as const;

export type ConnectorMarketplaceCategory = (typeof CONNECTOR_MARKETPLACE_CATEGORIES)[number];

export type ConnectorCatalogEntry = {
  key: string;
  name: string;
  category: ConnectorMarketplaceCategory;
  status: ConnectorMarketplaceStatus;
  api: string | null;
  notes: string;
};

/** Built-in connector SKUs — extend Slack; not a full iPaaS catalog OS. */
export const CONNECTOR_CATALOG: ConnectorCatalogEntry[] = [
  {
    key: 'slack',
    name: 'Slack',
    category: 'cloud',
    status: 'shipped',
    api: '/v1/connectors/slack/commands',
    notes: 'Existing Slack slash connector. Marketplace listing is an entitlement SKU.',
  },
  {
    key: 'crm.generic',
    name: 'CRM Connector',
    category: 'crm',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement for CRM-class connectors — not Salesforce OS.',
  },
  {
    key: 'erp.generic',
    name: 'ERP Connector',
    category: 'erp',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement for ERP-class connectors — not NetSuite OS.',
  },
  {
    key: 'hr.generic',
    name: 'HR Connector',
    category: 'hr',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement for HR-class connectors.',
  },
  {
    key: 'finance.generic',
    name: 'Finance Connector',
    category: 'finance',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement — not a payments processor OS.',
  },
  {
    key: 'healthcare.generic',
    name: 'Healthcare Connector',
    category: 'healthcare',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement — not a clinical integration OS.',
  },
  {
    key: 'government.generic',
    name: 'Government Connector',
    category: 'government',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement for government systems.',
  },
  {
    key: 'cloud.generic',
    name: 'Cloud Connector',
    category: 'cloud',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement for cloud SaaS connectors.',
  },
  {
    key: 'identity.generic',
    name: 'Identity Connector',
    category: 'identity',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement — not an IdP OS.',
  },
  {
    key: 'email.generic',
    name: 'Email Connector',
    category: 'email',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement — not a mail server OS.',
  },
  {
    key: 'telephony.generic',
    name: 'Telephony Connector',
    category: 'telephony',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement — not a CPaaS OS.',
  },
  {
    key: 'payments.generic',
    name: 'Payments Connector',
    category: 'payments',
    status: 'partial',
    api: null,
    notes: 'Metadata entitlement. Live card vault forbidden; Stripe stays elsewhere.',
  },
];

export function findConnectorCatalogEntry(key: string): ConnectorCatalogEntry | undefined {
  const normalized = key.trim().toLowerCase();
  return CONNECTOR_CATALOG.find((c) => c.key === normalized);
}

/**
 * Connector Marketplace.
 * Buy/sell/publish connector entitlements — not an iPaaS automation OS.
 * Extends Slack connector.: Stripe-only; never store raw cards.
 */
export function connectorMarketplaceEngineCatalog() {
  return {
    product: 'Lugemi Connector Marketplace',
    note:
      'Connector Marketplace. Publish/license connector SKUs over the built-in connector catalog + existing Slack connector. Install grants workspace entitlements — not live arbitrary outbound, or iPaaS automation OS. Monetization records MarketplaceSale receipts; Stripe Connect via existing.',
    capabilities: [
      {
        id: 'crm-connectors',
        name: 'CRM',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=crm entitlement listings.',
      },
      {
        id: 'erp-connectors',
        name: 'ERP',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=erp.',
      },
      {
        id: 'hr-connectors',
        name: 'HR',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=hr.',
      },
      {
        id: 'finance-connectors',
        name: 'Finance',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=finance — not a card vault.',
      },
      {
        id: 'healthcare-connectors',
        name: 'Healthcare',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=healthcare metadata listings.',
      },
      {
        id: 'government-connectors',
        name: 'Government',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=government.',
      },
      {
        id: 'cloud-connectors',
        name: 'Cloud',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=cloud — includes Slack entitlement SKU.',
      },
      {
        id: 'identity-connectors',
        name: 'Identity',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=identity.',
      },
      {
        id: 'email-connectors',
        name: 'Email',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=email.',
      },
      {
        id: 'telephony-connectors',
        name: 'Telephony',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=telephony.',
      },
      {
        id: 'payments-connectors',
        name: 'Payments',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=payments metadata only — storesRawCardData=false.',
      },
      {
        id: 'connector-security',
        name: 'Connector Security',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings/:id/install',
        notes:
          'Install is entitlement-only. liveConnectorExecution=false. FabricPolicyGate on publish/install.',
      },
      {
        id: 'connector-analytics',
        name: 'Connector Analytics',
        status: 'partial',
        api: 'GET /v1/connector-marketplace/analytics',
        notes: 'Listing/install/review aggregates. Commerce depth deferred to Creator Economy.',
      },
      {
        id: 'connector-monetization',
        name: 'Connector Monetization',
        status: 'partial',
        api: 'POST /v1/connector-marketplace/listings/:id/install',
        notes:
          'Paid listings record MarketplaceSale receipts (15% fee). Stripe Connect when configured — not a payment-processor OS.',
      },
    ] satisfies ConnectorMarketplaceCapability[],
    categories: CONNECTOR_MARKETPLACE_CATEGORIES.map((id) => ({ id })),
    connectors: CONNECTOR_CATALOG.map((c) => ({
      key: c.key,
      name: c.name,
      category: c.category,
      status: c.status,
      api: c.api,
    })),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsSlackConnector: true,
      extendsMarketplaceListings: true,
      regeneratesConnectors: false,
      regeneratesMarketplaceVl090: false,
      ipaasOs: false,
      zapierOs: false,
      mulesoftOs: false,
      liveConnectorExecution: false,
      sandboxRequired: true,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      realMoneyRiskCategory: true,
    },
    honesty: {
      liveConnectorExecution: false,
      openOutboundExecution: false,
      ipaasOs: false,
      zapierOs: false,
      mulesoftOs: false,
      regeneratesConnectors: false,
      regeneratesMarketplaceVl090: false,
      sandboxRequired: true,
      fabricPolicyHardGateRequired: true,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      realMoneyRiskCategory: true,
      creatorPayoutMathVerifiedLive: false,
    },
    safety: {
      sandboxRequired: true,
      liveConnectorExecutionForbidden: true,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      note:
        'Real-money volume. Connector listings are entitlements — not live arbitrary outbound. Use Stripe (or equivalent); never store raw card data. Not an iPaaS automation OS.',
    },
    docs: '/docs/CONNECTOR_MARKETPLACE.md',
  };
}
