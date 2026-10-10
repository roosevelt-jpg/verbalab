export type PromptRuntimeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type PromptRuntimeCapability = {
  id: string;
  name: string;
  status: PromptRuntimeCapabilityStatus;
  api: string | null;
  notes: string;
};

export function promptRuntimeMode(): 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_PROMPT_RUNTIME_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function promptRuntimeCeilings() {
  return {
    maxRenderedChars: Math.min(
      64_000,
      Math.max(256, Number(process.env.LUGEMI_PROMPT_RUNTIME_MAX_CHARS ?? '32000') || 32_000),
    ),
    cacheTtlSec: Math.min(
      86_400,
      Math.max(30, Number(process.env.LUGEMI_PROMPT_RUNTIME_CACHE_TTL_SEC ?? '600') || 600),
    ),
    mode: promptRuntimeMode(),
    note: 'Hard render size ceiling. Cache TTL for opt-in Intelligent Cache namespace=prompt.',
  };
}

/** Feature → managed prompt key routing (sandbox table, not a mesh). */
export const PROMPT_RUNTIME_ROUTES: Array<{
  feature: string;
  key: 'chat' | 'rag' | 'voice_faq';
  notes: string;
}> = [
  { feature: 'chat', key: 'chat', notes: 'General chat system prompt' },
  { feature: 'rag', key: 'rag', notes: 'Grounded RAG system prompt' },
  { feature: 'voice_faq', key: 'voice_faq', notes: 'Voice FAQ system prompt' },
  { feature: 'translate', key: 'chat', notes: 'Sandbox map — not a dedicated MT prompt OS' },
  { feature: 'embeddings', key: 'rag', notes: 'Sandbox map for retrieval-shaped work' },
];

/**
 * Prompt Runtime.
 * Kernel execution over existing — not an auto-prompt research lab.
 */
export function promptRuntimeCatalog() {
  return {
    product: 'Lugemi Prompt Runtime',
    note:
      'Prompt Runtime. Kernel execution over existing versioned prompts + Prompt Intelligence (resolve, variables, validate, security, cache via Intelligent Cache namespace=prompt). Not an auto-prompt research lab, LLM-as-judge, or prompt mesh OS. Does not regenerate Prompt Intelligence.',
    capabilities: [
      {
        id: 'prompt-execution',
        name: 'Prompt Execution',
        status: 'shipped',
        api: 'POST /v1/prompt-runtime/execute',
        notes: 'Resolve + render variables; does not call an LLM.',
      },
      {
        id: 'prompt-templates',
        name: 'Prompt Templates',
        status: 'shipped',
        api: 'GET /v1/prompt-runtime/templates',
        notes: 'Managed chat/rag/voice_faq templates over existing keys.',
      },
      {
        id: 'prompt-variables',
        name: 'Prompt Variables',
        status: 'shipped',
        api: 'POST /v1/prompt-runtime/render',
        notes: '{{name}} substitution on resolved/draft bodies.',
      },
      {
        id: 'prompt-routing',
        name: 'Prompt Routing',
        status: 'shipped',
        api: 'POST /v1/prompt-runtime/route',
        notes: 'Sandbox feature→key table — not a prompt mesh OS.',
      },
      {
        id: 'prompt-versioning',
        name: 'Prompt Versioning',
        status: 'shipped',
        api: 'GET /v1/prompt-runtime/versions',
        notes: 'Façade over existing PromptVersion rows.',
      },
      {
        id: 'prompt-optimization',
        name: 'Prompt Optimization',
        status: 'shipped',
        api: 'POST /v1/prompt-runtime/optimize',
        notes: 'Heuristic trim/tips — not evolutionary optimizer / research lab.',
      },
      {
        id: 'prompt-security',
        name: 'Prompt Security',
        status: 'shipped',
        api: 'POST /v1/prompt-runtime/security-scan',
        notes: 'Pattern scan via Prompt Intelligence — not red-team harness OS.',
      },
      {
        id: 'prompt-validation',
        name: 'Prompt Validation',
        status: 'shipped',
        api: 'POST /v1/prompt-runtime/validate',
        notes: 'Heuristic length/empty/placeholder checks.',
      },
      {
        id: 'prompt-cache',
        name: 'Prompt Cache',
        status: 'shipped',
        api: 'POST /v1/prompt-runtime/execute',
        notes: 'Opt-in Intelligent Cache namespace=prompt — not Redis OS; Gateway not auto-wired.',
      },
      {
        id: 'prompt-analytics',
        name: 'Prompt Analytics',
        status: 'shipped',
        api: 'GET /v1/prompt-runtime/analytics',
        notes: 'Audit counts for kernel execute/render/validate.',
      },
      {
        id: 'prompt-registry-integration',
        name: 'Prompt Registry Integration',
        status: 'shipped',
        api: 'GET /v1/prompt-runtime/registry',
        notes: 'Reads registry; CRUD stays on /v1/prompts.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/prompt-runtime/engine',
        notes: 'REST runtime hub.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'promptRuntimeEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'promptRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/prompt-runtime/monitoring',
        notes: 'Counts + honesty.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/PROMPT_RUNTIME.md',
        notes: 'Product documentation.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'shipped',
        api: 'POST /v1/prompt-runtime/execute',
        notes: 'Ships with Nest API — not a separate prompt cluster.',
      },
    ] satisfies PromptRuntimeCapability[],
    honesty: {
      autoPromptResearchLab: false,
      llmAsJudgeEvalLab: false,
      promptMeshOs: false,
      redisPromptCacheOs: false,
      callsLlmOnExecute: false,
      regeneratesPromptIntelligence: false,
      regeneratesVl086: false,
      extendsPromptIntelligence: true,
      extendsVersionedPrompts: true,
      orgWorkspaceScoped: true,
      usesIntelligentCachePromptNamespace: true,
    },
    links: {
      console: '/prompt-runtime',
      hub: '/ai-kernel',
      promptIntelligence: '/prompt-intelligence',
      prompts: '/prompts',
      intelligentCache: '/intelligent-cache',
      docs: '/docs/PROMPT_RUNTIME.md',
      adr: '/docs/adr/0127-prompt-runtime.md',
    },
  };
}
