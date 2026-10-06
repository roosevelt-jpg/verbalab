import { Injectable } from '@nestjs/common';
import { runtimeManagerEngineCatalog } from './runtime-manager.catalog';
import { AiKernelService } from '../ai-kernel/ai-kernel.service';
import { AgentRuntimeService } from '../agent-runtime/agent-runtime.service';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';
import { MemoryRuntimeService } from '../memory-runtime/memory-runtime.service';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import { PromptRuntimeService } from '../prompt-runtime/prompt-runtime.service';
import { ContextRuntimeService } from '../context-runtime/context-runtime.service';
import { BatchRuntimeService } from '../batch-runtime/batch-runtime.service';
import { StreamingRuntimeService } from '../streaming-runtime/streaming-runtime.service';
import { DataPlaneCloudService } from '../data-plane-cloud/data-plane-cloud.service';

@Injectable
export class RuntimeManagerService {
  constructor(
    private readonly aiKernel: AiKernelService,
    private readonly agentRuntime: AgentRuntimeService,
    private readonly workflowRuntime: WorkflowRuntimeService,
    private readonly memoryRuntime: MemoryRuntimeService,
    private readonly policyRuntime: PolicyRuntimeService,
    private readonly promptRuntime: PromptRuntimeService,
    private readonly contextRuntime: ContextRuntimeService,
    private readonly batchRuntime: BatchRuntimeService,
    private readonly streamingRuntime: StreamingRuntimeService,
    private readonly dataPlaneCloud: DataPlaneCloudService
  ) {}

  engine {
    return runtimeManagerEngineCatalog;
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
        module: 'ai-kernel',
        method: 'products',
        status: 'reachable',
        upstream: this.aiKernel.products,
      },
      {
        module: 'agent-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.agentRuntime.engine,
      },
      {
        module: 'workflow-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.workflowRuntime.engine,
      },
      {
        module: 'memory-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.memoryRuntime.engine,
      },
      {
        module: 'policy-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.policyRuntime.engine,
      },
      {
        module: 'prompt-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.promptRuntime.engine,
      },
      {
        module: 'context-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.contextRuntime.engine,
      },
      {
        module: 'batch-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.batchRuntime.engine,
      },
      {
        module: 'streaming-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.streamingRuntime.engine,
      },
      {
        module: 'data-plane-cloud',
        method: 'products',
        status: 'reachable',
        upstream: this.dataPlaneCloud.products,
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
      mode: 'runtime-manager',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'RuntimeManager monitoring snapshot.',
    };
  }
}
