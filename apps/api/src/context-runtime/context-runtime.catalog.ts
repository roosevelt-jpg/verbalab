export type ContextRuntimeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type ContextRuntimeCapability = {
  id: string;
  name: string;
  status: ContextRuntimeCapabilityStatus;
  api: string | null;
  notes: string;
};

export function contextRuntimeMode(): 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_CONTEXT_RUNTIME_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function contextRuntimeCeilings() {
  return {
    maxChars: Math.min(
      64_000,
      Math.max(500, Number(process.env.LUGEMI_CONTEXT_RUNTIME_MAX_CHARS ?? '8000') || 8000),
    ),
    cacheTtlSec: Math.min(
      86_400,
      Math.max(30, Number(process.env.LUGEMI_CONTEXT_RUNTIME_CACHE_TTL_SEC ?? '300') || 300),
    ),
    mode: contextRuntimeMode(),
    note: 'Hard assemble char ceiling. Opt-in Intelligent Cache namespace=context.',
  };
}

/** Default priority order (lower = earlier / kept first under budget). */
export const CONTEXT_RUNTIME_PRIORITIES: Array<{ kind: string; priority: number }> = [
  { kind: 'language', priority: 10 },
  { kind: 'prompt', priority: 15 },
  { kind: 'model', priority: 18 },
  { kind: 'workspace', priority: 20 },
  { kind: 'organization', priority: 25 },
  { kind: 'user', priority: 30 },
  { kind: 'project', priority: 35 },
  { kind: 'conversation', priority: 40 },
  { kind: 'historical', priority: 45 },
  { kind: 'documents', priority: 50 },
  { kind: 'knowledge', priority: 52 },
  { kind: 'knowledgeGraph', priority: 55 },
];

/**
 * Library Phase 84 → Context Runtime (VL-217).
 * Kernel assembly over VL-185 Context Engine — not infinite-context OS.
 */
export function contextRuntimeCatalog() {
  return {
    product: 'Lugemi Context Runtime',
    note:
      'Context Runtime (VL-217). Kernel assembly over VL-185 Context Engine (conversation/workspace/org/project/language/user/knowledge/model blocks, prioritization, char-budget compression, retrieval). Optional Intelligent Cache namespace=context. Not an infinite context window, not LLM summarization OS, not realtime push. Does not regenerate Context Engine.',
    capabilities: [
      {
        id: 'conversation-context',
        name: 'Conversation Context',
        status: 'shipped',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Via Context Engine conversation memories.',
      },
      {
        id: 'workspace-context',
        name: 'Workspace Context',
        status: 'shipped',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Workspace + workspace memories.',
      },
      {
        id: 'knowledge-context',
        name: 'Knowledge Context',
        status: 'shipped',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Documents + knowledge-graph blocks (alias knowledge).',
      },
      {
        id: 'language-context',
        name: 'Language Context',
        status: 'shipped',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Workspace language defaults.',
      },
      {
        id: 'organization-context',
        name: 'Organization Context',
        status: 'shipped',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Org name/plan + org memories.',
      },
      {
        id: 'project-context',
        name: 'Project Context',
        status: 'shipped',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'projectKey-scoped memories.',
      },
      {
        id: 'model-context',
        name: 'Model Context',
        status: 'partial',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Sandbox model/provider hint block — not a model-router OS.',
      },
      {
        id: 'user-context',
        name: 'User Context',
        status: 'shipped',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Subject user memories.',
      },
      {
        id: 'context-prioritization',
        name: 'Context Prioritization',
        status: 'shipped',
        api: 'POST /v1/context-runtime/prioritize',
        notes: 'Reorder/keep blocks by priority table.',
      },
      {
        id: 'context-compression',
        name: 'Context Compression',
        status: 'partial',
        api: 'POST /v1/context-runtime/compress',
        notes: 'Char-budget truncation — not LLM summarization OS.',
      },
      {
        id: 'context-retrieval',
        name: 'Context Retrieval',
        status: 'shipped',
        api: 'POST /v1/context-runtime/retrieve',
        notes: 'Assemble façade returning blocks + promptContext.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'deferred',
        api: null,
        notes: 'Streaming context push deferred.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/context-runtime/engine',
        notes: 'REST runtime hub.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'contextRuntimeEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'contextRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/context-runtime/monitoring',
        notes: 'Counts + honesty.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/CONTEXT_RUNTIME.md',
        notes: 'Product doc + ADR-0128.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/context-runtime/assemble',
        notes: 'Ships with Nest API — not a separate context cluster.',
      },
    ] satisfies ContextRuntimeCapability[],
    honesty: {
      infiniteContextWindow: false,
      llmSummarization: false,
      realtimePush: false,
      regeneratesContextEngine: false,
      extendsContextEngine: true,
      orgWorkspaceScoped: true,
      redisContextCacheOs: false,
      usesIntelligentCacheContextNamespace: true,
      modelRouterOs: false,
    },
    links: {
      console: '/context-runtime',
      hub: '/ai-kernel',
      contextEngine: '/context-engine',
      memoryRuntime: '/memory-runtime',
      promptRuntime: '/prompt-runtime',
      intelligentCache: '/intelligent-cache',
      docs: '/docs/CONTEXT_RUNTIME.md',
      adr: '/docs/adr/0128-context-runtime.md',
    },
  };
}
