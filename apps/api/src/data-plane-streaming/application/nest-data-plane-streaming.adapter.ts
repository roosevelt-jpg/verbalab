import { Injectable } from '@nestjs/common';
import { DataPlaneStreamingService } from '../data-plane-streaming.service';
import {
  DataPlaneStreamingCatalogPort,
  DataPlaneStreamingEngineBundle,
  DataPlaneStreamingProductRow,
} from './ports';

@Injectable()
export class NestDataPlaneStreamingCatalogAdapter implements DataPlaneStreamingCatalogPort {
  constructor(private readonly service: DataPlaneStreamingService) {}

  engine(): DataPlaneStreamingEngineBundle {
    return this.service.engine();
  }

  listProducts(): DataPlaneStreamingProductRow[] {
    const bundle = this.engine() as {
      products?: DataPlaneStreamingProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/data-plane-streaming`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'data-plane-streaming',
        name: 'Data Plane Streaming',
        status: 'shipped',
        api: 'GET /v1/data-plane-streaming/engine',
        console: '/data-plane-streaming',
        notes: ' shipped.',
      },
    ];
  }
}
