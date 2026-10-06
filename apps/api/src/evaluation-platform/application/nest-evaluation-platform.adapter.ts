import { Injectable } from '@nestjs/common';
import { EvaluationPlatformService } from '../evaluation-platform.service';
import {
  EvaluationPlatformCatalogPort,
  EvaluationPlatformEngineBundle,
  EvaluationPlatformProductRow,
} from './ports';

@Injectable
export class NestEvaluationPlatformCatalogAdapter implements EvaluationPlatformCatalogPort {
  constructor(private readonly service: EvaluationPlatformService) {}

  engine: EvaluationPlatformEngineBundle {
    return this.service.engine;
  }

  listProducts: EvaluationPlatformProductRow[] {
    const bundle = this.engine as {
      products?: EvaluationPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/evaluation-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'evaluation-platform',
        name: 'Evaluation Platform',
        status: 'shipped',
        api: 'GET /v1/evaluation-platform/engine',
        console: '/evaluation-platform',
        notes: ' shipped.',
      },
    ];
  }
}
