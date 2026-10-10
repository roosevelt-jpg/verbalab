import { Injectable } from '@nestjs/common';
import { DatabaseEngineeringStandardsService } from '../database-engineering-standards.service';
import {
  DatabaseEngineeringStandardsCatalogPort,
  DatabaseEngineeringStandardsEngineBundle,
  DatabaseEngineeringStandardsProductRow,
} from './ports';

@Injectable()
export class NestDatabaseEngineeringStandardsCatalogAdapter implements DatabaseEngineeringStandardsCatalogPort {
  constructor(private readonly service: DatabaseEngineeringStandardsService) {}

  engine(): DatabaseEngineeringStandardsEngineBundle {
    return this.service.engine();
  }

  listProducts(): DatabaseEngineeringStandardsProductRow[] {
    const bundle = this.engine() as {
      products?: DatabaseEngineeringStandardsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/database-engineering-standards`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'database-engineering-standards',
        name: 'Database Engineering Standards',
        status: 'shipped',
        api: 'GET /v1/database-engineering-standards/engine',
        console: '/database-engineering-standards',
        notes: ' shipped.',
      },
    ];
  }
}
