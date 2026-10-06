import { Injectable } from '@nestjs/common';
import { AfricanKnowledgeGraphService } from '../african-knowledge-graph.service';
import {
  AfricanKnowledgeGraphCatalogPort,
  AfricanKnowledgeGraphEngineBundle,
  AfricanKnowledgeGraphProductRow,
} from './ports';

@Injectable
export class NestAfricanKnowledgeGraphCatalogAdapter implements AfricanKnowledgeGraphCatalogPort {
  constructor(private readonly service: AfricanKnowledgeGraphService) {}

  engine: AfricanKnowledgeGraphEngineBundle {
    return this.service.engine;
  }

  listProducts: AfricanKnowledgeGraphProductRow[] {
    const bundle = this.engine as { products?: AfricanKnowledgeGraphProductRow[]; capabilities?: AfricanKnowledgeGraphProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/african-knowledge-graph`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'african-knowledge-graph',
        name: 'African Knowledge Graph',
        status: 'shipped',
        api: 'GET /v1/african-knowledge-graph/engine',
        console: '/african-knowledge-graph',
        notes: ' shipped.',
      },
    ];
  }
}
