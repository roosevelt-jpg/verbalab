export type PluginRuntimeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type PluginRuntimeCapability = {
  id: string;
  name: string;
  status: PluginRuntimeCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Capabilities a plugin may be granted. Anything else is denied. */
export const PLUGIN_PERMISSIONS = [
  'plugin.read',
  'plugin.transform',
  'memory.put',
  'memory.search',
  'reason.plan',
  'context.assemble',
  'plugin.notify',
] as const;

export type PluginPermission = (typeof PLUGIN_PERMISSIONS)[number];

/** Always denied — never grantable in . */
export const PLUGIN_DENIED_ACTIONS = [
  'external.execute',
  'billing.charge',
  'admin.impersonate',
  'shell.exec',
  'plugin.invoke_live',
  'filesystem.write',
  'network.fetch',
] as const;

export function pluginRuntimeMode(): 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_PLUGIN_RUNTIME_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function pluginRuntimeCeilings() {
  return {
    maxPluginsPerWorkspace: Math.min(
      100,
      Math.max(1, Number(process.env.LUGEMI_PLUGIN_RUNTIME_MAX_PLUGINS ?? '20') || 20),
    ),
    maxInvokeSteps: Math.min(
      20,
      Math.max(1, Number(process.env.LUGEMI_PLUGIN_RUNTIME_MAX_STEPS ?? '6') || 6),
    ),
    mode: pluginRuntimeMode(),
    liveCodeExecution: false,
    note: 'Sandbox plugin runtime. Live arbitrary code / network plugin execution is forbidden in .',
  };
}

/**
 * Library Phase 88 → Plugin Runtime.
 * Scoped permissions + sandbox required. Extends marketplace — not a browser/VS Code extension OS.
 */
export function pluginRuntimeCatalog() {
  return {
    product: 'Lugemi Plugin Runtime',
    note:
      'Plugin Runtime. Registry of sandboxed plugins with hard permission allowlists, lifecycle, versioning, dependency declarations, and marketplace listing counts. Invoke runs simulated sandbox handlers only — not arbitrary JS/WASM or live network plugins. Extends existing marketplace; does not invent a browser/VS Code extension OS. Policy Runtime is wired as a hard gate via PluginPolicyGate.',
    capabilities: [
      {
        id: 'plugin-registry',
        name: 'Plugin Registry',
        status: 'shipped',
        api: 'GET /v1/plugin-runtime/plugins',
        notes: 'Workspace plugin registry as kernel MemoryRecords.',
      },
      {
        id: 'plugin-sandbox',
        name: 'Plugin Sandbox',
        status: 'shipped',
        api: 'POST /v1/plugin-runtime/invoke',
        notes: 'Simulated handlers only; liveCodeExecution=false.',
      },
      {
        id: 'plugin-security',
        name: 'Plugin Security',
        status: 'shipped',
        api: 'POST /v1/plugin-runtime/invoke',
        notes: 'Hard allowlist + globally denied actions.',
      },
      {
        id: 'plugin-versioning',
        name: 'Plugin Versioning',
        status: 'shipped',
        api: 'POST /v1/plugin-runtime/plugins/:id/version',
        notes: 'Version bump stored as kernel MemoryRecords.',
      },
      {
        id: 'plugin-marketplace',
        name: 'Plugin Marketplace',
        status: 'shipped',
        api: 'GET /v1/plugin-marketplace/engine',
        notes:
          ' dedicated Plugin Marketplace. Runtime still exposes listing counts at GET /v1/plugin-runtime/marketplace.',
      },
      {
        id: 'plugin-dependencies',
        name: 'Plugin Dependencies',
        status: 'partial',
        api: 'POST /v1/plugin-runtime/plugins',
        notes: 'Declares dependency plugin ids — not a package manager OS.',
      },
      {
        id: 'plugin-permissions',
        name: 'Plugin Permissions',
        status: 'shipped',
        api: 'POST /v1/plugin-runtime/invoke',
        notes: 'Hard allowlist gate — missing permission → deny.',
      },
      {
        id: 'plugin-lifecycle',
        name: 'Plugin Lifecycle',
        status: 'shipped',
        api: 'POST /v1/plugin-runtime/plugins/:id/lifecycle',
        notes: 'draft → active → paused → archived.',
      },
      {
        id: 'runtime',
        name: 'Plugin Runtime',
        status: 'shipped',
        api: 'GET /v1/plugin-runtime/engine',
        notes: 'REST runtime hub.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/plugin-runtime/engine',
        notes: 'REST surfaces.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'pluginRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        status: 'shipped',
        api: '/plugin-runtime',
        notes: 'Internal console.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/plugin-runtime/monitoring',
        notes: 'Counts + safety honesty.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/PLUGIN_RUNTIME.md',
        notes: 'Product doc + ADR-0132.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/plugin-runtime/invoke',
        notes: 'Ships with Nest API — sandbox by default.',
      },
    ] satisfies PluginRuntimeCapability[],
    permissions: PLUGIN_PERMISSIONS.map((id) => ({ id })),
    deniedActions: PLUGIN_DENIED_ACTIONS.map((id) => ({ id })),
    honesty: {
      openToolExecution: false,
      liveCodeExecution: false,
      browserExtensionOs: false,
      vsCodeExtensionOs: false,
      wasmPluginOs: false,
      regeneratesVolumes1to7: false,
      regeneratesMarketplace: false,
      extendsMarketplace: true,
      scopedPermissionsRequired: true,
      sandboxRequired: true,
      policyHardGateRequired: true,
      policyRuntimeWired: true,
      localPermissionHardGate: true,
      orgWorkspaceScoped: true,
    },
    links: {
      console: '/plugin-runtime',
      hub: '/ai-kernel',
      marketplace: '/marketplace',
      agentRuntime: '/agent-runtime',
      workflowRuntime: '/workflow-runtime',
      memoryRuntime: '/memory-runtime',
      docs: '/docs/PLUGIN_RUNTIME.md',
      adr: '/docs/adr/0132-plugin-runtime.md',
    },
  };
}
