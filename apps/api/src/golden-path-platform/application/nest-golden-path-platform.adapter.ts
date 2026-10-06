import { Injectable } from '@nestjs/common';
import { GoldenPathPlatformService } from '../golden-path-platform.service';
import {
  GoldenPathPlatformCatalogPort,
  GoldenPathPlatformEngineBundle,
  GoldenPathPlatformProductRow,
} from './ports';

@Injectable
export class NestGoldenPathPlatformCatalogAdapter implements GoldenPathPlatformCatalogPort {
  constructor(private readonly service: GoldenPathPlatformService) {}

  engine: GoldenPathPlatformEngineBundle {
    return this.service.engine;
  }

  listProducts: GoldenPathPlatformProductRow[] {
    const bundle = this.engine as {
      products?: GoldenPathPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/golden-path-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'golden-path-platform',
        name: 'Golden Path Platform',
        status: 'shipped',
        api: 'GET /v1/golden-path-platform/engine',
        console: '/golden-path-platform',
        notes: ' shipped.',
      },
    ];
  }
}
