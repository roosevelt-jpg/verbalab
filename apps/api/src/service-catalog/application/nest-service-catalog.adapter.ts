import { Injectable } from '@nestjs/common';
import { ServiceCatalogService } from '../service-catalog.service';
import {
  ServiceCatalogCatalogPort,
  ServiceCatalogEngineBundle,
  ServiceCatalogProductRow,
} from './ports';

@Injectable
export class NestServiceCatalogCatalogAdapter implements ServiceCatalogCatalogPort {
  constructor(private readonly service: ServiceCatalogService) {}

  engine: ServiceCatalogEngineBundle {
    return this.service.engine;
  }

  listProducts: ServiceCatalogProductRow[] {
    const bundle = this.engine as {
      products?: ServiceCatalogProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/service-catalog`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'service-catalog',
        name: 'Service Catalog',
        status: 'shipped',
        api: 'GET /v1/service-catalog/engine',
        console: '/service-catalog',
        notes: ' shipped.',
      },
    ];
  }
}
