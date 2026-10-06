import { Injectable } from '@nestjs/common';
import { EducationIntelligenceService } from '../education-intelligence.service';
import {
  EducationIntelligenceCatalogPort,
  EducationIntelligenceEngineBundle,
  EducationIntelligenceProductRow,
} from './ports';

@Injectable
export class NestEducationIntelligenceCatalogAdapter implements EducationIntelligenceCatalogPort {
  constructor(private readonly service: EducationIntelligenceService) {}

  engine: EducationIntelligenceEngineBundle {
    return this.service.engine;
  }

  listProducts: EducationIntelligenceProductRow[] {
    const bundle = this.engine as { products?: EducationIntelligenceProductRow[]; capabilities?: EducationIntelligenceProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/education-intelligence`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'education-intelligence',
        name: 'Education Intelligence',
        status: 'shipped',
        api: 'GET /v1/education-intelligence/engine',
        console: '/education-intelligence',
        notes: ' shipped.',
      },
    ];
  }
}
