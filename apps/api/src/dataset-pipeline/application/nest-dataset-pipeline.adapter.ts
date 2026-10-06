import { Injectable } from '@nestjs/common';
import { DatasetPipelineService } from '../dataset-pipeline.service';
import {
  DatasetPipelineCatalogPort,
  DatasetPipelineEngineBundle,
  DatasetPipelineProductRow,
} from './ports';

@Injectable()
export class NestDatasetPipelineCatalogAdapter implements DatasetPipelineCatalogPort {
  constructor(private readonly service: DatasetPipelineService) {}

  engine(): DatasetPipelineEngineBundle {
    return this.service.engine();
  }

  listProducts(): DatasetPipelineProductRow[] {
    const bundle = this.engine() as {
      products?: DatasetPipelineProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/dataset-pipeline`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'dataset-pipeline',
        name: 'Dataset Pipeline',
        status: 'shipped',
        api: 'GET /v1/dataset-pipeline/engine',
        console: '/dataset-pipeline',
        notes: ' shipped.',
      },
    ];
  }
}
