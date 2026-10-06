export type EnterpriseEngineeringSystemProductStatus = 'shipped' | 'partial' | 'deferred';

export type EnterpriseEngineeringSystemProductRow = {
  id: string;
  name: string;
  status: EnterpriseEngineeringSystemProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Enterprise Engineering System Foundation.
 * Engineering OS for humans + Cursor — standards/governance catalogs.
 * Not customer-facing product cloud; not ADR factory / Architecture Knowledge Base OS.
 */
export function enterpriseEngineeringSystemProductCatalog(): EnterpriseEngineeringSystemProductRow[] {
  return [
    {
      id: 'enterprise-engineering-system',
      name: 'Enterprise Engineering System',
      status: 'shipped',
      api: 'GET /v1/enterprise-engineering-system/products',
      console: '/enterprise-engineering-system',
      notes:
        '. Engineering OS for humans+Cursor; architectureKnowledgeBaseOs=false; adrFactoryOs=false.',
    },
    {
      id: 'engineering-governance',
      name: 'Engineering Governance',
      status: 'shipped',
      api: 'GET /v1/engineering-governance/engine',
      console: '/engineering-governance',
      notes:
        '. Councils + CAB/TSC; humanSignOffRequired; extends AI Governance.',
    },
    {
      id: 'architecture-governance',
      name: 'Architecture Governance',
      status: 'shipped',
      api: 'GET /v1/architecture-governance/engine',
      console: '/architecture-governance',
      notes:
        '. ADR/RFC workflows pointing at docs/adr; adrFactoryOs=false.',
    },
    {
      id: 'repository-standards',
      name: 'Repository Standards',
      status: 'shipped',
      api: 'GET /v1/repository-standards/engine',
      console: '/repository-standards',
      notes:
        '. Monorepo/polyrepo/naming/branch/git standards matching reality.',
    },
    {
      id: 'engineering-quality-platform',
      name: 'Engineering Quality Platform',
      status: 'shipped',
      api: 'GET /v1/engineering-quality-platform/engine',
      console: '/engineering-quality-platform',
      notes:
        '. Quality catalog + dashboard snapshot; sonarqubeOs=false.',
    },
    {
      id: 'ai-engineering-standards',
      name: 'AI Engineering Standards',
      status: 'shipped',
      api: 'GET /v1/ai-engineering-standards/engine',
      console: '/ai-engineering-standards',
      notes:
        '. AI standards + retroactiveChecks (Vol 11/12/17).',
    },
    {
      id: 'api-engineering-standards',
      name: 'API Engineering Standards',
      status: 'shipped',
      api: 'GET /v1/api-engineering-standards/engine',
      console: '/api-engineering-standards',
      notes:
        '. REST/GraphQL/gRPC/SDK standards reflecting OpenAPI/SDK.',
    },
    {
      id: 'database-engineering-standards',
      name: 'Database Engineering Standards',
      status: 'shipped',
      api: 'GET /v1/database-engineering-standards/engine',
      console: '/database-engineering-standards',
      notes:
        '. Postgres/Redis/ES/vector/KG standards; databaseOs=false.',
    },
    {
      id: 'infrastructure-engineering-standards',
      name: 'Infrastructure Engineering Standards',
      status: 'shipped',
      api: 'GET /v1/infrastructure-engineering-standards/engine',
      console: '/infrastructure-engineering-standards',
      notes:
        '. IaC/deploy/GPU standards; kubernetesOs=false; FinOps+secrets honesty.',
    },
    {
      id: 'platform-engineering-cloud',
      name: 'Platform Engineering Cloud (upstream)',
      status: 'shipped',
      api: 'GET /v1/platform-engineering-cloud/products',
      console: '/platform-engineering-cloud',
      notes:
        'Volume 16 surface extended by EES.',
    },
    {
      id: 'developer-experience-platform',
      name: 'Developer Experience (upstream)',
      status: 'shipped',
      api: 'GET /v1/developer-experience-platform/engine',
      console: '/developer-experience-platform',
      notes:
        'Volume 16 DX surface extended by EES.',
    },
    {
      id: 'ai-governance-platform',
      name: 'AI Governance (upstream)',
      status: 'shipped',
      api: 'GET /v1/ai-governance-platform/engine',
      console: '/ai-governance-platform',
      notes:
        'Volume 15 Trust surface extended by EES.',
    },
    {
      id: 'monitoring',
      name: 'EES Monitoring',
      status: 'shipped',
      api: 'GET /v1/enterprise-engineering-system/monitoring',
      console: '/enterprise-engineering-system',
      notes:
        'Foundation monitoring snapshot.',
    },
  ];
}

export function enterpriseEngineeringSystemRoutingTable(): Array<{
  id: string;
  path: string;
  purpose: string;
}> {
  return [
    { id: 'products', path: '/v1/enterprise-engineering-system/products', purpose: 'Product catalog' },
    { id: 'engine', path: '/v1/enterprise-engineering-system/engine', purpose: 'Engine alias' },
    { id: 'routing', path: '/v1/enterprise-engineering-system/routing', purpose: 'Static routing table' },
    { id: 'monitoring', path: '/v1/enterprise-engineering-system/monitoring', purpose: 'Monitoring snapshot' },
    { id: 'overview', path: '/v1/enterprise-engineering-system/overview', purpose: 'Authenticated overview' },
  ];
}

export function enterpriseEngineeringSystemHubInventory(): Array<{
  id: string;
  title: string;
  engineeringOsForHumansAndCursor: boolean;
  customerFacingProductCloud: boolean;
  adrFactoryOs: boolean;
  architectureKnowledgeBaseOs: boolean;
  routesTo: string[];
}> {
  return [
      {
        id: 'engineering-governance',
        title: 'Engineering Governance',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: ['ai-governance-platform', 'trust-cloud', 'release-engineering', 'platform-engineering-cloud'],
      },
      {
        id: 'architecture-governance',
        title: 'Architecture Governance',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: ['docs/adr', 'platform-engineering-cloud', 'developer-experience-platform'],
      },
      {
        id: 'repository-standards',
        title: 'Repository Standards',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: ['developer-experience-platform', 'golden-path-platform', 'gitops-platform'],
      },
      {
        id: 'engineering-quality-platform',
        title: 'Engineering Quality Platform',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: ['supply-chain-security', 'reliability-engineering', 'developer-experience-platform'],
      },
      {
        id: 'ai-engineering-standards',
        title: 'AI Engineering Standards',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: ['ai-governance-platform', 'ai-safety-platform', 'evaluation-platform', 'promptops-platform', 'secrets-certificate-platform'],
      },
      {
        id: 'api-engineering-standards',
        title: 'API Engineering Standards',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: ['openapi', 'developer-cloud', 'developer-experience-platform'],
      },
      {
        id: 'database-engineering-standards',
        title: 'Database Engineering Standards',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: ['knowledge-cloud', 'vector-cloud', 'embedding-runtime'],
      },
      {
        id: 'infrastructure-engineering-standards',
        title: 'Infrastructure Engineering Standards',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: ['finops-platform', 'secrets-certificate-platform', 'gpu-platform', 'gitops-platform', 'global-deployment-controller'],
      }
  ];
}

export function enterpriseEngineeringSystemExtends(): Array<{
  id: string;
  volume: number;
  path: string;
  role: string;
}> {
  return [
    {
      id: 'platform-engineering-cloud',
      volume: 16,
      path: '/v1/platform-engineering-cloud/products',
      role: 'Internal developer platform',
    },
    {
      id: 'developer-experience-platform',
      volume: 16,
      path: '/v1/developer-experience-platform/engine',
      role: 'DX CLI/SDK/docs',
    },
    {
      id: 'ai-governance-platform',
      volume: 15,
      path: '/v1/ai-governance-platform/engine',
      role: 'AI Governance human sign-off',
    },
    {
      id: 'trust-cloud',
      volume: 15,
      path: '/v1/trust-cloud/products',
      role: 'Trust Cloud',
    },
    {
      id: 'docs-adr',
      volume: 0,
      path: 'docs/adr/',
      role: 'Existing ADR series (246 files at Volume 20 ship)',
    },
    {
      id: 'finops-platform',
      volume: 16,
      path: '/v1/finops-platform/engine',
      role: 'GPU budget alerts',
    },
    {
      id: 'secrets-certificate-platform',
      volume: 17,
      path: '/v1/secrets-certificate-platform/engine',
      role: 'Secrets envelope honesty',
    },
  ];
}

export function enterpriseEngineeringSystemArchitectureNotes(): Record<string, unknown> {
  return {
    role: 'enterprise-engineering-system-standards',
    extends: [
      'platform-engineering-cloud',
      'developer-experience-platform',
      'ai-governance-platform',
      'trust-cloud',
      'docs/adr',
      'finops-platform',
      'secrets-certificate-platform',
    ],
    engineeringOsForHumansAndCursor: true,
    customerFacingProductCloud: false,
    architectureKnowledgeBaseOs: false,
    adrFactoryOs: false,
    jiraOs: false,
    confluenceOs: false,
    sonarqubeOs: false,
    existingAdrCountAtShip: 246,
    deferredPastVolume20: ['architecture-knowledge-base-os', 'mass-adr-factory', 'mass-prd-library'],
  };
}

export function enterpriseEngineeringSystemHonesty(): Record<string, boolean | string | number> {
  return {
    engineeringOsForHumansAndCursor: true,
    customerFacingProductCloud: false,
    architectureKnowledgeBaseOs: false,
    adrFactoryOs: false,
    jiraOs: false,
    confluenceOs: false,
    sonarqubeOs: false,
    integratesExistingSystems: true,
    existingAdrCountAtShip: 246,
    note:
      'Enterprise Engineering System is standards/governance for humans+Cursor. Extends Platform Engineering, DX, Trust AI Governance, and existing docs/adr. architectureKnowledgeBaseOs=false; adrFactoryOs=false. Not Jira/Confluence/SonarQube OS.',
  };
}
