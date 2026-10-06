import { Injectable } from '@nestjs/common';
import { AiGovernancePlatformService } from '../ai-governance-platform.service';
import {
  AiGovernancePlatformCatalogPort,
  AiGovernancePlatformEngineBundle,
  AiGovernancePlatformProductRow,
} from './ports';

@Injectable()
export class NestAiGovernancePlatformCatalogAdapter implements AiGovernancePlatformCatalogPort {
  constructor(private readonly service: AiGovernancePlatformService) {}

  engine(): AiGovernancePlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiGovernancePlatformProductRow[] {
    const bundle = this.engine() as {
      products?: AiGovernancePlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/ai-governance-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ai-governance-platform',
        name: 'AI Governance Platform',
        status: 'shipped',
        api: 'GET /v1/ai-governance-platform/engine',
        console: '/ai-governance-platform',
        notes: 'VL-294 shipped.',
      },
    ];
  }
}
