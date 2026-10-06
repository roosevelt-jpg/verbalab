import { Injectable } from '@nestjs/common';
import { resourceManagerEngineCatalog } from './resource-manager.catalog';
import { GpuPlatformService } from '../gpu-platform/gpu-platform.service';
import { GpuRuntimeService } from '../gpu-runtime/gpu-runtime.service';
import { AiKernelService } from '../ai-kernel/ai-kernel.service';

@Injectable
export class ResourceManagerService {
  constructor(
    private readonly gpuPlatform: GpuPlatformService,
    private readonly gpuRuntime: GpuRuntimeService,
    private readonly aiKernel: AiKernelService
  ) {}

  engine {
    return resourceManagerEngineCatalog;
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
        module: 'gpu-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.gpuPlatform.engine,
      },
      {
        module: 'gpu-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.gpuRuntime.engine,
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
      mode: 'resource-manager',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'ResourceManager monitoring snapshot.',
    };
  }
}
