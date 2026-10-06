import { Injectable } from '@nestjs/common';
import { agentOperatingSystemEngineCatalog } from './agent-operating-system.catalog';
import { AgentRuntimeService } from '../agent-runtime/agent-runtime.service';
import { AgentFabricService } from '../agent-fabric/agent-fabric.service';
import { AgentMarketplaceService } from '../agent-marketplace/agent-marketplace.service';
import { AiKernelService } from '../ai-kernel/ai-kernel.service';
import { AiFabricService } from '../ai-fabric/ai-fabric.service';

@Injectable()
export class AgentOperatingSystemService {
  constructor(
    private readonly agentRuntime: AgentRuntimeService,
    private readonly agentFabric: AgentFabricService,
    private readonly agentMarketplace: AgentMarketplaceService,
    private readonly aiKernel: AiKernelService,
    private readonly aiFabric: AiFabricService
  ) {}

  engine() {
    return agentOperatingSystemEngineCatalog();
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
        module: 'agent-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.agentRuntime.engine(),
      },
      {
        module: 'agent-fabric',
        method: 'products',
        status: 'reachable',
        upstream: this.agentFabric.products(),
      },
      {
        module: 'agent-marketplace',
        method: 'engine',
        status: 'reachable',
        upstream: this.agentMarketplace.engine(),
      },
      {
        module: 'ai-kernel',
        method: 'products',
        status: 'reachable',
        upstream: this.aiKernel.products(),
      },
      {
        module: 'ai-fabric',
        method: 'products',
        status: 'reachable',
        upstream: this.aiFabric.products(),
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
      mode: 'agent-operating-system',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AgentOperatingSystem monitoring snapshot (VL-339).',
    };
  }
}
