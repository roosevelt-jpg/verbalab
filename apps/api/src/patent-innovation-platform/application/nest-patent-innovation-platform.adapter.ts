import { Injectable } from '@nestjs/common';
import { PatentInnovationPlatformService } from '../patent-innovation-platform.service';
import {
  PatentInnovationPlatformCatalogPort,
  PatentInnovationPlatformEngineBundle,
  PatentInnovationPlatformProductRow,
} from './ports';

@Injectable()
export class NestPatentInnovationPlatformCatalogAdapter implements PatentInnovationPlatformCatalogPort {
  constructor(private readonly service: PatentInnovationPlatformService) {}

  engine(): PatentInnovationPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): PatentInnovationPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: PatentInnovationPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/patent-innovation-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'patent-innovation-platform',
        name: 'Patent & Innovation Platform',
        status: 'shipped',
        api: 'GET /v1/patent-innovation-platform/engine',
        console: '/patent-innovation-platform',
        notes: ' shipped.',
      },
    ];
  }
}
