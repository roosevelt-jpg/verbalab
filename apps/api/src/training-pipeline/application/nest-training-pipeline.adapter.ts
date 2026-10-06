import { Injectable } from '@nestjs/common';
import { TrainingPipelineService } from '../training-pipeline.service';
import {
  TrainingPipelineCatalogPort,
  TrainingPipelineEngineBundle,
  TrainingPipelineProductRow,
} from './ports';

@Injectable
export class NestTrainingPipelineCatalogAdapter implements TrainingPipelineCatalogPort {
  constructor(private readonly service: TrainingPipelineService) {}

  engine: TrainingPipelineEngineBundle {
    return this.service.engine;
  }

  listProducts: TrainingPipelineProductRow[] {
    const bundle = this.engine as {
      products?: TrainingPipelineProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/training-pipeline`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'training-pipeline',
        name: 'Training Pipeline',
        status: 'shipped',
        api: 'GET /v1/training-pipeline/engine',
        console: '/training-pipeline',
        notes: ' shipped.',
      },
    ];
  }
}
