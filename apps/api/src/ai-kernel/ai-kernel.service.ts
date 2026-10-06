import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  aiKernelArchitectureNotes,
  aiKernelRuntimeCatalog,
  aiKernelSafetyNotes,
} from './ai-kernel.catalog';

@Injectable()
export class AiKernelService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi AI Kernel',
      products: aiKernelRuntimeCatalog(),
      architecture: aiKernelArchitectureNotes(),
      safety: aiKernelSafetyNotes(),
      docs: '/docs/AI_KERNEL.md',
      note:
        'Internal operating-system hub for Lugemi runtimes (VL-214). Not a customer-facing product. Does not regenerate Volumes 1–7 or invent a Linux/VAIOS rewrite.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        chat: usageSummary.chat,
        embeddings: usageSummary.embeddings,
      },
      products: aiKernelRuntimeCatalog(),
      architecture: aiKernelArchitectureNotes(),
      safety: aiKernelSafetyNotes(),
      deferred: {
        memoryRuntime: false,
        promptRuntime: false,
        contextRuntime: false,
        reasoningRuntime: false,
        agentRuntime: false,
        workflowRuntime: false,
        pluginRuntime: false,
        policyRuntime: false,
        linuxOsRewrite: true,
        vaiosOs: true,
        regeneratesVolumes1to7: false,
      },
      links: {
        aiKernel: '/ai-kernel',
        memoryRuntime: '/memory-runtime',
        promptRuntime: '/prompt-runtime',
        contextRuntime: '/context-runtime',
        reasoningRuntime: '/reasoning-runtime',
        agentRuntime: '/agent-runtime',
        workflowRuntime: '/workflow-runtime',
        pluginRuntime: '/plugin-runtime',
        policyRuntime: '/policy-runtime',
        inferenceCloud: '/inference-cloud',
        gateway: '/gateway',
        memoryCloud: '/memory-cloud',
        contextEngine: '/context-engine',
        reasoningCloud: '/reasoning-cloud',
        promptIntelligence: '/prompt-intelligence',
        aiOrchestration: '/ai-orchestration',
        decisionEngine: '/decision-engine',
        costOptimization: '/cost-optimization',
        usage: '/usage',
        billing: '/billing',
        graphql: '/graphql',
      },
      docs: '/docs/AI_KERNEL.md',
      note:
        'Internal kernel hub. Volumes 1–7 product/inference clouds remain; this volume layers execution runtimes with permission/sandbox/policy constraints from day one.',
    };
  }

  monitoring() {
    const products = aiKernelRuntimeCatalog();
    return {
      product: 'Lugemi AI Kernel',
      mode: 'foundation',
      runtimes: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: aiKernelArchitectureNotes(),
      safety: aiKernelSafetyNotes(),
      honesty: {
        customerFacingProduct: false,
        linuxOsRewrite: false,
        vaiosOs: false,
        regeneratesVolumes1to7: false,
      },
      note: 'Kernel monitoring snapshot (VL-214–223). Volume 8 closed via Production Audit evidence pack; Foundation Model Cloud is Volume 9 when scheduled.',
    };
  }
}
