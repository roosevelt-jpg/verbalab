import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  atlasArchitectureNotes,
  atlasCapabilities,
  atlasCatalog,
  atlasHonesty,
} from './atlas.catalog';

@Injectable()
export class AtlasService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return {
      ...atlasCatalog(),
      capabilities: atlasCapabilities(),
      architecture: atlasArchitectureNotes(),
      safety: {
        noFakeTrainedWeights: true,
        scaffoldNotModel: true,
        note:
          'Atlas is a family scaffold. Inference continues through Gateway vendors until trained weights exist.',
      },
    };
  }

  capabilities() {
    return {
      capabilities: atlasCapabilities(),
      honesty: atlasHonesty(),
      docs: '/docs/ATLAS.md',
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
      engine: this.engine(),
      deferred: {
        codingSpecialist: true,
        mathSpecialist: true,
        scientificSpecialist: true,
        businessSpecialist: true,
        legalSpecialist: true,
        medicalSpecialist: true,
        financialSpecialist: true,
        shipsTrainedAtlasWeights: true,
        frontierLabOs: true,
      },
      links: {
        atlas: '/atlas',
        foundationModelCloud: '/foundation-model-cloud',
        modelTrainingPlatform: '/model-training-platform',
        modelEvaluationPlatform: '/model-evaluation-platform',
        modelRegistry: '/model-registry',
        reasoningRuntime: '/reasoning-runtime',
        contextRuntime: '/context-runtime',
        agentRuntime: '/agent-runtime',
        chat: '/chat',
        modelServing: '/model-serving',
        gateway: '/gateway',
      },
      docs: '/docs/ATLAS.md',
      note:
        'Atlas scaffold. Capability map + MLOps handoffs — not trained competitive weights.',
    };
  }

  monitoring() {
    return {
      mode: 'scaffold',
      capabilities: atlasCapabilities().map((c) => ({
        id: c.id,
        status: c.status,
      })),
      honesty: atlasHonesty(),
      note:
        'Atlas monitoring. Scaffold shipped; trained weights and domain specialists deferred.',
    };
  }
}
