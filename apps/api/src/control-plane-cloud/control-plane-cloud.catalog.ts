export type ControlPlaneCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type ControlPlaneCloudProductRow = {
  id: string;
  name: string;
  status: ControlPlaneCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Control Plane Cloud Foundation.
 * Highest-privilege management layer — never executes inference.
 * Not Kubernetes/Istio/Vault/Data Plane OS.
 */
export function controlPlaneCloudProductCatalog(): ControlPlaneCloudProductRow[] {
  return [
    {
      id: 'control-plane-cloud',
      name: 'Control Plane Cloud',
      status: 'shipped',
      api: 'GET /v1/control-plane-cloud/products',
      console: '/control-plane-cloud',
      notes:
        'Foundation hub. executesInference=false; dataPlaneOs=false.',
    },
    {
      id: 'organization-control',
      name: 'Organization Control',
      status: 'shipped',
      api: 'GET /v1/organization-control/engine',
      console: '/organization-control',
      notes:
        '. leastPrivilegeRequired; controlPlaneAdminNotDefault.',
    },
    {
      id: 'global-configuration-platform',
      name: 'Global Configuration',
      status: 'shipped',
      api: 'GET /v1/global-configuration-platform/engine',
      console: '/global-configuration-platform',
      notes:
        '. Secrets refs only.',
    },
    {
      id: 'global-policy-engine',
      name: 'Global Policy Engine',
      status: 'shipped',
      api: 'GET /v1/global-policy-engine/engine',
      console: '/global-policy-engine',
      notes:
        '. policyRuntimeIntegrated=true.',
    },
    {
      id: 'global-deployment-controller',
      name: 'Global Deployment Controller',
      status: 'shipped',
      api: 'GET /v1/global-deployment-controller/engine',
      console: '/global-deployment-controller',
      notes:
        '. productionDeployRequiresAuthorization; rollbackPath.',
    },
    {
      id: 'global-routing-controller',
      name: 'Global Routing Controller',
      status: 'shipped',
      api: 'GET /v1/global-routing-controller/engine',
      console: '/global-routing-controller',
      notes:
        '. istioOs=false.',
    },
    {
      id: 'secrets-certificate-platform',
      name: 'Secrets & Certificate Platform',
      status: 'shipped',
      api: 'GET /v1/secrets-certificate-platform/engine',
      console: '/secrets-certificate-platform',
      notes:
        '. Envelope encryption + audit; metadata only.',
    },
    {
      id: 'global-scheduler',
      name: 'Global Scheduler',
      status: 'shipped',
      api: 'GET /v1/global-scheduler/engine',
      console: '/global-scheduler',
      notes:
        '. Scheduling control; executesInference=false.',
    },
    {
      id: 'control-plane-analytics',
      name: 'Control Plane Analytics',
      status: 'shipped',
      api: 'GET /v1/control-plane-analytics/engine',
      console: '/control-plane-analytics',
      notes:
        '. Sibling aggregation.',
    },
    {
      id: 'identity',
      name: 'Identity',
      status: 'shipped',
      api: 'GET /v1/organization-control/engine',
      console: '/organization-control',
      notes:
        'Identity surfaces via Organization Control over Clerk — not a second IdP.',
    },
    {
      id: 'billing',
      name: 'Billing Control',
      status: 'shipped',
      api: 'GET /v1/global-policy-engine/engine',
      console: '/global-policy-engine',
      notes:
        'Billing policies via Global Policy Engine over existing billing.',
    },
    {
      id: 'monitoring',
      name: 'Control Plane Monitoring',
      status: 'shipped',
      api: 'GET /v1/control-plane-cloud/monitoring',
      console: '/control-plane-cloud',
      notes:
        'Foundation monitoring snapshot.',
    },
  ];
}

export function controlPlaneCloudRoutingTable(): Array<{
  id: string;
  path: string;
  purpose: string;
}> {
  return [
    { id: 'products', path: '/v1/control-plane-cloud/products', purpose: 'Product catalog' },
    { id: 'engine', path: '/v1/control-plane-cloud/engine', purpose: 'Engine alias' },
    { id: 'routing', path: '/v1/control-plane-cloud/routing', purpose: 'Static routing table' },
    { id: 'monitoring', path: '/v1/control-plane-cloud/monitoring', purpose: 'Monitoring snapshot' },
    { id: 'overview', path: '/v1/control-plane-cloud/overview', purpose: 'Authenticated overview' },
  ];
}

export function controlPlaneCloudArchitectureNotes(): Record<string, unknown> {
  return {
    role: 'control-plane-management',
    extends: [
      'policy-runtime',
      'policy-fabric',
      'trust-cloud',
      'identity',
      'platform-engineering-cloud',
      'release-engineering',
      'ai-fabric',
    ],
    regeneratesVolumes1to16: false,
    executesInference: false,
    dataPlaneOs: false,
    kubernetesControlPlaneOs: false,
    istioOs: false,
    hashicorpVaultOs: false,
    deferredToVolume18Plus: ['data-plane'],
  };
}

export function controlPlaneCloudHonesty(): Record<string, boolean | string> {
  return {
    executesInference: false,
    dataPlaneOs: false,
    kubernetesControlPlaneOs: false,
    istioOs: false,
    hashicorpVaultOs: false,
    secondPolicyOs: false,
    secondIdp: false,
    regeneratesVolumes1to16: false,
    integratesExistingSystems: true,
    controlPlaneManagementLayer: true,
    leastPrivilegeRequired: true,
    controlPlaneAdminNotDefault: true,
    productionDeployRequiresAuthorization: true,
    rollbackPath: true,
    encryptedAtRest: true,
    neverLogPlaintextSecrets: true,
    envelopeEncryptionPattern: true,
    accessAuditing: true,
    note:
      'Control Plane Cloud manages orgs/projects/regions/policies/routing/billing/identity/deployment/configuration/monitoring. Never executes inference. Wires over Policy Runtime / Trust / Identity / Platform Engineering — not a second policy OS or IdP. Data Plane deferred to Volume 18+.',
  };
}
