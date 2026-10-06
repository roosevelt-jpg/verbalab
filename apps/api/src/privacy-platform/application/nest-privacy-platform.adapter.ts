import { Injectable } from '@nestjs/common';
import { PrivacyPlatformService } from '../privacy-platform.service';
import {
  PrivacyPlatformCatalogPort,
  PrivacyPlatformEngineBundle,
  PrivacyPlatformProductRow,
} from './ports';

@Injectable()
export class NestPrivacyPlatformCatalogAdapter implements PrivacyPlatformCatalogPort {
  constructor(private readonly service: PrivacyPlatformService) {}

  engine(): PrivacyPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): PrivacyPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: PrivacyPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/privacy-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'privacy-platform',
        name: 'Privacy Platform',
        status: 'shipped',
        api: 'GET /v1/privacy-platform/engine',
        console: '/privacy-platform',
        notes: ' shipped.',
      },
    ];
  }
}
