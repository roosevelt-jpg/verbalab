export type EvalCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EvalCapability = {
  id: string;
  name: string;
  status: EvalCapabilityStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 142 → Evaluation Platform (VL-275).
 * Extends model-evaluation-platform / eval surfaces — does not regenerate them.
 */
export function evaluationPlatformEngineCatalog() {
  const capabilities: EvalCapability[] = [
    { id: 'automatic', name: 'Automatic evaluation', status: 'shipped', api: 'GET /v1/evaluation-platform/capabilities', notes: 'Metric runners catalog.' },
    { id: 'human', name: 'Human evaluation', status: 'shipped', api: 'GET /v1/evaluation-platform/capabilities', notes: 'Human review workflow posture.' },
    { id: 'llm-as-judge', name: 'LLM-as-a-Judge', status: 'shipped', api: 'GET /v1/evaluation-platform/capabilities', notes: 'Judge rubric slots — not autonomous judge OS.' },
    { id: 'ab-testing', name: 'A/B testing', status: 'shipped', api: 'GET /v1/evaluation-platform/capabilities', notes: 'A/B comparison catalog.' },
    { id: 'regression', name: 'Regression testing', status: 'shipped', api: 'GET /v1/evaluation-platform/capabilities', notes: 'Regression gates catalog.' },
    { id: 'canary', name: 'Canary evaluation', status: 'shipped', api: 'GET /v1/evaluation-platform/capabilities', notes: 'Canary evaluation slots.' },
    { id: 'quality-gates', name: 'Quality gates', status: 'shipped', api: 'GET /v1/evaluation-platform/capabilities', notes: 'Release quality gates.' },
    { id: 'model-cards', name: 'Model cards', status: 'shipped', api: 'GET /v1/evaluation-platform/capabilities', notes: 'Model card templates.' },
  ];
  return {
    product: 'VerbaLab Evaluation Platform',
    note:
      'Evaluation Platform (VL-275). Enterprise evaluation catalog extending VL-236 model-evaluation-platform and VL-100 eval — does not regenerate those surfaces.',
    capabilities,
    extends: {
      modelEvaluationPlatform: true,
      modelEvaluationPlatformApi: 'GET /v1/model-evaluation-platform/engine',
      evalSurface: true,
      regeneratesExistingEval: false,
    },
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to12: false,
    },
    honesty: {
      regeneratesVolumes1to12: false,
      regeneratesModelEvaluationPlatform: false,
      autonomousJudgeOs: false,
      coverageComplete: false,
    },
    docs: '/docs/EVALUATION_PLATFORM.md',
  };
}
