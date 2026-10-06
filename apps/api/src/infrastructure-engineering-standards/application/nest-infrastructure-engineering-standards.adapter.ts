import { Injectable } from '@nestjs/common';
import { InfrastructureEngineeringStandardsService } from '../infrastructure-engineering-standards.service';
import {
  InfrastructureEngineeringStandardsCatalogPort,
  InfrastructureEngineeringStandardsEngineBundle,
  InfrastructureEngineeringStandardsProductRow,
} from './ports';

@Injectable
export class NestInfrastructureEngineeringStandardsCatalogAdapter implements InfrastructureEngineeringStandardsCatalogPort {
  constructor(private readonly service: InfrastructureEngineeringStandardsService) {}

  engine: InfrastructureEngineeringStandardsEngineBundle {
    return this.service.engine;
  }

  listProducts: InfrastructureEngineeringStandardsProductRow[] {
    const bundle = this.engine as {
      products?: InfrastructureEngineeringStandardsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/infrastructure-engineering-standards`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'infrastructure-engineering-standards',
        name: 'Infrastructure Engineering Standards',
        status: 'shipped',
        api: 'GET /v1/infrastructure-engineering-standards/engine',
        console: '/infrastructure-engineering-standards',
        notes: ' shipped.',
      },
    ];
  }
}
