import { Injectable } from '@nestjs/common';
import { FinopsPlatformService } from '../finops-platform.service';
import {
  FinopsPlatformCatalogPort,
  FinopsPlatformEngineBundle,
  FinopsPlatformProductRow,
} from './ports';

@Injectable
export class NestFinopsPlatformCatalogAdapter implements FinopsPlatformCatalogPort {
  constructor(private readonly service: FinopsPlatformService) {}

  engine: FinopsPlatformEngineBundle {
    return this.service.engine;
  }

  listProducts: FinopsPlatformProductRow[] {
    const bundle = this.engine as {
      products?: FinopsPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/finops-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'finops-platform',
        name: 'FinOps Platform',
        status: 'shipped',
        api: 'GET /v1/finops-platform/engine',
        console: '/finops-platform',
        notes: ' shipped.',
      },
    ];
  }
}
