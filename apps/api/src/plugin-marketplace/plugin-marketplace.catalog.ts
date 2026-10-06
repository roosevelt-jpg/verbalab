export type PluginMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type PluginMarketplaceCapability = {
  id: string;
  name: string;
  status: PluginMarketplaceStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 117 → Plugin Marketplace (VL-250).
 * Buy/sell/publish sandboxed plugins over Plugin Runtime — not a browser/VS Code extension OS.
 * Volume 11 README: enforce Volume 8 sandbox + Policy gate before third-party plugins run.
 */
export function pluginMarketplaceEngineCatalog() {
  return {
    product: 'VerbaLab Plugin Marketplace',
    note:
      'Plugin Marketplace (VL-250). Publish/install/version/review sandboxed plugins. Execution always goes through Plugin Runtime invoke + PluginPolicyGate (hard allowlist) and Policy Fabric hard gate — never live arbitrary code. Extends VL-221 / VL-090 listings kind=plugin. Not a browser/VS Code extension store OS.',
    capabilities: [
      {
        id: 'plugin-publishing',
        name: 'Plugin Publishing',
        status: 'shipped',
        api: 'POST /v1/plugin-marketplace/listings',
        notes: 'Publish an existing Plugin Runtime plugin as a marketplace listing (kind=plugin).',
      },
      {
        id: 'plugin-installation',
        name: 'Plugin Installation',
        status: 'shipped',
        api: 'POST /v1/plugin-marketplace/listings/:id/install',
        notes:
          'Install copies sandboxed plugin into buyer workspace via Plugin Runtime register + activate. Policy Fabric + permission verification required.',
      },
      {
        id: 'plugin-updates',
        name: 'Plugin Updates',
        status: 'shipped',
        api: 'POST /v1/plugin-marketplace/listings/:id/update',
        notes: 'Republish listing snapshot from a bumped Plugin Runtime version.',
      },
      {
        id: 'plugin-versioning',
        name: 'Plugin Versioning',
        status: 'shipped',
        api: 'POST /v1/plugin-marketplace/listings/:id/update',
        notes: 'Listing snapshot carries plugin.version from Plugin Runtime.',
      },
      {
        id: 'plugin-security',
        name: 'Plugin Security',
        status: 'shipped',
        api: 'POST /v1/plugin-marketplace/listings/:id/run',
        notes:
          'Run path: FabricPolicyGate → PluginRuntime.invoke → PluginPolicyGate → sandbox only. liveCodeExecution=false.',
      },
      {
        id: 'plugin-verification',
        name: 'Plugin Verification',
        status: 'shipped',
        api: 'POST /v1/plugin-marketplace/listings',
        notes:
          'Listings verified only when permissions ⊆ grantable allowlist and no denied actions; sandboxOnly required.',
      },
      {
        id: 'plugin-reviews',
        name: 'Plugin Reviews',
        status: 'shipped',
        api: 'POST /v1/plugin-marketplace/listings/:id/reviews',
        notes: 'One review per org per listing (stored as MemoryRecords).',
      },
      {
        id: 'plugin-ratings',
        name: 'Plugin Ratings',
        status: 'shipped',
        api: 'GET /v1/plugin-marketplace/listings/:id/reviews',
        notes: '1–5 star ratings aggregated on listing snapshot.',
      },
      {
        id: 'plugin-analytics',
        name: 'Plugin Analytics',
        status: 'partial',
        api: 'GET /v1/plugin-marketplace/analytics',
        notes: 'Listing/install/review/run aggregates. Full commerce analytics deferred to Creator Economy.',
      },
      {
        id: 'plugin-monetization',
        name: 'Plugin Monetization',
        status: 'partial',
        api: 'POST /v1/plugin-marketplace/listings/:id/install',
        notes:
          'Paid listings record MarketplaceSale receipts. Stripe Connect path shared with VL-092 when configured — not a payment-processor OS.',
      },
    ] satisfies PluginMarketplaceCapability[],
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsPluginRuntime: true,
      extendsMarketplaceListings: true,
      regeneratesPluginRuntime: false,
      regeneratesMarketplaceVl090: false,
      browserExtensionOs: false,
      vsCodeExtensionOs: false,
      liveCodeExecution: false,
      sandboxRequired: true,
      pluginPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
    },
    honesty: {
      liveCodeExecution: false,
      openToolExecution: false,
      browserExtensionOs: false,
      vsCodeExtensionOs: false,
      wasmPluginOs: false,
      regeneratesPluginRuntime: false,
      regeneratesMarketplaceVl090: false,
      sandboxRequired: true,
      pluginPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      paymentProcessorOs: false,
      storesRawCardData: false,
    },
    safety: {
      sandboxRequired: true,
      liveCodeExecutionForbidden: true,
      pluginPolicyHardGateRequired: true,
      fabricPolicyHardGateRequired: true,
      policyLogOnlyForbidden: true,
      note:
        'Volume 11: third-party marketplace plugins must not run until Plugin Runtime sandbox + Policy gates allow. Denied actions (shell.exec, network.fetch, plugin.invoke_live, …) always 403.',
    },
    docs: '/docs/PLUGIN_MARKETPLACE.md',
  };
}
