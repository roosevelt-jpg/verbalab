import { Injectable } from '@nestjs/common';
import { ApiEngineeringStandardsService } from '../api-engineering-standards.service';
import {
  ApiEngineeringStandardsCatalogPort,
  ApiEngineeringStandardsEngineBundle,
  ApiEngineeringStandardsProductRow,
} from './ports';

@Injectable
export class NestApiEngineeringStandardsCatalogAdapter implements ApiEngineeringStandardsCatalogPort {
  constructor(private readonly service: ApiEngineeringStandardsService) {}

  engine: ApiEngineeringStandardsEngineBundle {
    return this.service.engine;
  }

  listProducts: ApiEngineeringStandardsProductRow[] {
    const bundle = this.engine as {
      products?: ApiEngineeringStandardsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/api-engineering-standards`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'api-engineering-standards',
        name: 'API Engineering Standards',
        status: 'shipped',
        api: 'GET /v1/api-engineering-standards/engine',
        console: '/api-engineering-standards',
        notes: ' shipped.',
      },
    ];
  }
}
