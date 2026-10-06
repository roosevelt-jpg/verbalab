import { Injectable } from '@nestjs/common';
import { FinancialIntelligenceService } from '../financial-intelligence.service';
import {
  FinancialIntelligenceCatalogPort,
  FinancialIntelligenceEngineBundle,
  FinancialIntelligenceProductRow,
} from './ports';

@Injectable
export class NestFinancialIntelligenceCatalogAdapter implements FinancialIntelligenceCatalogPort {
  constructor(private readonly service: FinancialIntelligenceService) {}

  engine: FinancialIntelligenceEngineBundle {
    return this.service.engine;
  }

  listProducts: FinancialIntelligenceProductRow[] {
    const bundle = this.engine as { products?: FinancialIntelligenceProductRow[]; capabilities?: FinancialIntelligenceProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/financial-intelligence`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'financial-intelligence',
        name: 'Financial Intelligence',
        status: 'shipped',
        api: 'GET /v1/financial-intelligence/engine',
        console: '/financial-intelligence',
        notes: ' shipped.',
      },
    ];
  }
}
