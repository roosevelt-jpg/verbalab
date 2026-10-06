import { Injectable } from '@nestjs/common';
import { ResearchAnalyticsService } from '../research-analytics.service';
import {
  ResearchAnalyticsCatalogPort,
  ResearchAnalyticsEngineBundle,
  ResearchAnalyticsProductRow,
} from './ports';

@Injectable
export class NestResearchAnalyticsCatalogAdapter implements ResearchAnalyticsCatalogPort {
  constructor(private readonly service: ResearchAnalyticsService) {}

  engine: ResearchAnalyticsEngineBundle {
    return this.service.engine;
  }

  listProducts: ResearchAnalyticsProductRow[] {
    const bundle = this.engine as {
      products?: ResearchAnalyticsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/research-analytics`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'research-analytics',
        name: 'Research Analytics',
        status: 'shipped',
        api: 'GET /v1/research-analytics/engine',
        console: '/research-analytics',
        notes: ' shipped.',
      },
    ];
  }
}
