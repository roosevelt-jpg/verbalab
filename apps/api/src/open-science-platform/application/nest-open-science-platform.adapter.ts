import { Injectable } from '@nestjs/common';
import { OpenSciencePlatformService } from '../open-science-platform.service';
import {
  OpenSciencePlatformCatalogPort,
  OpenSciencePlatformEngineBundle,
  OpenSciencePlatformProductRow,
} from './ports';

@Injectable()
export class NestOpenSciencePlatformCatalogAdapter implements OpenSciencePlatformCatalogPort {
  constructor(private readonly service: OpenSciencePlatformService) {}

  engine(): OpenSciencePlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): OpenSciencePlatformProductRow[] {
    const bundle = this.engine() as {
      products?: OpenSciencePlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/open-science-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'open-science-platform',
        name: 'Open Science Platform',
        status: 'shipped',
        api: 'GET /v1/open-science-platform/engine',
        console: '/open-science-platform',
        notes: ' shipped.',
      },
    ];
  }
}
