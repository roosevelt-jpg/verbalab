import { Injectable } from '@nestjs/common';
import { aiSchedulerEngineCatalog } from './ai-scheduler.catalog';
import { GlobalSchedulerService } from '../global-scheduler/global-scheduler.service';
import { GpuRuntimeService } from '../gpu-runtime/gpu-runtime.service';
import { GpuPlatformService } from '../gpu-platform/gpu-platform.service';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';
import { AgentRuntimeService } from '../agent-runtime/agent-runtime.service';

@Injectable()
export class AiSchedulerService {
  constructor(
    private readonly globalScheduler: GlobalSchedulerService,
    private readonly gpuRuntime: GpuRuntimeService,
    private readonly gpuPlatform: GpuPlatformService,
    private readonly workflowRuntime: WorkflowRuntimeService,
    private readonly agentRuntime: AgentRuntimeService
  ) {}

  engine() {
    return aiSchedulerEngineCatalog();
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
        module: 'global-scheduler',
        method: 'engine',
        status: 'reachable',
        upstream: this.globalScheduler.engine(),
      },
      {
        module: 'gpu-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.gpuRuntime.engine(),
      },
      {
        module: 'gpu-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.gpuPlatform.engine(),
      },
      {
        module: 'workflow-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.workflowRuntime.engine(),
      },
      {
        module: 'agent-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.agentRuntime.engine(),
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
      mode: 'ai-scheduler',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AiScheduler monitoring snapshot.',
    };
  }
}
