import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  foundationModelCloudArchitectureNotes,
  foundationModelCloudCatalog,
  foundationModelCloudHonesty,
} from './foundation-model-cloud.catalog';

@Injectable
export class FoundationModelCloudService {
  constructor(private readonly usage: UsageService) {}

  products {
    return {
      product: 'Lugemi Foundation Model Cloud',
      products: foundationModelCloudCatalog,
      architecture: foundationModelCloudArchitectureNotes,
      honesty: foundationModelCloudHonesty,
      safety: {
        noFakeTrainedWeights: true,
        scaffoldsAreNotModels: true,
        note:
          'Named model products are deferred scaffolds. This hub does not claim trained competitive weights or OpenAI replacement.',
      },
      docs: '/docs/FOUNDATION_MODEL_CLOUD.md',
      note:
        'Foundation Model Cloud hub. Model-family catalog + MLOps roadmap. Not trained competitive weights. Extends Inference Cloud + AI Kernel without regenerating Volumes 1–8.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const products = foundationModelCloudCatalog;

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
      products,
      architecture: foundationModelCloudArchitectureNotes,
      honesty: foundationModelCloudHonesty,
      safety: {
        noFakeTrainedWeights: true,
        scaffoldsAreNotModels: true,
        note:
          'Named model products are deferred scaffolds. This hub does not claim trained competitive weights or OpenAI replacement.',
      },
      deferred: {
        atlas: false,
        baobab: true,
        echo: true,
        voice: true,
        vision: true,
        vector: true,
        reason: true,
        edge: true,
        fusion: true,
        translate: true,
        modelTrainingPlatform: false,
        modelEvaluationPlatform: false,
        modelRegistry: false,
        trainsCompetitiveFoundationWeights: true,
        openAiReplacementOs: true,
        regeneratesVolumes1to8: false,
      },
      links: {
        foundationModelCloud: '/foundation-model-cloud',
        modelTrainingPlatform: '/model-training-platform',
        modelEvaluationPlatform: '/model-evaluation-platform',
        modelRegistry: '/model-registry',
        atlas: '/atlas',
        inferenceCloud: '/inference-cloud',
        aiKernel: '/ai-kernel',
        modelServing: '/model-serving',
        gpuPlatform: '/gpu-platform',
        gateway: '/gateway',
        languageCloud: '/language',
        speechCloud: '/speech',
        voiceCloud: '/voice-cloud',
        embeddingCloud: '/embedding-cloud',
        reasoningCloud: '/reasoning-cloud',
        usage: '/usage',
        billing: '/billing',
        graphql: '/graphql',
      },
      docs: '/docs/FOUNDATION_MODEL_CLOUD.md',
      note:
        'Foundation Model Cloud hub. Model-family catalog + MLOps roadmap. Not trained competitive weights. Extends Inference Cloud + AI Kernel without regenerating Volumes 1–8.',
    };
  }

  monitoring {
    const products = foundationModelCloudCatalog;
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status, modality: p.modality })),
      architecture: foundationModelCloudArchitectureNotes,
      honesty: foundationModelCloudHonesty,
      note:
        'Foundation Model Cloud monitoring snapshot. Hub shipped; named families and MLOps platforms deferred per Volume 9 README.',
    };
  }
}
