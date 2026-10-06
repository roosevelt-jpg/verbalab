import { Injectable } from '@nestjs/common';
import { EngineeringQualityPlatformService } from '../engineering-quality-platform.service';
import {
  EngineeringQualityPlatformCatalogPort,
  EngineeringQualityPlatformEngineBundle,
  EngineeringQualityPlatformProductRow,
} from './ports';

@Injectable
export class NestEngineeringQualityPlatformCatalogAdapter implements EngineeringQualityPlatformCatalogPort {
  constructor(private readonly service: EngineeringQualityPlatformService) {}

  engine: EngineeringQualityPlatformEngineBundle {
    return this.service.engine;
  }

  listProducts: EngineeringQualityPlatformProductRow[] {
    const bundle = this.engine as {
      products?: EngineeringQualityPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/engineering-quality-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'engineering-quality-platform',
        name: 'Engineering Quality Platform',
        status: 'shipped',
        api: 'GET /v1/engineering-quality-platform/engine',
        console: '/engineering-quality-platform',
        notes: ' shipped.',
      },
    ];
  }
}
