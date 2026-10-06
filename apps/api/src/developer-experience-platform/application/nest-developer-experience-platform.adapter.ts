import { Injectable } from '@nestjs/common';
import { DeveloperExperiencePlatformService } from '../developer-experience-platform.service';
import {
  DeveloperExperiencePlatformCatalogPort,
  DeveloperExperiencePlatformEngineBundle,
  DeveloperExperiencePlatformProductRow,
} from './ports';

@Injectable()
export class NestDeveloperExperiencePlatformCatalogAdapter implements DeveloperExperiencePlatformCatalogPort {
  constructor(private readonly service: DeveloperExperiencePlatformService) {}

  engine(): DeveloperExperiencePlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): DeveloperExperiencePlatformProductRow[] {
    const bundle = this.engine() as {
      products?: DeveloperExperiencePlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/developer-experience-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'developer-experience-platform',
        name: 'Developer Experience Platform',
        status: 'shipped',
        api: 'GET /v1/developer-experience-platform/engine',
        console: '/developer-experience-platform',
        notes: 'VL-311 shipped.',
      },
    ];
  }
}
