import { Injectable } from '@nestjs/common';
import { GlobalConfigurationPlatformService } from '../global-configuration-platform.service';
import {
  GlobalConfigurationPlatformCatalogPort,
  GlobalConfigurationPlatformEngineBundle,
  GlobalConfigurationPlatformProductRow,
} from './ports';

@Injectable()
export class NestGlobalConfigurationPlatformCatalogAdapter implements GlobalConfigurationPlatformCatalogPort {
  constructor(private readonly service: GlobalConfigurationPlatformService) {}

  engine(): GlobalConfigurationPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): GlobalConfigurationPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: GlobalConfigurationPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/global-configuration-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'global-configuration-platform',
        name: 'Global Configuration Platform',
        status: 'shipped',
        api: 'GET /v1/global-configuration-platform/engine',
        console: '/global-configuration-platform',
        notes: 'VL-316 shipped.',
      },
    ];
  }
}
