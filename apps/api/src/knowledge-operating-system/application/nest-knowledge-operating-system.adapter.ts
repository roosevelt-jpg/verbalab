import { Injectable } from '@nestjs/common';
import { KnowledgeOperatingSystemService } from '../knowledge-operating-system.service';
import {
  KnowledgeOperatingSystemCatalogPort,
  KnowledgeOperatingSystemEngineBundle,
  KnowledgeOperatingSystemProductRow,
} from './ports';

@Injectable
export class NestKnowledgeOperatingSystemCatalogAdapter implements KnowledgeOperatingSystemCatalogPort {
  constructor(private readonly service: KnowledgeOperatingSystemService) {}

  engine: KnowledgeOperatingSystemEngineBundle {
    return this.service.engine;
  }

  listProducts: KnowledgeOperatingSystemProductRow[] {
    const bundle = this.engine as {
      products?: KnowledgeOperatingSystemProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/knowledge-operating-system`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'knowledge-operating-system',
        name: 'Knowledge Operating System',
        status: 'shipped',
        api: 'GET /v1/knowledge-operating-system/engine',
        console: '/knowledge-operating-system',
        notes: ' shipped.',
      },
    ];
  }
}
