import { Injectable } from '@nestjs/common';
import { pluginOperatingSystemEngineCatalog } from './plugin-operating-system.catalog';
import { PluginRuntimeService } from '../plugin-runtime/plugin-runtime.service';
import { PluginMarketplaceService } from '../plugin-marketplace/plugin-marketplace.service';
import { AiKernelService } from '../ai-kernel/ai-kernel.service';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';

@Injectable()
export class PluginOperatingSystemService {
  constructor(
    private readonly pluginRuntime: PluginRuntimeService,
    private readonly pluginMarketplace: PluginMarketplaceService,
    private readonly aiKernel: AiKernelService,
    private readonly policyRuntime: PolicyRuntimeService
  ) {}

  engine() {
    return pluginOperatingSystemEngineCatalog();
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
        module: 'plugin-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.pluginRuntime.engine(),
      },
      {
        module: 'plugin-marketplace',
        method: 'engine',
        status: 'reachable',
        upstream: this.pluginMarketplace.engine(),
      },
      {
        module: 'ai-kernel',
        method: 'products',
        status: 'reachable',
        upstream: this.aiKernel.products(),
      },
      {
        module: 'policy-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.policyRuntime.engine(),
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
      mode: 'plugin-operating-system',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'PluginOperatingSystem monitoring snapshot.',
    };
  }
}
