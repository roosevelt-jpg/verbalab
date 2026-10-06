import { Injectable } from '@nestjs/common';
import { aiOperationsDashboardEngineCatalog } from './ai-operations-dashboard.catalog';
import { mlopsLlmopsCloudProductCatalog } from '../mlops-llmops-cloud/mlops-llmops-cloud.catalog';
import { datasetPipelineEngineCatalog } from '../dataset-pipeline/dataset-pipeline.catalog';
import { trainingPipelineEngineCatalog } from '../training-pipeline/training-pipeline.catalog';
import { continuousEvaluationEngineCatalog } from '../continuous-evaluation/continuous-evaluation.catalog';
import { promptopsPlatformEngineCatalog } from '../promptops-platform/promptops-platform.catalog';
import { ragopsPlatformEngineCatalog } from '../ragops-platform/ragops-platform.catalog';
import { agentopsPlatformEngineCatalog } from '../agentops-platform/agentops-platform.catalog';
import { aiDriftDetectionEngineCatalog } from '../ai-drift-detection/ai-drift-detection.catalog';
import { continuousLearningEngineCatalog } from '../continuous-learning/continuous-learning.catalog';

@Injectable
export class AiOperationsDashboardService {
  engine {
    const base = aiOperationsDashboardEngineCatalog;
    const products = mlopsLlmopsCloudProductCatalog;
    const datasets = datasetPipelineEngineCatalog;
    const training = trainingPipelineEngineCatalog;
    const conteval = continuousEvaluationEngineCatalog;
    const prompts = promptopsPlatformEngineCatalog;
    const rag = ragopsPlatformEngineCatalog;
    const agents = agentopsPlatformEngineCatalog;
    const drift = aiDriftDetectionEngineCatalog;
    const learning = continuousLearningEngineCatalog;
    return {
      ...base,
      snapshot: {
        products: {
          shipped: products.filter((p) => p.status === 'shipped').length,
          total: products.length,
        },
        datasets: { runs: datasets.pipelineRuns.length },
        training: {
          jobs: training.jobs.length,
          running: training.jobs.filter((j) => j.status === 'running').length,
          distributedTrainingOs: false,
        },
        prompts: { registry: prompts.prompts.length, langSmithOs: false },
        knowledge: { ragPipelines: rag.pipelines.length, vectorDbOs: false },
        inference: { extendsInferenceCloud: true },
        gpu: {
          queued: training.jobs.filter((j) => j.status === 'queued').length,
          note: 'GPU queue catalog proxy — not cluster OS.',
        },
        costs: {
          continuousEvalCostGate: conteval.gates.find((g) => g.kind === 'cost')?.status ?? 'unknown',
          financeGradeBilling: false,
        },
        drift: { driftClear: drift.driftClear, signalCount: drift.signals.length },
        safety: {
          continuousEvalPass: conteval.continuousEvalPass,
          policyViolations: agents.policyViolations,
          blockedActions: agents.blockedActions,
          policyViolationsVisible: true,
          humanApprovalRequiredBeforePromote: true,
          poisonedInputGuard: true,
        },
        continuousLearning: {
          candidates: learning.candidates.length,
          autoPromote: false,
        },
      },
      computedFromSiblings: true,
    };
  }

  snapshot(_query?: string) {
    const engine = this.engine;
    return {
      snapshot: engine.snapshot,
      honesty: engine.honesty,
      safety: engine.safety,
      note: engine.note,
      docs: engine.docs,
      computedFromSiblings: true,
    };
  }

  query(query?: string) {
    return this.snapshot(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'dashboard',
      shippedProducts: mlopsLlmopsCloudProductCatalog.filter((p) => p.status === 'shipped').length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AI Operations Dashboard monitoring snapshot.',
    };
  }
}
