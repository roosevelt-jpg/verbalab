import { Injectable } from '@nestjs/common';
import { CompliancePlatformService } from '../compliance-platform.service';
import {
  CompliancePlatformCatalogPort,
  CompliancePlatformEngineBundle,
  CompliancePlatformProductRow,
} from './ports';

@Injectable()
export class NestCompliancePlatformCatalogAdapter implements CompliancePlatformCatalogPort {
  constructor(private readonly service: CompliancePlatformService) {}

  engine(): CompliancePlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): CompliancePlatformProductRow[] {
    const bundle = this.engine() as {
      products?: CompliancePlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/compliance-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'compliance-platform',
        name: 'Compliance Platform',
        status: 'shipped',
        api: 'GET /v1/compliance-platform/engine',
        console: '/compliance-platform',
        notes: ' shipped.',
      },
    ];
  }
}
