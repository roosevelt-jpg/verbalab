import { Injectable } from '@nestjs/common';
import { GpuRuntimeService } from '../gpu-runtime.service';
import {
  GpuRuntimeCatalogPort,
  GpuRuntimeEngineBundle,
  GpuRuntimeProductRow,
} from './ports';

@Injectable
export class NestGpuRuntimeCatalogAdapter implements GpuRuntimeCatalogPort {
  constructor(private readonly service: GpuRuntimeService) {}

  engine: GpuRuntimeEngineBundle {
    return this.service.engine;
  }

  listProducts: GpuRuntimeProductRow[] {
    const bundle = this.engine as {
      products?: GpuRuntimeProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/gpu-runtime`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'gpu-runtime',
        name: 'GPU Runtime',
        status: 'shipped',
        api: 'GET /v1/gpu-runtime/engine',
        console: '/gpu-runtime',
        notes: ' shipped.',
      },
    ];
  }
}
