export type PromptCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type PromptCapability = {
  id: string;
  name: string;
  status: PromptCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 55 → Prompt Intelligence. Extend versioning — not an auto-prompt research lab. */
export function promptIntelligenceCatalog() {
  return {
    product: 'Lugemi Prompt Intelligence',
    note:
      'Hub over versioned chat/rag/voice_faq prompts. Registry, preview/test, heuristic evaluate + security scan, marketplace listings, and audit analytics. Not an auto-prompt research lab or red-team harness OS.',
    capabilities: [
      {
        id: 'prompt-registry',
        name: 'Prompt Registry',
        status: 'shipped',
        api: 'GET /v1/prompt-intelligence/registry',
        notes: 'Workspace keys chat/rag/voice_faq with active/fallback status.',
      },
      {
        id: 'prompt-versioning',
        name: 'Prompt Versioning',
        status: 'shipped',
        api: 'GET /v1/prompts/{key}/versions',
        notes: 'Create/activate/rollback via existing Prompts API (ADR-0030).',
      },
      {
        id: 'prompt-testing',
        name: 'Prompt Testing',
        status: 'partial',
        api: 'POST /v1/prompt-intelligence/preview',
        notes: 'Resolve/preview body without calling an LLM evaluator.',
      },
      {
        id: 'prompt-evaluation',
        name: 'Prompt Evaluation',
        status: 'partial',
        api: 'POST /v1/prompt-intelligence/evaluate',
        notes: 'Heuristic checks (length, emptiness, risky patterns) — not LLM-as-judge lab.',
      },
      {
        id: 'prompt-marketplace',
        name: 'Prompt Marketplace',
        status: 'partial',
        api: 'GET /v1/marketplace?kind=prompt',
        notes: 'Existing marketplace prompt listings. Hub surfaces link + counts.',
      },
      {
        id: 'prompt-security',
        name: 'Prompt Security',
        status: 'partial',
        api: 'POST /v1/prompt-intelligence/security-scan',
        notes: 'Pattern scan for injection/secret-looking strings. Not a red-team harness.',
      },
      {
        id: 'prompt-analytics',
        name: 'Prompt Analytics',
        status: 'shipped',
        api: 'GET /v1/prompt-intelligence/analytics',
        notes: 'Audit aggregates for prompt version/activate/fallback events.',
      },
      {
        id: 'prompt-optimization',
        name: 'Prompt Optimization',
        status: 'deferred',
        api: null,
        notes: 'Auto-prompt research / evolutionary optimizers deferred ( out of scope).',
      },
      {
        id: 'prompt-approval',
        name: 'Prompt Approval',
        status: 'partial',
        api: 'POST /v1/prompts/{key}/activate',
        notes: 'Admin activate = approval proxy. Separate approval workflow deferred.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/prompt-intelligence/monitoring',
        notes: 'Hub monitoring snapshot.',
      },
    ] satisfies PromptCapability[],
    honesty: {
      autoPromptResearchLab: false,
      trainsPromptOptimizers: false,
      llmAsJudgeEvalLab: false,
      redTeamHarnessOs: false,
      extendsVersionedPrompts: true,
    },
    links: {
      console: '/prompt-intelligence',
      promptsConsole: '/prompts',
      hub: '/intelligence-cloud',
      promptsApi: '/v1/prompts',
      marketplace: '/marketplace',
      preview: 'POST /v1/prompt-intelligence/preview',
      openapi: '/v1/openapi.json',
      docs: '/docs/PROMPT_INTELLIGENCE.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@lugemi/sdk',
      cli: '@lugemi/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      backend: 'versioned_prompts_hub',
    },
  };
}
