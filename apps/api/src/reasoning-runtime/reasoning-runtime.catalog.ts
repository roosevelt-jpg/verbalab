export type ReasoningRuntimeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type ReasoningRuntimeCapability = {
  id: string;
  name: string;
  status: ReasoningRuntimeCapabilityStatus;
  api: string | null;
  notes: string;
};

export function reasoningRuntimeMode(): 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_REASONING_RUNTIME_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function reasoningRuntimeCeilings() {
  return {
    maxHistoryPerWorkspace: Math.min(
      500,
      Math.max(10, Number(process.env.LUGEMI_REASONING_RUNTIME_MAX_HISTORY ?? '100') || 100),
    ),
    mode: reasoningRuntimeMode(),
    note: 'Hard ceiling for stored reasoning runs (kernel MemoryRecords).',
  };
}

/**
 * Reasoning Runtime.
 * Kernel execution over existing Reasoning Cloud — not a custom reasoner OS.
 */
export function reasoningRuntimeCatalog() {
  return {
    product: 'Lugemi Reasoning Runtime',
    note:
      'Reasoning Runtime. Kernel execution over existing Reasoning Cloud (graphs/ToT/planning/tool+model selection) plus reflection, self-eval, confidence, decision-tree façade, history/replay via kernel MemoryRecords. Not a custom reasoner kernel, not symbolic reasoner OS, not tool-execution agent OS. Does not regenerate Reasoning Cloud.',
    capabilities: [
      {
        id: 'reasoning-graphs',
        name: 'Reasoning Graphs',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/reason',
        notes: 'strategy=graph_reasoning via Reasoning Cloud — no graph algorithm engine.',
      },
      {
        id: 'tree-of-thought',
        name: 'Tree of Thought',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/reason',
        notes: 'Shallow 2-branch ToT via Reasoning Cloud — not research ToT OS.',
      },
      {
        id: 'planning',
        name: 'Planning',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/plan',
        notes: 'strategy=planning façade (+ sandbox plan stub).',
      },
      {
        id: 'reflection',
        name: 'Reflection',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/reflect',
        notes: 'Heuristic critique of a prior answer — not deep reflective agent OS.',
      },
      {
        id: 'tool-selection',
        name: 'Tool Selection',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/select-tools',
        notes: 'Catalog suggestion only — does not execute tools.',
      },
      {
        id: 'model-selection',
        name: 'Model Selection',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/select-model',
        notes: 'AI Router resolve (feature=chat) — not a model mesh OS.',
      },
      {
        id: 'decision-trees',
        name: 'Decision Trees',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/decision-tree',
        notes: 'Sandbox tree over Decision Engine kinds — not Drools/Pega BRMS.',
      },
      {
        id: 'self-evaluation',
        name: 'Self Evaluation',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/evaluate',
        notes: 'Heuristic score — not LLM-as-judge lab.',
      },
      {
        id: 'confidence',
        name: 'Confidence',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/confidence',
        notes: 'Derived confidence from eval heuristics + Decision Engine confidence kind.',
      },
      {
        id: 'reasoning-history',
        name: 'Reasoning History',
        status: 'shipped',
        api: 'GET /v1/reasoning-runtime/history',
        notes: 'Kernel MemoryRecords (metadata.runtime=reasoning-runtime).',
      },
      {
        id: 'reasoning-replay',
        name: 'Reasoning Replay',
        status: 'shipped',
        api: 'GET /v1/reasoning-runtime/history/:id',
        notes: 'Replay stored run payload — not a distributed replay OS.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/reasoning-runtime/engine',
        notes: 'REST runtime hub.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'reasoningRuntimeEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'reasoningRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/reasoning-runtime/monitoring',
        notes: 'Counts + honesty.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/REASONING_RUNTIME.md',
        notes: 'Product documentation.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'shipped',
        api: 'POST /v1/reasoning-runtime/reason',
        notes: 'Ships with Nest API — not a separate reasoner cluster.',
      },
    ] satisfies ReasoningRuntimeCapability[],
    honesty: {
      customReasonerKernel: false,
      symbolicReasonerOs: false,
      fullTreeOfThought: false,
      toolExecution: false,
      agentOs: false,
      llmAsJudgeEvalLab: false,
      droolsPegaBrms: false,
      regeneratesReasoningCloud: false,
      extendsReasoningCloud: true,
      orgWorkspaceScoped: true,
      storesHistoryInMemoryCloud: true,
    },
    links: {
      console: '/reasoning-runtime',
      hub: '/ai-kernel',
      reasoningCloud: '/reasoning-cloud',
      contextRuntime: '/context-runtime',
      aiRouter: '/ai-router',
      decisionEngine: '/decision-engine',
      docs: '/docs/REASONING_RUNTIME.md',
      adr: '/docs/adr/0129-reasoning-runtime.md',
    },
  };
}
