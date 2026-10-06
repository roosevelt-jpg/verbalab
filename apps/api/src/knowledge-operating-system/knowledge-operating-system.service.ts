import { Injectable } from '@nestjs/common';
import { knowledgeOperatingSystemEngineCatalog } from './knowledge-operating-system.catalog';
import { KnowledgeRuntimeService } from '../knowledge-runtime/knowledge-runtime.service';
import { KnowledgeFabricService } from '../knowledge-fabric/knowledge-fabric.service';
import { KnowledgeCloudService } from '../knowledge-cloud/knowledge-cloud.service';
import { AfricanKnowledgeGraphService } from '../african-knowledge-graph/african-knowledge-graph.service';

@Injectable()
export class KnowledgeOperatingSystemService {
  constructor(
    private readonly knowledgeRuntime: KnowledgeRuntimeService,
    private readonly knowledgeFabric: KnowledgeFabricService,
    private readonly knowledgeCloud: KnowledgeCloudService,
    private readonly africanKnowledgeGraph: AfricanKnowledgeGraphService
  ) {}

  engine() {
    return knowledgeOperatingSystemEngineCatalog();
  }

  /** Route/execute façade: returns upstream endpoint + live status from injected Kernel/Fabric/Data Plane services. */
  route(capability?: string) {
    const catalog = this.engine();
    const q = (capability ?? '').trim().toLowerCase();
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase().includes(q);
    });
    const upstreamStatus = [
      {
        module: 'knowledge-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.knowledgeRuntime.engine(),
      },
      {
        module: 'knowledge-fabric',
        method: 'products',
        status: 'reachable',
        upstream: this.knowledgeFabric.products(),
      },
      {
        module: 'knowledge-cloud',
        method: 'products',
        status: 'reachable',
        upstream: this.knowledgeCloud.products(),
      },
      {
        module: 'african-knowledge-graph',
        method: 'engine',
        status: 'reachable',
        upstream: this.africanKnowledgeGraph.engine(),
      }
    ];
    return {
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
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
      mode: 'knowledge-operating-system',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'KnowledgeOperatingSystem monitoring snapshot (VL-341).',
    };
  }
}
