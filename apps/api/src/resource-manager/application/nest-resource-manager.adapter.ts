import { Injectable } from '@nestjs/common';
import { ResourceManagerService } from '../resource-manager.service';
import {
  ResourceManagerCatalogPort,
  ResourceManagerEngineBundle,
  ResourceManagerProductRow,
} from './ports';

@Injectable
export class NestResourceManagerCatalogAdapter implements ResourceManagerCatalogPort {
  constructor(private readonly service: ResourceManagerService) {}

  engine: ResourceManagerEngineBundle {
    return this.service.engine;
  }

  listProducts: ResourceManagerProductRow[] {
    const bundle = this.engine as {
      products?: ResourceManagerProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/resource-manager`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'resource-manager',
        name: 'Resource Manager',
        status: 'shipped',
        api: 'GET /v1/resource-manager/engine',
        console: '/resource-manager',
        notes: ' shipped.',
      },
    ];
  }
}
