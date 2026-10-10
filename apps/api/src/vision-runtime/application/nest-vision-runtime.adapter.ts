import { Injectable } from '@nestjs/common';
import { VisionRuntimeService } from '../vision-runtime.service';
import {
  VisionRuntimeCatalogPort,
  VisionRuntimeEngineBundle,
  VisionRuntimeProductRow,
} from './ports';

@Injectable()
export class NestVisionRuntimeCatalogAdapter implements VisionRuntimeCatalogPort {
  constructor(private readonly service: VisionRuntimeService) {}

  engine(): VisionRuntimeEngineBundle {
    return this.service.engine();
  }

  listProducts(): VisionRuntimeProductRow[] {
    const bundle = this.engine() as {
      products?: VisionRuntimeProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/vision-runtime`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'vision-runtime',
        name: 'Vision Runtime',
        status: 'shipped',
        api: 'GET /v1/vision-runtime/engine',
        console: '/vision-runtime',
        notes: ' shipped.',
      },
    ];
  }
}
