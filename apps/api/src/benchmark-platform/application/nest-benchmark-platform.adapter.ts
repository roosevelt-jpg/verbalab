import { Injectable } from '@nestjs/common';
import { BenchmarkPlatformService } from '../benchmark-platform.service';
import {
  BenchmarkPlatformCatalogPort,
  BenchmarkPlatformEngineBundle,
  BenchmarkPlatformProductRow,
} from './ports';

@Injectable()
export class NestBenchmarkPlatformCatalogAdapter implements BenchmarkPlatformCatalogPort {
  constructor(private readonly service: BenchmarkPlatformService) {}

  engine(): BenchmarkPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): BenchmarkPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: BenchmarkPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/benchmark-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'benchmark-platform',
        name: 'Benchmark Platform',
        status: 'shipped',
        api: 'GET /v1/benchmark-platform/engine',
        console: '/benchmark-platform',
        notes: 'VL-274 shipped.',
      },
    ];
  }
}
