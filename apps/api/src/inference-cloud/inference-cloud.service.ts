import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  inferenceArchitectureNotes,
  inferenceProductCatalog,
} from './inference-products.catalog';

@Injectable()
export class InferenceCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      products: inferenceProductCatalog(),
      architecture: inferenceArchitectureNotes(),
      docs: '/docs/INFERENCE_CLOUD.md',
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
      products: inferenceProductCatalog(),
      architecture: inferenceArchitectureNotes(),
      deferred: {
        gpuPlatform: false,
        modelServing: false,
        aiRouter: false,
        streamingRuntimeProduct: false,
        batchRuntimeProduct: false,
        intelligentCache: false,
        costOptimization: false,
        aiRuntimeAnalytics: false,
        autoscalingOs: true,
        multiRegionRuntimeOs: true,
        gpuHyperscalerOs: true,
        regeneratesAiGateway: false,
      },
      spendSafety: {
        hardSpendCeilingsRequired: true,
        openEndedGpuAutoscale: false,
        sandboxBeforeRealCloudBill: true,
        note:
          'GPU Platform (VL-205) must not run against a production billing account without spend limits. Cost Optimization (VL-211) must enforce caps, not only report.',
      },
      links: {
        inferenceCloud: '/inference-cloud',
        gpuPlatform: '/gpu-platform',
        modelServing: '/model-serving',
        aiRouter: '/ai-router',
        streamingRuntime: '/streaming-runtime',
        batchRuntime: '/batch-runtime',
        intelligentCache: '/intelligent-cache',
        costOptimization: '/cost-optimization',
        aiRuntimeAnalytics: '/ai-runtime-analytics',
        gateway: '/gateway',
        models: '/models',
        chat: '/chat',
        intelligenceCloud: '/intelligence-cloud',
        knowledgeCloud: '/knowledge-cloud',
        aiOrchestration: '/ai-orchestration',
        usage: '/usage',
        billing: '/billing',
        analytics: '/analytics',
        graphql: '/graphql',
        playground: '/playground',
      },
      docs: '/docs/INFERENCE_CLOUD.md',
      note:
        'Hub over AI Gateway + vendor model APIs. Not a GPU hyperscaler / multi-region Inference OS. Volumes 1–6 product clouds call Gateway today — this volume layers a shared runtime without regenerating them.',
    };
  }
}
