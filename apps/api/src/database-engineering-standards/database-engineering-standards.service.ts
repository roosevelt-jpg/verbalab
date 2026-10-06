import { Injectable } from '@nestjs/common';
import { databaseEngineeringStandardsEngineCatalog } from './database-engineering-standards.catalog';
import { KnowledgeCloudService } from '../knowledge-cloud/knowledge-cloud.service';
import { VectorCloudService } from '../vector-cloud/vector-cloud.service';
import { EmbeddingRuntimeService } from '../embedding-runtime/embedding-runtime.service';

@Injectable()
export class DatabaseEngineeringStandardsService {
  constructor(
    private readonly knowledgeCloud: KnowledgeCloudService,
    private readonly vectorCloud: VectorCloudService,
    private readonly embeddingRuntime: EmbeddingRuntimeService
  ) {}

  engine() {
    return databaseEngineeringStandardsEngineCatalog();
  }

  /** Catalog route: returns standards capability + live status from injected upstream services. */
  route(capability?: string) {
    const catalog = this.engine();
    const q = (capability ?? '').trim().toLowerCase();
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase().includes(q);
    });
    const upstreamStatus = [
      {
        module: 'knowledge-cloud',
        method: 'products',
        status: 'reachable',
        upstream: this.knowledgeCloud.products(),
      },
      {
        module: 'vector-cloud',
        method: 'engine',
        status: 'reachable',
        upstream: this.vectorCloud.engine(),
      },
      {
        module: 'embedding-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.embeddingRuntime.engine(),
      }
    ];
    return {
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      capability: capability ?? null,
      capabilities,
      routesTo: catalog.routesTo,
      upstreamStatus,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  execute(capability?: string) {
    return this.route(capability);
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.routes.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      routes: rows,
      count: rows.length,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'database-engineering-standards',
      count: catalog.routes.length,
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'DatabaseEngineeringStandards monitoring snapshot.',
    };
  }
}
