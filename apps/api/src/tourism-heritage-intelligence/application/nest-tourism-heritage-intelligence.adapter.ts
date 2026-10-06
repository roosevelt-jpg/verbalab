import { Injectable } from '@nestjs/common';
import { TourismHeritageIntelligenceService } from '../tourism-heritage-intelligence.service';
import {
  TourismHeritageIntelligenceCatalogPort,
  TourismHeritageIntelligenceEngineBundle,
  TourismHeritageIntelligenceProductRow,
} from './ports';

@Injectable()
export class NestTourismHeritageIntelligenceCatalogAdapter implements TourismHeritageIntelligenceCatalogPort {
  constructor(private readonly service: TourismHeritageIntelligenceService) {}

  engine(): TourismHeritageIntelligenceEngineBundle {
    return this.service.engine();
  }

  listProducts(): TourismHeritageIntelligenceProductRow[] {
    const bundle = this.engine() as { products?: TourismHeritageIntelligenceProductRow[]; capabilities?: TourismHeritageIntelligenceProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/tourism-heritage-intelligence`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'tourism-heritage-intelligence',
        name: 'Tourism & Heritage Intelligence',
        status: 'shipped',
        api: 'GET /v1/tourism-heritage-intelligence/engine',
        console: '/tourism-heritage-intelligence',
        notes: 'VL-269 shipped.',
      },
    ];
  }
}
