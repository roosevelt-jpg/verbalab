import { Injectable } from '@nestjs/common';
import { AiOperationsDashboardService } from '../ai-operations-dashboard.service';
import {
  AiOperationsDashboardCatalogPort,
  AiOperationsDashboardEngineBundle,
  AiOperationsDashboardProductRow,
} from './ports';

@Injectable()
export class NestAiOperationsDashboardCatalogAdapter implements AiOperationsDashboardCatalogPort {
  constructor(private readonly service: AiOperationsDashboardService) {}

  engine(): AiOperationsDashboardEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiOperationsDashboardProductRow[] {
    const bundle = this.engine() as {
      products?: AiOperationsDashboardProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/ai-operations-dashboard`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ai-operations-dashboard',
        name: 'AI Operations Dashboard',
        status: 'shipped',
        api: 'GET /v1/ai-operations-dashboard/engine',
        console: '/ai-operations-dashboard',
        notes: 'VL-290 shipped.',
      },
    ];
  }
}
