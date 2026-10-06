import { Injectable } from '@nestjs/common';
import { MlopsLlmopsCloudService } from '../mlops-llmops-cloud.service';
import {
  MlopsLlmopsCloudCatalogPort,
  MlopsLlmopsCloudEngineBundle,
  MlopsLlmopsCloudProductRow,
} from './ports';

@Injectable()
export class NestMlopsLlmopsCloudCatalogAdapter implements MlopsLlmopsCloudCatalogPort {
  constructor(private readonly service: MlopsLlmopsCloudService) {}

  engine(): MlopsLlmopsCloudEngineBundle {
    return this.service.products();
  }

  listProducts(): MlopsLlmopsCloudProductRow[] {
    const bundle = this.engine() as {
      products?: MlopsLlmopsCloudProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/mlops-llmops-cloud`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'mlops-llmops-cloud',
        name: 'MLOps & LLMOps Cloud',
        status: 'shipped',
        api: 'GET /v1/mlops-llmops-cloud/engine',
        console: '/mlops-llmops-cloud',
        notes: 'VL-281 shipped.',
      },
    ];
  }
}
