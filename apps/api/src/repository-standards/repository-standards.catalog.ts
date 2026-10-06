/**
 * Repository Standards.
 * Repository Standards. Monorepo/polyrepo/templates/naming/folder/branch/git/commit/versioning catalog matching Lugemi monorepo reality (pnpm/turbo apps/* packages/*).
 */
export function repositoryStandardsEngineCatalog() {
  return {
    product: 'Lugemi Repository Standards',
    engineeringOsForHumansAndCursor: true,
    customerFacingProductCloud: false,
    architectureKnowledgeBaseOs: false,
    adrFactoryOs: false,
    capabilities: [
      { id: 'monorepo', name: 'Monorepo Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'polyrepo', name: 'Polyrepo Guidance', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'service_templates', name: 'Service Templates', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'naming', name: 'Naming Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'folder', name: 'Folder Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'branch', name: 'Branch Strategy', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'git', name: 'Git Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'commit', name: 'Commit Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'versioning', name: 'Versioning Standards', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'developer-experience-platform',
        path: '/v1/developer-experience-platform/engine',
        role: 'Developer Experience',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      },
      {
        id: 'route-2',
        module: 'golden-path-platform',
        path: '/v1/golden-path-platform/engine',
        role: 'Golden Paths',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      },
      {
        id: 'route-3',
        module: 'gitops-platform',
        path: '/v1/gitops-platform/engine',
        role: 'GitOps',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      }
    ],
    routesTo: [
      { module: 'developer-experience-platform', path: '/v1/developer-experience-platform/engine', role: 'Developer Experience' },
      { module: 'golden-path-platform', path: '/v1/golden-path-platform/engine', role: 'Golden Paths' },
      { module: 'gitops-platform', path: '/v1/gitops-platform/engine', role: 'GitOps' }
    ],
    monorepoReality: {
      packageManager: 'pnpm',
      build: 'turbo',
      apps: ['apps/api', 'apps/web'],
      packages: ['packages/sdk', 'packages/cli', 'packages/eslint-config', 'packages/typescript-config'],
      branchPrefix: 'cursor/',
      commitStyle: 'conventional descriptive',
      versioning: 'workspace-aligned',
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
      matchesMonorepoReality: true,
      inventsNewRepoLayout: false,
      pnpmTurboMonorepo: true,
    },
    safety: {
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      note: 'Repository Standards. Monorepo/polyrepo/templates/naming/folder/branch/git/commit/versioning catalog matching Lugemi monorepo reality (pnpm/turbo apps/* packages/*).',
    },
    docs: '/docs/REPOSITORY_STANDARDS.md',
    note: 'Repository Standards. Monorepo/polyrepo/templates/naming/folder/branch/git/commit/versioning catalog matching Lugemi monorepo reality (pnpm/turbo apps/* packages/*).',
  };
}
