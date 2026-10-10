import { Injectable } from '@nestjs/common';
import { SyntheticDataPlatformService } from '../synthetic-data-platform.service';
import {
  SyntheticDataPlatformCatalogPort,
  SyntheticDataPlatformEngineBundle,
  SyntheticDataPlatformProductRow,
} from './ports';

@Injectable()
export class NestSyntheticDataPlatformCatalogAdapter implements SyntheticDataPlatformCatalogPort {
  constructor(private readonly service: SyntheticDataPlatformService) {}

  engine(): SyntheticDataPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): SyntheticDataPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: SyntheticDataPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/synthetic-data-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'synthetic-data-platform',
        name: 'Synthetic Data Platform',
        status: 'shipped',
        api: 'GET /v1/synthetic-data-platform/engine',
        console: '/synthetic-data-platform',
        notes: ' shipped.',
      },
    ];
  }
}
