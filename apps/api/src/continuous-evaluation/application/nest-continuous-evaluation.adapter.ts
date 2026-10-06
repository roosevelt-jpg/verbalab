import { Injectable } from '@nestjs/common';
import { ContinuousEvaluationService } from '../continuous-evaluation.service';
import {
  ContinuousEvaluationCatalogPort,
  ContinuousEvaluationEngineBundle,
  ContinuousEvaluationProductRow,
} from './ports';

@Injectable()
export class NestContinuousEvaluationCatalogAdapter implements ContinuousEvaluationCatalogPort {
  constructor(private readonly service: ContinuousEvaluationService) {}

  engine(): ContinuousEvaluationEngineBundle {
    return this.service.engine();
  }

  listProducts(): ContinuousEvaluationProductRow[] {
    const bundle = this.engine() as {
      products?: ContinuousEvaluationProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/continuous-evaluation`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'continuous-evaluation',
        name: 'Continuous Evaluation',
        status: 'shipped',
        api: 'GET /v1/continuous-evaluation/engine',
        console: '/continuous-evaluation',
        notes: 'VL-284 shipped.',
      },
    ];
  }
}
