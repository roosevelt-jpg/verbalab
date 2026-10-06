import { Injectable } from '@nestjs/common';
import { PlatformEngineeringAnalyticsService } from '../platform-engineering-analytics.service';
import {
  PlatformEngineeringAnalyticsCatalogPort,
  PlatformEngineeringAnalyticsEngineBundle,
  PlatformEngineeringAnalyticsProductRow,
} from './ports';

@Injectable()
export class NestPlatformEngineeringAnalyticsCatalogAdapter implements PlatformEngineeringAnalyticsCatalogPort {
  constructor(private readonly service: PlatformEngineeringAnalyticsService) {}

  engine(): PlatformEngineeringAnalyticsEngineBundle {
    return this.service.engine();
  }

  listProducts(): PlatformEngineeringAnalyticsProductRow[] {
    const bundle = this.engine() as {
      products?: PlatformEngineeringAnalyticsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/platform-engineering-analytics`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'platform-engineering-analytics',
        name: 'Platform Engineering Analytics',
        status: 'shipped',
        api: 'GET /v1/platform-engineering-analytics/engine',
        console: '/platform-engineering-analytics',
        notes: ' shipped.',
      },
    ];
  }
}
