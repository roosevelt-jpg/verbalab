import { Injectable } from '@nestjs/common';
import { KnowledgeRuntimeService } from '../knowledge-runtime.service';
import {
  KnowledgeRuntimeCatalogPort,
  KnowledgeRuntimeEngineBundle,
  KnowledgeRuntimeProductRow,
} from './ports';

@Injectable()
export class NestKnowledgeRuntimeCatalogAdapter implements KnowledgeRuntimeCatalogPort {
  constructor(private readonly service: KnowledgeRuntimeService) {}

  engine(): KnowledgeRuntimeEngineBundle {
    return this.service.engine();
  }

  listProducts(): KnowledgeRuntimeProductRow[] {
    const bundle = this.engine() as {
      products?: KnowledgeRuntimeProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/knowledge-runtime`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'knowledge-runtime',
        name: 'Knowledge Runtime',
        status: 'shipped',
        api: 'GET /v1/knowledge-runtime/engine',
        console: '/knowledge-runtime',
        notes: ' shipped.',
      },
    ];
  }
}
