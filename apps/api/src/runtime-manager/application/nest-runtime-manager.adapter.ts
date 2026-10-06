import { Injectable } from '@nestjs/common';
import { RuntimeManagerService } from '../runtime-manager.service';
import {
  RuntimeManagerCatalogPort,
  RuntimeManagerEngineBundle,
  RuntimeManagerProductRow,
} from './ports';

@Injectable()
export class NestRuntimeManagerCatalogAdapter implements RuntimeManagerCatalogPort {
  constructor(private readonly service: RuntimeManagerService) {}

  engine(): RuntimeManagerEngineBundle {
    return this.service.engine();
  }

  listProducts(): RuntimeManagerProductRow[] {
    const bundle = this.engine() as {
      products?: RuntimeManagerProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/runtime-manager`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'runtime-manager',
        name: 'Runtime Manager',
        status: 'shipped',
        api: 'GET /v1/runtime-manager/engine',
        console: '/runtime-manager',
        notes: ' shipped.',
      },
    ];
  }
}
