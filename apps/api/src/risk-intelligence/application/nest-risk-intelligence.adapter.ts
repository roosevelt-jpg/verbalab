import { Injectable } from '@nestjs/common';
import { RiskIntelligenceService } from '../risk-intelligence.service';
import {
  RiskIntelligenceCatalogPort,
  RiskIntelligenceEngineBundle,
  RiskIntelligenceProductRow,
} from './ports';

@Injectable()
export class NestRiskIntelligenceCatalogAdapter implements RiskIntelligenceCatalogPort {
  constructor(private readonly service: RiskIntelligenceService) {}

  engine(): RiskIntelligenceEngineBundle {
    return this.service.engine();
  }

  listProducts(): RiskIntelligenceProductRow[] {
    const bundle = this.engine() as {
      products?: RiskIntelligenceProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/risk-intelligence`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'risk-intelligence',
        name: 'Risk Intelligence',
        status: 'shipped',
        api: 'GET /v1/risk-intelligence/engine',
        console: '/risk-intelligence',
        notes: 'VL-298 shipped.',
      },
    ];
  }
}
