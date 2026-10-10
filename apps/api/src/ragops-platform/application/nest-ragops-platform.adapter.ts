import { Injectable } from '@nestjs/common';
import { RagopsPlatformService } from '../ragops-platform.service';
import {
  RagopsPlatformCatalogPort,
  RagopsPlatformEngineBundle,
  RagopsPlatformProductRow,
} from './ports';

@Injectable()
export class NestRagopsPlatformCatalogAdapter implements RagopsPlatformCatalogPort {
  constructor(private readonly service: RagopsPlatformService) {}

  engine(): RagopsPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): RagopsPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: RagopsPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/ragops-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ragops-platform',
        name: 'RAGOps Platform',
        status: 'shipped',
        api: 'GET /v1/ragops-platform/engine',
        console: '/ragops-platform',
        notes: ' shipped.',
      },
    ];
  }
}
