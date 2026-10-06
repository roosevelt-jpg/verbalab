/**
 * Library Phase 182 → Organization Control.
 * Orgs/BUs/departments/teams/projects/environments/quotas/policies with least-privilege roles.
 * Extends identity/org surfaces — does not regenerate Clerk.
 */
export type ControlPlaneRole = 'control_plane_admin' | 'operator' | 'viewer';

export function organizationControlRoleCatalog(): Array<{
  id: ControlPlaneRole;
  name: string;
  privilege: 'admin' | 'operator' | 'viewer';
  isDefault: boolean;
  notes: string;
}> {
  return [
    {
      id: 'control_plane_admin',
      name: 'Control Plane Admin',
      privilege: 'admin',
      isDefault: false,
      notes: 'Highest privilege — not default for engineers. Can change global policy/deploy/secrets catalogs.',
    },
    {
      id: 'operator',
      name: 'Operator',
      privilege: 'operator',
      isDefault: false,
      notes: 'Operate deployments/schedules within granted orgs — cannot grant CP admin.',
    },
    {
      id: 'viewer',
      name: 'Viewer',
      privilege: 'viewer',
      isDefault: true,
      notes: 'Read-only control-plane catalogs. Default least-privilege role.',
    },
  ];
}

export function organizationControlEngineCatalog() {
  return {
    product: 'Lugemi Organization Control',
    capabilities: [
      { id: 'organizations', name: 'Organizations', status: 'shipped', notes: '.' },
      { id: 'business_units', name: 'Business Units', status: 'shipped', notes: '.' },
      { id: 'departments', name: 'Departments', status: 'shipped', notes: '.' },
      { id: 'teams', name: 'Teams', status: 'shipped', notes: '.' },
      { id: 'projects', name: 'Projects', status: 'shipped', notes: '.' },
      { id: 'environments', name: 'Environments', status: 'shipped', notes: '.' },
      { id: 'quotas', name: 'Quotas', status: 'shipped', notes: '.' },
      { id: 'policies', name: 'Org Policies', status: 'shipped', notes: '.' },
      { id: 'roles', name: 'Role Catalog', status: 'shipped', notes: 'admin vs operator vs viewer.' },
    ],
    organizations: [
      {
        id: 'org-lugemi',
        name: 'Lugemi',
        kind: 'organization',
        status: 'shipped',
        notes: 'Primary org seed over existing identity/org surfaces.',
      },
      {
        id: 'bu-platform',
        name: 'Platform BU',
        kind: 'business_unit',
        status: 'shipped',
        notes: 'Platform engineering business unit.',
      },
      {
        id: 'dept-security',
        name: 'Security',
        kind: 'department',
        status: 'shipped',
        notes: 'Security department — least-privilege access to CP admin.',
      },
      {
        id: 'team-sre',
        name: 'SRE',
        kind: 'team',
        status: 'shipped',
        notes: 'SRE team — operator privilege for deploy/rollback catalogs.',
      },
      {
        id: 'proj-api',
        name: 'API',
        kind: 'project',
        status: 'shipped',
        notes: 'API project under Platform BU.',
      },
      {
        id: 'env-prod',
        name: 'production',
        kind: 'environment',
        status: 'shipped',
        notes: 'Production environment — deploy requires authorization.',
      },
      {
        id: 'quota-gpu',
        name: 'gpu-monthly',
        kind: 'quota',
        status: 'shipped',
        notes: 'GPU quota binding to FinOps budgets.',
      },
      {
        id: 'pol-org-default',
        name: 'org-default-policy',
        kind: 'policy',
        status: 'shipped',
        notes: 'Default org policy handoff to Global Policy Engine.',
      },
    ],
    roles: organizationControlRoleCatalog(),
    honesty: {
      leastPrivilegeRequired: true,
      controlPlaneAdminNotDefault: true,
      regeneratesClerk: false,
      extendsIdentity: true,
      executesInference: false,
      regeneratesVolumes1to16: false,
      integratesExistingSystems: true,
      controlPlaneManagementLayer: true,
    },
    safety: {
      leastPrivilegeRequired: true,
      controlPlaneAdminNotDefault: true,
      note:
        'Organization Control extends identity/org surfaces. Role catalog: admin vs operator vs viewer. Control Plane Admin is not the default engineer role.',
    },
    docs: '/docs/ORGANIZATION_CONTROL.md',
    note:
      'Organization Control. Orgs/BUs/departments/teams/projects/environments/quotas/policies with least-privilege roles. Does not regenerate Clerk.',
  };
}
