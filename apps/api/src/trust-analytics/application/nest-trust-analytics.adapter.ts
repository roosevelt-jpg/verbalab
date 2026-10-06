import { Injectable } from '@nestjs/common';
import { TrustAnalyticsService } from '../trust-analytics.service';
import {
  TrustAnalyticsCatalogPort,
  TrustAnalyticsEngineBundle,
  TrustAnalyticsProductRow,
} from './ports';

@Injectable()
export class NestTrustAnalyticsCatalogAdapter implements TrustAnalyticsCatalogPort {
  constructor(private readonly service: TrustAnalyticsService) {}

  engine(): TrustAnalyticsEngineBundle {
    return this.service.engine();
  }

  listProducts(): TrustAnalyticsProductRow[] {
    const bundle = this.engine() as {
      products?: TrustAnalyticsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/trust-analytics`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'trust-analytics',
        name: 'Trust Analytics',
        status: 'shipped',
        api: 'GET /v1/trust-analytics/engine',
        console: '/trust-analytics',
        notes: 'VL-300 shipped.',
      },
    ];
  }
}
