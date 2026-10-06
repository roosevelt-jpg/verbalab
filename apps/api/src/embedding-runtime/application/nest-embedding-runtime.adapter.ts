import { Injectable } from '@nestjs/common';
import { EmbeddingRuntimeService } from '../embedding-runtime.service';
import {
  EmbeddingRuntimeCatalogPort,
  EmbeddingRuntimeEngineBundle,
  EmbeddingRuntimeProductRow,
} from './ports';

@Injectable
export class NestEmbeddingRuntimeCatalogAdapter implements EmbeddingRuntimeCatalogPort {
  constructor(private readonly service: EmbeddingRuntimeService) {}

  engine: EmbeddingRuntimeEngineBundle {
    return this.service.engine;
  }

  listProducts: EmbeddingRuntimeProductRow[] {
    const bundle = this.engine as {
      products?: EmbeddingRuntimeProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/embedding-runtime`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'embedding-runtime',
        name: 'Embedding Runtime',
        status: 'shipped',
        api: 'GET /v1/embedding-runtime/engine',
        console: '/embedding-runtime',
        notes: ' shipped.',
      },
    ];
  }
}
