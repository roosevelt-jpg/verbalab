import { Injectable } from '@nestjs/common';
import { ResearchCloudService } from '../research-cloud.service';
import {
  ResearchCloudCatalogPort,
  ResearchCloudEngineBundle,
  ResearchCloudProductRow,
} from './ports';

@Injectable()
export class NestResearchCloudCatalogAdapter implements ResearchCloudCatalogPort {
  constructor(private readonly service: ResearchCloudService) {}

  engine(): ResearchCloudEngineBundle {
    return this.service.products();
  }

  listProducts(): ResearchCloudProductRow[] {
    const bundle = this.engine() as {
      products?: ResearchCloudProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/research-cloud`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'research-cloud',
        name: 'Research Cloud',
        status: 'shipped',
        api: 'GET /v1/research-cloud/engine',
        console: '/research-cloud',
        notes: ' shipped.',
      },
    ];
  }
}
