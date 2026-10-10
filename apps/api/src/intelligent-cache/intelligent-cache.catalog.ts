export type CacheCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type CacheCapability = {
  id: string;
  name: string;
  status: CacheCapabilityStatus;
  api: string | null;
  notes: string;
};

export type CacheNamespace =
  | 'semantic'
  | 'translation'
  | 'embedding'
  | 'speech'
  | 'voice'
  | 'document'
  | 'prompt'
  | 'context';

export type CacheNamespaceRow = {
  id: CacheNamespace;
  name: string;
  status: CacheCapabilityStatus;
  notes: string;
};

export function cacheNamespaces(): CacheNamespaceRow[] {
  return [
    {
      id: 'semantic',
      name: 'Semantic Cache',
      status: 'shipped',
      notes: 'Normalized-text hash lookup — not embedding-similarity vector cache OS.',
    },
    {
      id: 'translation',
      name: 'Translation Cache',
      status: 'shipped',
      notes: 'Exact key cache for MT pairs/results.',
    },
    {
      id: 'embedding',
      name: 'Embedding Cache',
      status: 'shipped',
      notes: 'Exact key cache for embedding payloads.',
    },
    {
      id: 'speech',
      name: 'Speech Cache',
      status: 'shipped',
      notes: 'Exact key cache for STT result stubs.',
    },
    {
      id: 'voice',
      name: 'Voice Cache',
      status: 'shipped',
      notes: 'Exact key cache for TTS result stubs.',
    },
    {
      id: 'document',
      name: 'Document Cache',
      status: 'shipped',
      notes: 'Exact key cache for document-derived inference stubs.',
    },
    {
      id: 'prompt',
      name: 'Prompt Cache',
      status: 'shipped',
      notes: 'Exact key cache for prompt/completion stubs.',
    },
    {
      id: 'context',
      name: 'Context Cache',
      status: 'shipped',
      notes: 'Exact key cache for assembled context stubs.',
    },
  ];
}

/**
 * Intelligent Cache.
 * Org/workspace sandbox entry store — not Redis Cluster / vector / CDN OS.
 */
export function intelligentCacheCatalog() {
  return {
    product: 'Lugemi Intelligent Cache',
    note:
      'Intelligent Cache. Org/workspace-scoped inference result cache with namespaces for semantic/translation/embedding/speech/voice/document/prompt/context. Lookup is exact-key (or normalized-text hash for semantic). Not a Redis Cluster, vector similarity OS, or CDN. Does not auto-wire Gateway responses — opt-in put/lookup APIs.',
    capabilities: [
      {
        id: 'semantic-cache',
        name: 'Semantic Cache',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/lookup',
        notes: 'Normalized hash match — not ANN vector search.',
      },
      {
        id: 'translation-cache',
        name: 'Translation Cache',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/put',
        notes: 'Exact key entries.',
      },
      {
        id: 'embedding-cache',
        name: 'Embedding Cache',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/put',
        notes: 'Exact key entries.',
      },
      {
        id: 'speech-cache',
        name: 'Speech Cache',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/put',
        notes: 'Exact key entries.',
      },
      {
        id: 'voice-cache',
        name: 'Voice Cache',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/put',
        notes: 'Exact key entries.',
      },
      {
        id: 'document-cache',
        name: 'Document Cache',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/put',
        notes: 'Exact key entries.',
      },
      {
        id: 'prompt-cache',
        name: 'Prompt Cache',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/put',
        notes: 'Exact key entries.',
      },
      {
        id: 'context-cache',
        name: 'Context Cache',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/put',
        notes: 'Exact key entries.',
      },
      {
        id: 'invalidate',
        name: 'Invalidation',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/invalidate',
        notes: 'By key, namespace, or entry id.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/intelligent-cache/analytics',
        notes: 'Hit/miss + entry counts — ≠.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/intelligent-cache/monitoring',
        notes: 'Ceilings + honesty snapshot.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/intelligent-cache/engine',
        notes: 'REST cache hub.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'intelligentCacheEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/INTELLIGENT_CACHE.md',
        notes: 'Product documentation.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'shipped',
        api: 'POST /v1/intelligent-cache/put',
        notes: 'Ships with Nest + Postgres entries — not a Redis Cluster fleet.',
      },
    ] satisfies CacheCapability[],
    honesty: {
      redisClusterOs: false,
      vectorSemanticOs: false,
      cdnOs: false,
      autoWiresGatewayResponses: false,
      regeneratesAiGateway: false,
      orgWorkspaceScoped: true,
      sandboxEntries: true,
      exactKeyLookup: true,
      normalizedHashSemantic: true,
    },
    links: {
      console: '/intelligent-cache',
      hub: '/inference-cloud',
      gateway: '/gateway',
      docs: '/docs/INTELLIGENT_CACHE.md',
      openapi: '/v1/openapi.json',
    },
  };
}

export function intelligentCacheMode(): 'sandbox' | 'disabled' {
  const raw = (process.env.LUGEMI_INTELLIGENT_CACHE_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function cacheCeilings() {
  const maxEntries = Math.max(
    1,
    Number(process.env.LUGEMI_CACHE_MAX_ENTRIES ?? '200') || 200,
  );
  const defaultTtlSec = Math.max(
    60,
    Number(process.env.LUGEMI_CACHE_DEFAULT_TTL_SEC ?? '3600') || 3600,
  );
  return {
    maxEntriesPerWorkspace: Math.min(maxEntries, 2000),
    defaultTtlSec: Math.min(defaultTtlSec, 7 * 24 * 3600),
    mode: intelligentCacheMode(),
    note: 'Hard ceiling on active (non-expired) entries per org/workspace. TTL required.',
  };
}

export const CACHE_NAMESPACES: CacheNamespace[] = [
  'semantic',
  'translation',
  'embedding',
  'speech',
  'voice',
  'document',
  'prompt',
  'context',
];
