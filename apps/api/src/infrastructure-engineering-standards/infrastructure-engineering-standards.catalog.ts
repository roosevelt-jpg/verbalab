/**
 * Infrastructure Engineering Standards.
 * Infrastructure Engineering Standards. AWS/Cloudflare/Terraform/Helm/K8s/Docker/networking/storage/GPU standards. Fly default + GPU budget + secrets envelope honesty. kubernetesOs=false.
 */
export function infrastructureEngineeringStandardsEngineCatalog() {
  return {
    product: 'Lugemi Infrastructure Engineering Standards',
    engineeringOsForHumansAndCursor: true,
    customerFacingProductCloud: false,
    architectureKnowledgeBaseOs: false,
    adrFactoryOs: false,
    capabilities: [
      { id: 'aws', name: 'AWS Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'cloudflare', name: 'Cloudflare Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'terraform', name: 'Terraform Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'helm', name: 'Helm Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'kubernetes', name: 'Kubernetes Standards Catalog', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'docker', name: 'Docker Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'networking', name: 'Networking Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'storage', name: 'Storage Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'gpu', name: 'GPU Cluster Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'finops-platform',
        path: '/v1/finops-platform/engine',
        role: 'FinOps GPU budgets',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      },
      {
        id: 'route-2',
        module: 'secrets-certificate-platform',
        path: '/v1/secrets-certificate-platform/engine',
        role: 'Control Plane secrets honesty',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      },
      {
        id: 'route-3',
        module: 'gpu-platform',
        path: '/v1/gpu-platform/engine',
        role: 'GPU Platform',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      },
      {
        id: 'route-4',
        module: 'gitops-platform',
        path: '/v1/gitops-platform/engine',
        role: 'GitOps / deploy',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      },
      {
        id: 'route-5',
        module: 'global-deployment-controller',
        path: '/v1/global-deployment-controller/engine',
        role: 'Deploy controller',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      }
    ],
    routesTo: [
      { module: 'finops-platform', path: '/v1/finops-platform/engine', role: 'FinOps GPU budgets' },
      { module: 'secrets-certificate-platform', path: '/v1/secrets-certificate-platform/engine', role: 'Control Plane secrets honesty' },
      { module: 'gpu-platform', path: '/v1/gpu-platform/engine', role: 'GPU Platform' },
      { module: 'gitops-platform', path: '/v1/gitops-platform/engine', role: 'GitOps / deploy' },
      { module: 'global-deployment-controller', path: '/v1/global-deployment-controller/engine', role: 'Deploy controller' }
    ],
    deployDefaults: {
      primary: 'fly.io',
      flyDefaultDeploy: true,
      kubernetesOs: false,
      note: 'Fly is the default deploy target; Kubernetes standards are catalog guidance only.',
    },
    gpuStandards: {
      referencesFinopsGpuBudgets: true,
      gpuBudgetLimitsRequired: true,
      note: 'GPU standards reference FinOps GPU budget alerts — do not invent unlimited GPU pools.',
    },
    secretsStandards: {
      referencesControlPlaneSecretsHonesty: true,
      secretsEnvelopeHonesty: true,
      note: 'Secrets standards reference Control Plane envelope/metadata honesty.',
    },

    honesty: {
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      jiraOs: false,
      confluenceOs: false,
      sonarqubeOs: false,
      integratesExistingSystems: true,
      referencesFinopsAndSecretsHonesty: true,
      kubernetesOs: false,
      flyDefaultDeploy: true,
      gpuBudgetLimitsRequired: true,
      secretsEnvelopeHonesty: true,
    },
    safety: {
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      note: 'Infrastructure Engineering Standards. AWS/Cloudflare/Terraform/Helm/K8s/Docker/networking/storage/GPU standards. Fly default + GPU budget + secrets envelope honesty. kubernetesOs=false.',
    },
    docs: '/docs/INFRASTRUCTURE_ENGINEERING_STANDARDS.md',
    note: 'Infrastructure Engineering Standards. AWS/Cloudflare/Terraform/Helm/K8s/Docker/networking/storage/GPU standards. Fly default + GPU budget + secrets envelope honesty. kubernetesOs=false.',
  };
}
