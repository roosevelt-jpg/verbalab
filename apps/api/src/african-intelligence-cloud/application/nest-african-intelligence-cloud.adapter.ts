import { Injectable } from '@nestjs/common';
import { AfricanIntelligenceCloudService } from '../african-intelligence-cloud.service';
import {
  AfricanIntelligenceCloudCatalogPort,
  AfricanIntelligenceCloudEngineBundle,
  AfricanIntelligenceCloudProductRow,
} from './ports';

@Injectable
export class NestAfricanIntelligenceCloudCatalogAdapter implements AfricanIntelligenceCloudCatalogPort {
  constructor(private readonly service: AfricanIntelligenceCloudService) {}

  engine: AfricanIntelligenceCloudEngineBundle {
    return this.service.products;
  }

  listProducts: AfricanIntelligenceCloudProductRow[] {
    const bundle = this.engine as { products?: AfricanIntelligenceCloudProductRow[]; capabilities?: AfricanIntelligenceCloudProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/african-intelligence-cloud`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'african-intelligence-cloud',
        name: 'African Intelligence Cloud',
        status: 'shipped',
        api: 'GET /v1/african-intelligence-cloud/engine',
        console: '/african-intelligence-cloud',
        notes: ' shipped.',
      },
    ];
  }
}
