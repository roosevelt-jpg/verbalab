/**
 * Library Phase 213 → Architecture Governance.
 * Architecture Governance. ADR/RFC/design-review/tech-radar/dependency/compliance catalogs pointing at existing docs/adr — adrFactoryOs=false; no mass ADR generation.
 */
export function architectureGovernanceEngineCatalog() {
  return {
    product: 'Lugemi Architecture Governance',
    engineeringOsForHumansAndCursor: true,
    customerFacingProductCloud: false,
    architectureKnowledgeBaseOs: false,
    adrFactoryOs: false,
    capabilities: [
      { id: 'architecture_reviews', name: 'Architecture Reviews', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'adr_workflow', name: 'ADR Workflow Catalog', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'rfc_workflow', name: 'RFC Workflow Catalog', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'design_reviews', name: 'Design Reviews', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'tech_radar', name: 'Technology Radar', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'dependency_governance', name: 'Dependency Governance', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' },
      { id: 'architecture_compliance', name: 'Architecture Compliance', status: 'shipped', notes: ' standards capability — catalog, not a new OS.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'docs/adr',
        path: 'docs/adr/',
        role: 'Existing ADR series',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      },
      {
        id: 'route-2',
        module: 'platform-engineering-cloud',
        path: '/v1/platform-engineering-cloud/products',
        role: 'Platform Engineering',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      },
      {
        id: 'route-3',
        module: 'developer-experience-platform',
        path: '/v1/developer-experience-platform/engine',
        role: 'Developer Experience',
        status: 'shipped',
        notes: 'Extends existing Lugemi surface — EES catalogs standards over it.',
      }
    ],
    routesTo: [
      { module: 'docs/adr', path: 'docs/adr/', role: 'Existing ADR series' },
      { module: 'platform-engineering-cloud', path: '/v1/platform-engineering-cloud/products', role: 'Platform Engineering' },
      { module: 'developer-experience-platform', path: '/v1/developer-experience-platform/engine', role: 'Developer Experience' }
    ],
    adrWorkflow: {
      pointsAt: 'docs/adr/',
      existingAdrCountAtShip: 246,
      adrFactoryOs: false,
      massGeneration: false,
      statuses: ['proposed', 'accepted', 'deprecated', 'superseded'],
      note: 'Workflow catalog points at existing docs/adr process — does not mass-generate ADRs.',
    },
    rfcWorkflow: {
      statuses: ['draft', 'discussion', 'final', 'withdrawn'],
      note: 'RFC workflow catalog — not Confluence OS.',
    },
    techRadar: [
      { ring: 'adopt', items: ['NestJS hubs', 'Prisma', 'Vitest', 'OpenAPI + SDK/CLI'] },
      { ring: 'trial', items: ['Mutation testing gates', 'Expanded GraphQL federation'] },
      { ring: 'assess', items: ['gRPC internal meshes', 'External ADR tooling'] },
      { ring: 'hold', items: ['Architecture Knowledge Base OS', 'Mass ADR factory', 'Jira OS'] },
    ],
    dependencyGovernance: {
      packageManager: 'pnpm',
      workspace: 'pnpm-workspace.yaml',
      note: 'Dependency governance catalog over existing monorepo lockfile discipline.',
    },
    complianceCatalog: [
      { id: 'adr-linkage', name: 'ADR linkage for material changes', status: 'catalogued' },
      { id: 'design-review', name: 'Design review for cross-cloud changes', status: 'catalogued' },
      { id: 'honesty-flags', name: 'Honesty flags on new hubs', status: 'catalogued' },
    ],

    honesty: {
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      jiraOs: false,
      confluenceOs: false,
      sonarqubeOs: false,
      integratesExistingSystems: true,
      pointsAtExistingAdrProcess: true,
      massAdrGeneration: false,
      existingAdrCountNote: true,
    },
    safety: {
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      note: 'Architecture Governance. ADR/RFC/design-review/tech-radar/dependency/compliance catalogs pointing at existing docs/adr — adrFactoryOs=false; no mass ADR generation.',
    },
    docs: '/docs/ARCHITECTURE_GOVERNANCE.md',
    note: 'Architecture Governance. ADR/RFC/design-review/tech-radar/dependency/compliance catalogs pointing at existing docs/adr — adrFactoryOs=false; no mass ADR generation.',
  };
}
