import { Injectable } from '@nestjs/common';
import { CulturalIntelligenceService } from '../cultural-intelligence.service';
import {
  CulturalIntelligenceCatalogPort,
  CulturalIntelligenceEngineBundle,
  CulturalIntelligenceProductRow,
} from './ports';

@Injectable()
export class NestCulturalIntelligenceCatalogAdapter implements CulturalIntelligenceCatalogPort {
  constructor(private readonly service: CulturalIntelligenceService) {}

  engine(): CulturalIntelligenceEngineBundle {
    return this.service.engine();
  }

  listProducts(): CulturalIntelligenceProductRow[] {
    const bundle = this.engine() as unknown as { products?: CulturalIntelligenceProductRow[]; capabilities?: CulturalIntelligenceProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/cultural-intelligence`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'cultural-intelligence',
        name: 'Cultural Intelligence',
        status: 'shipped',
        api: 'GET /v1/cultural-intelligence/engine',
        console: '/cultural-intelligence',
        notes: ' shipped.',
      },
    ];
  }
}
