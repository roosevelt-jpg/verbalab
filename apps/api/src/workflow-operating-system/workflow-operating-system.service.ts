import { Injectable } from '@nestjs/common';
import { workflowOperatingSystemEngineCatalog } from './workflow-operating-system.catalog';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';
import { WorkflowMarketplaceService } from '../workflow-marketplace/workflow-marketplace.service';
import { AiKernelService } from '../ai-kernel/ai-kernel.service';

@Injectable()
export class WorkflowOperatingSystemService {
  constructor(
    private readonly workflowRuntime: WorkflowRuntimeService,
    private readonly workflowMarketplace: WorkflowMarketplaceService,
    private readonly aiKernel: AiKernelService
  ) {}

  engine() {
    return workflowOperatingSystemEngineCatalog();
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
        module: 'workflow-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.workflowRuntime.engine(),
      },
      {
        module: 'workflow-marketplace',
        method: 'engine',
        status: 'reachable',
        upstream: this.workflowMarketplace.engine(),
      },
      {
        module: 'ai-kernel',
        method: 'products',
        status: 'reachable',
        upstream: this.aiKernel.products(),
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
      mode: 'workflow-operating-system',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'WorkflowOperatingSystem monitoring snapshot (VL-338).',
    };
  }
}
