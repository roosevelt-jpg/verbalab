import { Injectable } from '@nestjs/common';
import { gpuRuntimeEngineCatalog } from './gpu-runtime.catalog';
import { GpuPlatformService } from '../gpu-platform/gpu-platform.service';

@Injectable()
export class GpuRuntimeService {
  constructor(
    private readonly gpuPlatform: GpuPlatformService
  ) {}

  engine() {
    return gpuRuntimeEngineCatalog();
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
        module: 'gpu-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.gpuPlatform.engine(),
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
      mode: 'gpu-runtime',
      count: catalog.routes.length,
      thinExecutionLayer: true,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'GpuRuntime monitoring snapshot (VL-332).',
    };
  }
}
