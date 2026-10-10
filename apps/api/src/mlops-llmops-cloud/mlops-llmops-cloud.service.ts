import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  mlopsAssetTypesCatalog,
  mlopsLlmopsCloudArchitectureNotes,
  mlopsLlmopsCloudHonesty,
  mlopsLlmopsCloudProductCatalog,
  mlopsLlmopsCloudRoutingTable,
} from './mlops-llmops-cloud.catalog';

@Injectable()
export class MlopsLlmopsCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi MLOps & LLMOps Cloud',
      products: mlopsLlmopsCloudProductCatalog(),
      assetTypes: mlopsAssetTypesCatalog(),
      architecture: mlopsLlmopsCloudArchitectureNotes(),
      honesty: mlopsLlmopsCloudHonesty(),
      safety: {
        humanApprovalRequiredBeforePromote: true,
        poisonedInputGuard: true,
        requiresDriftClear: true,
        requiresContinuousEvalPass: true,
        policyViolationsVisible: true,
        trustCloudOs: false,
        note:
          'Platform docs: Continuous Learning never auto-promotes; AgentOps surfaces policy violations for humans; Trust Cloud deferred.',
      },
      docs: '/docs/MLOPS_LLMOPS_CLOUD.md',
      note:
        'MLOps & LLMOps Cloud Foundation. Extends Inference/Kernel/Foundation/RAG/Agent/Prompt. Not Kubeflow/SageMaker/Vertex/W&B/MLflow/LangSmith/Ray OS. Trust Cloud deferred.',
    };
  }

  routing() {
    return {
      routes: mlopsLlmopsCloudRoutingTable(),
      products: mlopsLlmopsCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: mlopsLlmopsCloudHonesty(),
      note: 'Static MLOps & LLMOps Cloud discovery catalog for Foundation.',
      docs: '/docs/MLOPS_LLMOPS_CLOUD.md',
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
      products: mlopsLlmopsCloudProductCatalog(),
      assetTypes: mlopsAssetTypesCatalog(),
      architecture: mlopsLlmopsCloudArchitectureNotes(),
      honesty: mlopsLlmopsCloudHonesty(),
      safety: {
        humanApprovalRequiredBeforePromote: true,
        poisonedInputGuard: true,
        policyViolationsVisible: true,
        trustCloudOs: false,
        note:
          'Promote gates and AgentOps policy visibility enforced. Trust Cloud rejected in this volume.',
      },
      deferred: {
        kubeflowOs: true,
        sageMakerOs: true,
        vertexOs: true,
        weightsAndBiasesOs: true,
        mlflowOs: true,
        langSmithOs: true,
        rayClusterOs: true,
        distributedTrainingOs: true,
        trustCloudOs: true,
        regeneratesPriorLayers: false,
      },
      links: {
        mlopsLlmopsCloud: '/mlops-llmops-cloud',
        datasetPipeline: '/dataset-pipeline',
        trainingPipeline: '/training-pipeline',
        continuousEvaluation: '/continuous-evaluation',
        promptopsPlatform: '/promptops-platform',
        ragopsPlatform: '/ragops-platform',
        agentopsPlatform: '/agentops-platform',
        aiDriftDetection: '/ai-drift-detection',
        continuousLearning: '/continuous-learning',
        aiOperationsDashboard: '/ai-operations-dashboard',
        inferenceCloud: '/inference-cloud',
        evaluationPlatform: '/evaluation-platform',
        promptRuntime: '/prompt-runtime',
        agentRuntime: '/agent-runtime',
      },
      docs: '/docs/MLOPS_LLMOPS_CLOUD.md',
      note:
        'MLOps & LLMOps Cloud (–291). Discovery hub over dataset/training/eval/prompt/rag/agent/drift/learning/dashboard; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = mlopsLlmopsCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      assetTypes: mlopsAssetTypesCatalog().map((a) => ({ id: a.id, status: a.status })),
      architecture: mlopsLlmopsCloudArchitectureNotes(),
      honesty: mlopsLlmopsCloudHonesty(),
      note: 'MLOps & LLMOps Cloud monitoring snapshot.',
    };
  }
}
