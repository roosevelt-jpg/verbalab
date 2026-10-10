import { Injectable } from '@nestjs/common';
import { AiMemoryOperatingSystemService } from '../ai-memory-operating-system.service';
import {
  AiMemoryOperatingSystemCatalogPort,
  AiMemoryOperatingSystemEngineBundle,
  AiMemoryOperatingSystemProductRow,
} from './ports';

@Injectable()
export class NestAiMemoryOperatingSystemCatalogAdapter implements AiMemoryOperatingSystemCatalogPort {
  constructor(private readonly service: AiMemoryOperatingSystemService) {}

  engine(): AiMemoryOperatingSystemEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiMemoryOperatingSystemProductRow[] {
    const bundle = this.engine() as {
      products?: AiMemoryOperatingSystemProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/ai-memory-operating-system`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ai-memory-operating-system',
        name: 'AI Memory Operating System',
        status: 'shipped',
        api: 'GET /v1/ai-memory-operating-system/engine',
        console: '/ai-memory-operating-system',
        notes: ' shipped.',
      },
    ];
  }
}
