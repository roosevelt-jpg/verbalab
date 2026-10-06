export type MepCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type MepCapability = {
  id: string;
  name: string;
  status: MepCapabilityStatus;
  api: string | null;
  notes: string;
};

export type MepSuiteId =
  | 'mmlu'
  | 'humaneval'
  | 'mt_bench'
  | 'translation'
  | 'speech'
  | 'vision'
  | 'reasoning'
  | 'bias'
  | 'safety'
  | 'latency';

export type MepSuite = {
  id: MepSuiteId;
  name: string;
  status: MepCapabilityStatus;
  runnable: boolean;
  existingApi: string | null;
  notes: string;
};

/**
 * Library Phase 103 → Model Evaluation Platform.
 * Hub over existing coverage/eval harness — not a global LLM leaderboard OS.
 */
export function modelEvaluationPlatformCatalog {
  return {
    product: 'Lugemi Model Evaluation Platform',
    note:
      'Model Evaluation Platform. Extends existing coverage/eval for translation goldens. Sandbox suites for bias/safety/latency. MMLU/HumanEval/MT-Bench and speech/vision/reasoning corpora stay deferred. Never claims market leadership or SOTA.',
    capabilities: [
      {
        id: 'evaluation-orchestration',
        name: 'Evaluation Orchestration',
        status: 'partial',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Eval run plans + handoff to for translation.',
      },
      {
        id: 'translation-benchmarks',
        name: 'Translation Benchmarks',
        status: 'partial',
        api: 'POST /v1/eval/run',
        notes: 'Golden exact-match + char similarity (ADR-0034).',
      },
      {
        id: 'bias',
        name: 'Bias Checks',
        status: 'partial',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox heuristic checklist — not a fairness research lab.',
      },
      {
        id: 'safety',
        name: 'Safety Checks',
        status: 'partial',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox policy probes — not red-team OS.',
      },
      {
        id: 'latency',
        name: 'Latency',
        status: 'partial',
        api: 'POST /v1/model-evaluation-platform/runs',
        notes: 'Sandbox latency budget scoring — not full APM.',
      },
      {
        id: 'leaderboards',
        name: 'Leaderboards',
        status: 'partial',
        api: 'GET /v1/model-evaluation-platform/leaderboard',
        notes: 'Org-scoped sandbox ranks from local runs — not public SOTA board.',
      },
      {
        id: 'reports',
        name: 'Reports',
        status: 'partial',
        api: 'GET /v1/model-evaluation-platform/reports',
        notes: 'Aggregated run summaries + coverage snapshot link.',
      },
      {
        id: 'mmlu',
        name: 'MMLU',
        status: 'deferred',
        api: null,
        notes: 'Full MMLU corpus/eval deferred.',
      },
      {
        id: 'humaneval',
        name: 'HumanEval',
        status: 'deferred',
        api: null,
        notes: 'Code-gen HumanEval deferred.',
      },
      {
        id: 'mt-bench',
        name: 'MT Bench',
        status: 'deferred',
        api: null,
        notes: 'Multi-turn chat bench deferred.',
      },
      {
        id: 'speech-benchmarks',
        name: 'Speech Benchmarks',
        status: 'deferred',
        api: null,
        notes: 'Speech eval corpora deferred — Speech Cloud has product analytics.',
      },
      {
        id: 'vision-benchmarks',
        name: 'Vision Benchmarks',
        status: 'deferred',
        api: null,
        notes: 'Vision eval deferred.',
      },
      {
        id: 'reasoning-benchmarks',
        name: 'Reasoning Benchmarks',
        status: 'deferred',
        api: null,
        notes: 'Reasoning bench deferred — Reasoning Runtime has plan/reflect only.',
      },
    ] satisfies MepCapability[],
    honesty: modelEvaluationPlatformHonesty,
    docs: '/docs/MODEL_EVALUATION_PLATFORM.md',
  };
}

export function modelEvaluationSuites: MepSuite[] {
  return [
    {
      id: 'translation',
      name: 'Translation Benchmarks',
      status: 'partial',
      runnable: true,
      existingApi: 'POST /v1/eval/run',
      notes: 'Handoff to golden harness (fixture/live/oracle).',
    },
    {
      id: 'bias',
      name: 'Bias',
      status: 'partial',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox checklist scores — not demographic parity OS.',
    },
    {
      id: 'safety',
      name: 'Safety',
      status: 'partial',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox refusal/policy probes.',
    },
    {
      id: 'latency',
      name: 'Latency',
      status: 'partial',
      runnable: true,
      existingApi: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox p95 budget vs target ms.',
    },
    {
      id: 'mmlu',
      name: 'MMLU',
      status: 'deferred',
      runnable: false,
      existingApi: null,
      notes: 'Deferred academic suite.',
    },
    {
      id: 'humaneval',
      name: 'HumanEval',
      status: 'deferred',
      runnable: false,
      existingApi: null,
      notes: 'Deferred code suite.',
    },
    {
      id: 'mt_bench',
      name: 'MT Bench',
      status: 'deferred',
      runnable: false,
      existingApi: null,
      notes: 'Deferred multi-turn chat suite.',
    },
    {
      id: 'speech',
      name: 'Speech Benchmarks',
      status: 'deferred',
      runnable: false,
      existingApi: null,
      notes: 'Deferred speech corpora.',
    },
    {
      id: 'vision',
      name: 'Vision Benchmarks',
      status: 'deferred',
      runnable: false,
      existingApi: null,
      notes: 'Deferred vision corpora.',
    },
    {
      id: 'reasoning',
      name: 'Reasoning Benchmarks',
      status: 'deferred',
      runnable: false,
      existingApi: null,
      notes: 'Deferred reasoning corpora.',
    },
  ];
}

export function modelEvaluationPlatformArchitectureNotes {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_model_evaluation_platform',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'eval_service_plus_sandbox_runs',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsVl100Coverage: true,
    extendsEvalService: true,
    extendsFoundationModelCloud: true,
    regeneratesVl100: false,
    trainsCompetitiveFoundationWeights: false,
    globalLeaderboardOs: false,
    mmluOs: false,
    sotaClaimsForbidden: true,
    customerFacingProduct: true,
    note:
      'Volume 9 Phase 103: evaluation hub over existing goldens + sandbox suites. Not LMSYS/HELM replacement.',
  };
}

export function modelEvaluationPlatformHonesty {
  return {
    trainsCompetitiveFoundationWeights: false,
    globalLeaderboardOs: false,
    mmluOs: false,
    humanevalOs: false,
    mtBenchOs: false,
    sotaClaimsForbidden: true,
    regeneratesVl100: false,
    regeneratesVolumes1to8: false,
    openAiReplacementOs: false,
    extendsVl100Coverage: true,
    sandboxSuitesOnlyForBiasSafetyLatency: true,
  };
}

export function modelEvaluationCeilings {
  return {
    maxRunsPerOrg: 100,
    maxLabelLength: 120,
    mode: 'sandbox',
    note:
      'Sandbox ceilings for eval run plans. Live translation eval still gated by EVAL_LIVE=1 + owner/admin.',
  };
}
