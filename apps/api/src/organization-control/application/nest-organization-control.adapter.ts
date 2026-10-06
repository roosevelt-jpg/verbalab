import { Injectable } from '@nestjs/common';
import { OrganizationControlService } from '../organization-control.service';
import {
  OrganizationControlCatalogPort,
  OrganizationControlEngineBundle,
  OrganizationControlProductRow,
} from './ports';

@Injectable()
export class NestOrganizationControlCatalogAdapter implements OrganizationControlCatalogPort {
  constructor(private readonly service: OrganizationControlService) {}

  engine(): OrganizationControlEngineBundle {
    return this.service.engine();
  }

  listProducts(): OrganizationControlProductRow[] {
    const bundle = this.engine() as {
      products?: OrganizationControlProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/organization-control`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'organization-control',
        name: 'Organization Control',
        status: 'shipped',
        api: 'GET /v1/organization-control/engine',
        console: '/organization-control',
        notes: 'VL-315 shipped.',
      },
    ];
  }
}
