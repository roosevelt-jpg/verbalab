import { Injectable } from '@nestjs/common';
import { GovernmentIntelligenceService } from '../government-intelligence.service';
import {
  GovernmentIntelligenceCatalogPort,
  GovernmentIntelligenceEngineBundle,
  GovernmentIntelligenceProductRow,
} from './ports';

@Injectable()
export class NestGovernmentIntelligenceCatalogAdapter implements GovernmentIntelligenceCatalogPort {
  constructor(private readonly service: GovernmentIntelligenceService) {}

  engine(): GovernmentIntelligenceEngineBundle {
    return this.service.engine();
  }

  listProducts(): GovernmentIntelligenceProductRow[] {
    const bundle = this.engine() as unknown as { products?: GovernmentIntelligenceProductRow[]; capabilities?: GovernmentIntelligenceProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/government-intelligence`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'government-intelligence',
        name: 'Government Intelligence',
        status: 'shipped',
        api: 'GET /v1/government-intelligence/engine',
        console: '/government-intelligence',
        notes: ' shipped.',
      },
    ];
  }
}
