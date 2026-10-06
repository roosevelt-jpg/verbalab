import { Injectable } from '@nestjs/common';
import { AiSafetyPlatformService } from '../ai-safety-platform.service';
import {
  AiSafetyPlatformCatalogPort,
  AiSafetyPlatformEngineBundle,
  AiSafetyPlatformProductRow,
} from './ports';

@Injectable()
export class NestAiSafetyPlatformCatalogAdapter implements AiSafetyPlatformCatalogPort {
  constructor(private readonly service: AiSafetyPlatformService) {}

  engine(): AiSafetyPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiSafetyPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: AiSafetyPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/ai-safety-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ai-safety-platform',
        name: 'AI Safety Platform',
        status: 'shipped',
        api: 'GET /v1/ai-safety-platform/engine',
        console: '/ai-safety-platform',
        notes: 'VL-293 shipped.',
      },
    ];
  }
}
