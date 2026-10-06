export type PlatformEngineeringCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type PlatformEngineeringCloudProductRow = {
  id: string;
  name: string;
  status: PlatformEngineeringCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Platform Engineering Cloud Foundation.
 * Internal Developer Platform for Lugemi engineers — not Backstage OS,
 * ArgoCD/Flux OS, Kubernetes control-plane OS, Snyk OS, Datadog OS, or AI Cloud OS.
 */
export function platformEngineeringCloudProductCatalog(): PlatformEngineeringCloudProductRow[] {
  return [
    {
      id: 'platform-engineering-cloud',
      name: 'Platform Engineering Cloud',
      status: 'shipped',
      api: 'GET /v1/platform-engineering-cloud/products',
      console: '/platform-engineering-cloud',
      notes:
        'Foundation hub. Internal IDP. controlPlaneOs=false; dataPlaneOs=false; aiCloudOs=false.',
    },
    {
      id: 'internal-developer-portal',
      name: 'Developer Portal',
      status: 'shipped',
      api: 'GET /v1/internal-developer-portal/engine',
      console: '/internal-developer-portal',
      notes:
        'backstageOs=false — extends developer-cloud.',
    },
    {
      id: 'service-catalog',
      name: 'Service Catalog',
      status: 'shipped',
      api: 'GET /v1/service-catalog/engine',
      console: '/service-catalog',
      notes:
        'Lugemi service inventory.',
    },
    {
      id: 'golden-path-platform',
      name: 'Golden Paths',
      status: 'shipped',
      api: 'GET /v1/golden-path-platform/engine',
      console: '/golden-path-platform',
      notes:
        'Scaffolding templates catalog.',
    },
    {
      id: 'infrastructure-platform',
      name: 'Infrastructure Platform',
      status: 'shipped',
      api: 'GET /v1/gitops-platform/engine',
      console: '/gitops-platform',
      notes:
        'Infra readiness over Fly/shared platform — not Kubernetes control-plane OS.',
    },
    {
      id: 'gitops-platform',
      name: 'GitOps',
      status: 'shipped',
      api: 'GET /v1/gitops-platform/engine',
      console: '/gitops-platform',
      notes:
        'argoCdOs=false; fluxOs=false.',
    },
    {
      id: 'cicd',
      name: 'CI/CD',
      status: 'shipped',
      api: 'GET /v1/gitops-platform/engine',
      console: '/gitops-platform',
      notes:
        'CI/CD readiness paired with GitOps/Release Engineering.',
    },
    {
      id: 'developer-experience-platform',
      name: 'Developer Experience',
      status: 'shipped',
      api: 'GET /v1/developer-experience-platform/engine',
      console: '/developer-experience-platform',
      notes:
        'Extends SDK/CLI.',
    },
    {
      id: 'observability',
      name: 'Observability',
      status: 'shipped',
      api: 'GET /v1/reliability-engineering/engine',
      console: '/reliability-engineering',
      notes:
        'Extends existing observability metrics — datadogOs=false.',
    },
    {
      id: 'release-engineering',
      name: 'Release Engineering',
      status: 'shipped',
      api: 'GET /v1/release-engineering/engine',
      console: '/release-engineering',
      notes:
        'Progressive delivery catalog.',
    },
    {
      id: 'reliability-engineering',
      name: 'SRE',
      status: 'shipped',
      api: 'GET /v1/reliability-engineering/engine',
      console: '/reliability-engineering',
      notes:
        'SLO/SLI/error budgets.',
    },
    {
      id: 'finops-platform',
      name: 'FinOps',
      status: 'shipped',
      api: 'GET /v1/finops-platform/engine',
      console: '/finops-platform',
      notes:
        'gpuBudgetAlertsEnabled=true; finopsOs=false.',
    },
    {
      id: 'supply-chain-security',
      name: 'Security Platform',
      status: 'shipped',
      api: 'GET /v1/supply-chain-security/engine',
      console: '/supply-chain-security',
      notes:
        'SBOM/scan/findings; snykOs=false.',
    },
    {
      id: 'platform-engineering-analytics',
      name: 'Platform Engineering Analytics',
      status: 'shipped',
      api: 'GET /v1/platform-engineering-analytics/engine',
      console: '/platform-engineering-analytics',
      notes:
        'DORA + sibling aggregation.',
    },
  ];
}

export function platformEngineeringCloudRoutingTable(): Array<{
  id: string;
  path: string;
  purpose: string;
}> {
  return [
    { id: 'products', path: '/v1/platform-engineering-cloud/products', purpose: 'Product catalog' },
    { id: 'engine', path: '/v1/platform-engineering-cloud/engine', purpose: 'Engine alias' },
    { id: 'routing', path: '/v1/platform-engineering-cloud/routing', purpose: 'Static routing table' },
    { id: 'monitoring', path: '/v1/platform-engineering-cloud/monitoring', purpose: 'Monitoring snapshot' },
    { id: 'overview', path: '/v1/platform-engineering-cloud/overview', purpose: 'Authenticated overview' },
  ];
}

export function platformEngineeringCloudArchitectureNotes(): Record<string, unknown> {
  return {
    role: 'internal-developer-platform',
    extends: [
      'developer-cloud',
      'observability',
      'gpu-platform',
      'ai-runtime-analytics',
      'event-fabric',
      'policy-fabric',
    ],
    regeneratesPriorLayers: false,
    controlPlaneOs: false,
    dataPlaneOs: false,
    aiCloudOs: false,
    deferredNext: ['control-plane', 'data-plane', 'ai-cloud-os'],
  };
}

export function platformEngineeringCloudHonesty(): Record<string, boolean | string> {
  return {
    controlPlaneOs: false,
    dataPlaneOs: false,
    aiCloudOs: false,
    backstageOs: false,
    argoCdOs: false,
    fluxOs: false,
    kubernetesControlPlaneOs: false,
    snykOs: false,
    datadogOs: false,
    finopsOs: false,
    regeneratesPriorLayers: false,
    integratesExistingSystems: true,
    internalEngineeringTooling: true,
    internalIdp: true,
    note:
      'Platform Engineering Cloud is internal IDP tooling for Lugemi engineers. Catalog/dashboard surfaces over Fly/shared platform, GPU costs, and Fabric — not Backstage/Argo/K8s/Snyk/Datadog/AI Cloud OS. Control Plane deferred.',
  };
}
