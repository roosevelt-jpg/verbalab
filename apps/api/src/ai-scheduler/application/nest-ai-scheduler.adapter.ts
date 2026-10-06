import { Injectable } from '@nestjs/common';
import { AiSchedulerService } from '../ai-scheduler.service';
import {
  AiSchedulerCatalogPort,
  AiSchedulerEngineBundle,
  AiSchedulerProductRow,
} from './ports';

@Injectable()
export class NestAiSchedulerCatalogAdapter implements AiSchedulerCatalogPort {
  constructor(private readonly service: AiSchedulerService) {}

  engine(): AiSchedulerEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiSchedulerProductRow[] {
    const bundle = this.engine() as {
      products?: AiSchedulerProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/ai-scheduler`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ai-scheduler',
        name: 'AI Scheduler',
        status: 'shipped',
        api: 'GET /v1/ai-scheduler/engine',
        console: '/ai-scheduler',
        notes: ' shipped.',
      },
    ];
  }
}
