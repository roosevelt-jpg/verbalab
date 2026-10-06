import { Injectable } from '@nestjs/common';
import { ReleaseEngineeringService } from '../release-engineering.service';
import {
  ReleaseEngineeringCatalogPort,
  ReleaseEngineeringEngineBundle,
  ReleaseEngineeringProductRow,
} from './ports';

@Injectable()
export class NestReleaseEngineeringCatalogAdapter implements ReleaseEngineeringCatalogPort {
  constructor(private readonly service: ReleaseEngineeringService) {}

  engine(): ReleaseEngineeringEngineBundle {
    return this.service.engine();
  }

  listProducts(): ReleaseEngineeringProductRow[] {
    const bundle = this.engine() as {
      products?: ReleaseEngineeringProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/release-engineering`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'release-engineering',
        name: 'Release Engineering',
        status: 'shipped',
        api: 'GET /v1/release-engineering/engine',
        console: '/release-engineering',
        notes: 'VL-307 shipped.',
      },
    ];
  }
}
