/**
 * Library Phase 170 → Internal Developer Portal (VL-303).
 * Internal Developer Portal (VL-303). Project/env/team/templates/ownership catalog over developer-cloud (VL-127). backstageOs=false.
 */
export function internalDeveloperPortalEngineCatalog() {
  return {
    product: 'Lugemi Internal Developer Portal',
    capabilities: [
      { id: 'project_creation', name: 'Project Creation', status: 'shipped', notes: 'VL-303 capability.' },
      { id: 'env_provisioning', name: 'Environment Provisioning', status: 'shipped', notes: 'VL-303 capability.' },
      { id: 'team_management', name: 'Team Management', status: 'shipped', notes: 'VL-303 capability.' },
      { id: 'templates', name: 'Service Templates', status: 'shipped', notes: 'VL-303 capability.' },
      { id: 'ownership', name: 'Ownership Maps', status: 'shipped', notes: 'VL-303 capability.' },
      { id: 'dashboards', name: 'Engineer Dashboards', status: 'shipped', notes: 'VL-303 capability.' }
    ],
    portal: [
      {
        id: 'idp-proj-api',
        name: 'api',
        kind: 'template',
        status: 'shipped',
        notes: 'Create Nest API project from golden path',
      },
      {
        id: 'idp-env-staging',
        name: 'staging',
        kind: 'environment',
        status: 'shipped',
        notes: 'Provision staging workspace env',
      },
      {
        id: 'idp-team-platform',
        name: 'platform',
        kind: 'team',
        status: 'shipped',
        notes: 'Platform engineering team ownership',
      },
      {
        id: 'idp-tpl-microservice',
        name: 'microservice',
        kind: 'template',
        status: 'shipped',
        notes: 'Microservice starter template',
      },
      {
        id: 'idp-own-web',
        name: 'web',
        kind: 'ownership',
        status: 'shipped',
        notes: 'apps/web ownership dashboard',
      },
      {
        id: 'idp-dash-dx',
        name: 'dx',
        kind: 'dashboard',
        status: 'shipped',
        notes: 'Developer experience dashboard',
      }
    ],
    honesty: {
      backstageOs: false,
      regeneratesVolumes1to15: false,
      integratesExistingSystems: true,
      internalEngineeringTooling: true,
    },
    safety: {
      backstageOs: false,
      note: 'Internal Developer Portal (VL-303). Project/env/team/templates/ownership catalog over developer-cloud (VL-127). backstageOs=false.',
    },
    docs: '/docs/INTERNAL_DEVELOPER_PORTAL.md',
    note: 'Internal Developer Portal (VL-303). Project/env/team/templates/ownership catalog over developer-cloud (VL-127). backstageOs=false.',
  };
}
