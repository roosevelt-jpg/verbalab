import { Injectable } from '@nestjs/common';
import { AiDriftDetectionService } from '../ai-drift-detection.service';
import {
  AiDriftDetectionCatalogPort,
  AiDriftDetectionEngineBundle,
  AiDriftDetectionProductRow,
} from './ports';

@Injectable()
export class NestAiDriftDetectionCatalogAdapter implements AiDriftDetectionCatalogPort {
  constructor(private readonly service: AiDriftDetectionService) {}

  engine(): AiDriftDetectionEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiDriftDetectionProductRow[] {
    const bundle = this.engine() as {
      products?: AiDriftDetectionProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/ai-drift-detection`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ai-drift-detection',
        name: 'AI Drift Detection',
        status: 'shipped',
        api: 'GET /v1/ai-drift-detection/engine',
        console: '/ai-drift-detection',
        notes: ' shipped.',
      },
    ];
  }
}
