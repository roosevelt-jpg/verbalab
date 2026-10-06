import { Injectable } from '@nestjs/common';
import { ContinuousLearningService } from '../continuous-learning.service';
import {
  ContinuousLearningCatalogPort,
  ContinuousLearningEngineBundle,
  ContinuousLearningProductRow,
} from './ports';

@Injectable()
export class NestContinuousLearningCatalogAdapter implements ContinuousLearningCatalogPort {
  constructor(private readonly service: ContinuousLearningService) {}

  engine(): ContinuousLearningEngineBundle {
    return this.service.engine();
  }

  listProducts(): ContinuousLearningProductRow[] {
    const bundle = this.engine() as {
      products?: ContinuousLearningProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/continuous-learning`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'continuous-learning',
        name: 'Continuous Learning',
        status: 'shipped',
        api: 'GET /v1/continuous-learning/engine',
        console: '/continuous-learning',
        notes: 'VL-289 shipped.',
      },
    ];
  }
}
