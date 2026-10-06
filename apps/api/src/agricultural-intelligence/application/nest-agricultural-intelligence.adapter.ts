import { Injectable } from '@nestjs/common';
import { AgriculturalIntelligenceService } from '../agricultural-intelligence.service';
import {
  AgriculturalIntelligenceCatalogPort,
  AgriculturalIntelligenceEngineBundle,
  AgriculturalIntelligenceProductRow,
} from './ports';

@Injectable()
export class NestAgriculturalIntelligenceCatalogAdapter implements AgriculturalIntelligenceCatalogPort {
  constructor(private readonly service: AgriculturalIntelligenceService) {}

  engine(): AgriculturalIntelligenceEngineBundle {
    return this.service.engine();
  }

  listProducts(): AgriculturalIntelligenceProductRow[] {
    const bundle = this.engine() as unknown as { products?: AgriculturalIntelligenceProductRow[]; capabilities?: AgriculturalIntelligenceProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/agricultural-intelligence`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'agricultural-intelligence',
        name: 'Agricultural Intelligence',
        status: 'shipped',
        api: 'GET /v1/agricultural-intelligence/engine',
        console: '/agricultural-intelligence',
        notes: ' shipped.',
      },
    ];
  }
}
