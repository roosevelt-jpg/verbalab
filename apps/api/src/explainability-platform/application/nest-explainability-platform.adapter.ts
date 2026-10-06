import { Injectable } from '@nestjs/common';
import { ExplainabilityPlatformService } from '../explainability-platform.service';
import {
  ExplainabilityPlatformCatalogPort,
  ExplainabilityPlatformEngineBundle,
  ExplainabilityPlatformProductRow,
} from './ports';

@Injectable()
export class NestExplainabilityPlatformCatalogAdapter implements ExplainabilityPlatformCatalogPort {
  constructor(private readonly service: ExplainabilityPlatformService) {}

  engine(): ExplainabilityPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): ExplainabilityPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: ExplainabilityPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/explainability-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'explainability-platform',
        name: 'Explainability Platform',
        status: 'shipped',
        api: 'GET /v1/explainability-platform/engine',
        console: '/explainability-platform',
        notes: 'VL-295 shipped.',
      },
    ];
  }
}
