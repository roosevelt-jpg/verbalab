import { Injectable } from '@nestjs/common';
import { HealthcareIntelligenceService } from '../healthcare-intelligence.service';
import {
  HealthcareIntelligenceCatalogPort,
  HealthcareIntelligenceEngineBundle,
  HealthcareIntelligenceProductRow,
} from './ports';

@Injectable
export class NestHealthcareIntelligenceCatalogAdapter implements HealthcareIntelligenceCatalogPort {
  constructor(private readonly service: HealthcareIntelligenceService) {}

  engine: HealthcareIntelligenceEngineBundle {
    return this.service.engine;
  }

  listProducts: HealthcareIntelligenceProductRow[] {
    const bundle = this.engine as { products?: HealthcareIntelligenceProductRow[]; capabilities?: HealthcareIntelligenceProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/healthcare-intelligence`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'healthcare-intelligence',
        name: 'Healthcare Intelligence',
        status: 'shipped',
        api: 'GET /v1/healthcare-intelligence/engine',
        console: '/healthcare-intelligence',
        notes: ' shipped.',
      },
    ];
  }
}
