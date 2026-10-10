import { Injectable } from '@nestjs/common';
import { InternalDeveloperPortalService } from '../internal-developer-portal.service';
import {
  InternalDeveloperPortalCatalogPort,
  InternalDeveloperPortalEngineBundle,
  InternalDeveloperPortalProductRow,
} from './ports';

@Injectable()
export class NestInternalDeveloperPortalCatalogAdapter implements InternalDeveloperPortalCatalogPort {
  constructor(private readonly service: InternalDeveloperPortalService) {}

  engine(): InternalDeveloperPortalEngineBundle {
    return this.service.engine();
  }

  listProducts(): InternalDeveloperPortalProductRow[] {
    const bundle = this.engine() as {
      products?: InternalDeveloperPortalProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/internal-developer-portal`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'internal-developer-portal',
        name: 'Internal Developer Portal',
        status: 'shipped',
        api: 'GET /v1/internal-developer-portal/engine',
        console: '/internal-developer-portal',
        notes: ' shipped.',
      },
    ];
  }
}
