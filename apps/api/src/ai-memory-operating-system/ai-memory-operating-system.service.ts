import { Injectable } from '@nestjs/common';
import { aiMemoryOperatingSystemEngineCatalog } from './ai-memory-operating-system.catalog';
import { MemoryRuntimeService } from '../memory-runtime/memory-runtime.service';
import { MemoryFabricService } from '../memory-fabric/memory-fabric.service';
import { KnowledgeMemoryService } from '../knowledge-memory/knowledge-memory.service';
import { AiKernelService } from '../ai-kernel/ai-kernel.service';

@Injectable
export class AiMemoryOperatingSystemService {
  constructor(
    private readonly memoryRuntime: MemoryRuntimeService,
    private readonly memoryFabric: MemoryFabricService,
    private readonly knowledgeMemory: KnowledgeMemoryService,
    private readonly aiKernel: AiKernelService
  ) {}

  engine {
    return aiMemoryOperatingSystemEngineCatalog;
  }

  /** Route/execute façade: returns upstream endpoint + live status from injected Kernel/Fabric/Data Plane services. */
  route(capability?: string) {
    const catalog = this.engine;
    const q = (capability ?? '').trim.toLowerCase;
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase.includes(q);
    });
    const upstreamStatus = [
      {
        module: 'memory-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.memoryRuntime.engine,
      },
      {
        module: 'memory-fabric',
        method: 'products',
        status: 'reachable',
        upstream: this.memoryFabric.products,
      },
      {
        module: 'knowledge-memory',
        method: 'engine',
        status: 'reachable',
        upstream: this.knowledgeMemory.engine,
      },
      {
        module: 'ai-kernel',
        method: 'products',
        status: 'reachable',
        upstream: this.aiKernel.products,
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
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.routes.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
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

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'ai-memory-operating-system',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AiMemoryOperatingSystem monitoring snapshot.',
    };
  }
}
