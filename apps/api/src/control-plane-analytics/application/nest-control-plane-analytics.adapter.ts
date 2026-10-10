import { Injectable } from '@nestjs/common';
import { ControlPlaneAnalyticsService } from '../control-plane-analytics.service';
import {
  ControlPlaneAnalyticsCatalogPort,
  ControlPlaneAnalyticsEngineBundle,
  ControlPlaneAnalyticsProductRow,
} from './ports';

@Injectable()
export class NestControlPlaneAnalyticsCatalogAdapter implements ControlPlaneAnalyticsCatalogPort {
  constructor(private readonly service: ControlPlaneAnalyticsService) {}

  engine(): ControlPlaneAnalyticsEngineBundle {
    return this.service.engine();
  }

  listProducts(): ControlPlaneAnalyticsProductRow[] {
    const bundle = this.engine() as {
      products?: ControlPlaneAnalyticsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/control-plane-analytics`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'control-plane-analytics',
        name: 'Control Plane Analytics',
        status: 'shipped',
        api: 'GET /v1/control-plane-analytics/engine',
        console: '/control-plane-analytics',
        notes: ' shipped.',
      },
    ];
  }
}
