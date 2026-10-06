import { Injectable } from '@nestjs/common';
import { organizationControlEngineCatalog } from './organization-control.catalog';

@Injectable()
export class OrganizationControlService {
  engine() {
    return organizationControlEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const organizations = catalog.organizations.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      organizations,
      count: organizations.length,
      roles: catalog.roles,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  roles() {
    const catalog = this.engine();
    return {
      roles: catalog.roles,
      leastPrivilegeRequired: true,
      controlPlaneAdminNotDefault: true,
      defaultRole: catalog.roles.find((r) => r.isDefault)?.id ?? 'viewer',
      honesty: catalog.honesty,
      note: 'Role catalog: control_plane_admin is not default. Viewer is default least privilege.',
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'organization-control',
      organizationCount: catalog.organizations.length,
      roleCount: catalog.roles.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Organization Control monitoring snapshot (VL-315).',
    };
  }
}
