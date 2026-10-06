import { Injectable } from '@nestjs/common';
import { PluginOperatingSystemService } from '../plugin-operating-system.service';
import {
  PluginOperatingSystemCatalogPort,
  PluginOperatingSystemEngineBundle,
  PluginOperatingSystemProductRow,
} from './ports';

@Injectable()
export class NestPluginOperatingSystemCatalogAdapter implements PluginOperatingSystemCatalogPort {
  constructor(private readonly service: PluginOperatingSystemService) {}

  engine(): PluginOperatingSystemEngineBundle {
    return this.service.engine();
  }

  listProducts(): PluginOperatingSystemProductRow[] {
    const bundle = this.engine() as {
      products?: PluginOperatingSystemProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/plugin-operating-system`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'plugin-operating-system',
        name: 'Plugin Operating System',
        status: 'shipped',
        api: 'GET /v1/plugin-operating-system/engine',
        console: '/plugin-operating-system',
        notes: 'VL-342 shipped.',
      },
    ];
  }
}
