import { Injectable } from '@nestjs/common';
import { GlobalSchedulerService } from '../global-scheduler.service';
import {
  GlobalSchedulerCatalogPort,
  GlobalSchedulerEngineBundle,
  GlobalSchedulerProductRow,
} from './ports';

@Injectable
export class NestGlobalSchedulerCatalogAdapter implements GlobalSchedulerCatalogPort {
  constructor(private readonly service: GlobalSchedulerService) {}

  engine: GlobalSchedulerEngineBundle {
    return this.service.engine;
  }

  listProducts: GlobalSchedulerProductRow[] {
    const bundle = this.engine as {
      products?: GlobalSchedulerProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/global-scheduler`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'global-scheduler',
        name: 'Global Scheduler',
        status: 'shipped',
        api: 'GET /v1/global-scheduler/engine',
        console: '/global-scheduler',
        notes: ' shipped.',
      },
    ];
  }
}
