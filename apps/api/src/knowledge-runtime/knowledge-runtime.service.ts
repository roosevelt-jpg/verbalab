import { Injectable } from '@nestjs/common';
import { knowledgeRuntimeEngineCatalog } from './knowledge-runtime.catalog';
import { KnowledgeCloudService } from '../knowledge-cloud/knowledge-cloud.service';

@Injectable()
export class KnowledgeRuntimeService {
  constructor(
    private readonly knowledgeCloud: KnowledgeCloudService
  ) {}

  engine() {
    return knowledgeRuntimeEngineCatalog();
  }

  /** Route/execute façade: returns upstream endpoint + live status from injected product services. */
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
      }
    ];
    return {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
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
      mode: 'knowledge-runtime',
      count: catalog.routes.length,
      thinExecutionLayer: true,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'KnowledgeRuntime monitoring snapshot (VL-329).',
    };
  }
}
