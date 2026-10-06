export type MemoryRuntimeCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type MemoryRuntimeCapability = {
  id: string;
  name: string;
  status: MemoryRuntimeCapabilityStatus;
  api: string | null;
  notes: string;
};

export const KERNEL_MEMORY_LAYER = 'kernel';

export const KERNEL_MEMORY_SCOPES = [
  'conversation',
  'workspace',
  'organization',
  'agent',
] as const;

export type KernelMemoryScope = (typeof KERNEL_MEMORY_SCOPES)[number];

export const KERNEL_MEMORY_KINDS = [
  'short_term',
  'long_term',
  'semantic',
  'shared',
] as const;

export type KernelMemoryKind = (typeof KERNEL_MEMORY_KINDS)[number];

export function memoryRuntimeMode(): 'disabled' | 'sandbox' {
  const raw = (process.env.LUGEMI_MEMORY_RUNTIME_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function memoryRuntimeCeilings() {
  const max = Math.max(
    1,
    Number(process.env.LUGEMI_KERNEL_MEMORY_MAX_ENTRIES ?? '200') || 200,
  );
  return {
    maxEntriesPerWorkspace: Math.min(max, 2000),
    defaultShortTermTtlSec: Math.min(
      86_400,
      Math.max(60, Number(process.env.LUGEMI_KERNEL_MEMORY_SHORT_TTL_SEC ?? '3600') || 3600),
    ),
    mode: memoryRuntimeMode(),
    note: 'Hard entry ceiling for kernel-layer MemoryRecord rows. Eviction enforces under ceiling.',
  };
}

/**
 * Memory Runtime.
 * Kernel primitives over existing Memory Cloud — not Mem0 / replication OS.
 */
export function memoryRuntimeCatalog() {
  return {
    product: 'Lugemi Memory Runtime',
    note:
      'Memory Runtime. Kernel-layer short/long-term/semantic/workspace/org/conversation/agent memory over existing MemoryRecord (metadata.layer=kernel). Versioning, eviction, heuristic compression, sandbox snapshots/sync. Not Mem0 OS, not infinite personalization, not multi-region replication. Does not regenerate Memory Cloud or Knowledge Memory.',
    capabilities: [
      {
        id: 'short-term-memory',
        name: 'Short-term Memory',
        status: 'shipped',
        api: 'POST /v1/memory-runtime/put',
        notes: 'kind=short_term with TTL.',
      },
      {
        id: 'long-term-memory',
        name: 'Long-term Memory',
        status: 'shipped',
        api: 'POST /v1/memory-runtime/put',
        notes: 'kind=long_term.',
      },
      {
        id: 'semantic-memory',
        name: 'Semantic Memory',
        status: 'partial',
        api: 'POST /v1/memory-runtime/search',
        notes: 'Text contains search — not embedding ANN OS.',
      },
      {
        id: 'workspace-memory',
        name: 'Workspace Memory',
        status: 'shipped',
        api: 'POST /v1/memory-runtime/put',
        notes: 'scope=workspace.',
      },
      {
        id: 'organization-memory',
        name: 'Organization Memory',
        status: 'shipped',
        api: 'POST /v1/memory-runtime/put',
        notes: 'scope=organization (workspace-resident).',
      },
      {
        id: 'conversation-memory',
        name: 'Conversation Memory',
        status: 'shipped',
        api: 'POST /v1/memory-runtime/put',
        notes: 'scope=conversation + conversationId.',
      },
      {
        id: 'agent-memory',
        name: 'Agent Memory',
        status: 'partial',
        api: 'POST /v1/memory-runtime/put',
        notes: 'scope=agent + agentId — Agent Runtime writes via /v1/agent-runtime/memory.',
      },
      {
        id: 'context-compression',
        name: 'Context Compression',
        status: 'partial',
        api: 'POST /v1/memory-runtime/compress',
        notes: 'Heuristic truncate/summarize stub — not ML compressor OS.',
      },
      {
        id: 'memory-versioning',
        name: 'Memory Versioning',
        status: 'shipped',
        api: 'POST /v1/memory-runtime/revise',
        notes: 'Bumps MemoryRecord.version via Memory Cloud revise.',
      },
      {
        id: 'memory-synchronization',
        name: 'Memory Synchronization',
        status: 'partial',
        api: 'POST /v1/memory-runtime/sync',
        notes: 'Sandbox sync stamp on kernel rows — not multi-region sync OS.',
      },
      {
        id: 'memory-eviction',
        name: 'Memory Eviction Policies',
        status: 'shipped',
        api: 'POST /v1/memory-runtime/evict',
        notes: 'Expire short_term + enforce maxEntries ceiling.',
      },
      {
        id: 'memory-encryption',
        name: 'Memory Encryption',
        status: 'partial',
        api: 'POST /v1/memory-runtime/put',
        notes: 'Optional encrypt=true stores base64 payload tag — not KMS/HSM OS.',
      },
      {
        id: 'memory-replication',
        name: 'Memory Replication',
        status: 'deferred',
        api: null,
        notes: 'Multi-region replication OS deferred.',
      },
      {
        id: 'memory-snapshots',
        name: 'Memory Snapshots',
        status: 'partial',
        api: 'POST /v1/memory-runtime/snapshots',
        notes: 'Sandbox snapshot MemoryRecords (layer=kernel) — not backup appliance OS.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/memory-runtime/engine',
        notes: 'REST runtime hub.',
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        status: 'shipped',
        api: 'memoryRuntimeEngine',
        notes: 'Bounded GraphQL façade.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'memoryRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'deferred',
        api: null,
        notes: 'Dedicated realtime memory bus deferred; monitoring is poll.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/memory-runtime/monitoring',
        notes: 'Counts + honesty.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/MEMORY_RUNTIME.md',
        notes: 'Product doc + ADR-0126.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/memory-runtime/put',
        notes: 'Ships with Nest API — not a separate memory cluster.',
      },
    ] satisfies MemoryRuntimeCapability[],
    honesty: {
      mem0Os: false,
      infinitePersonalizationOs: false,
      replicationOs: false,
      encryptionKmsOs: false,
      regeneratesMemoryCloud: false,
      regeneratesKnowledgeMemory: false,
      extendsMemoryCloud: true,
      orgWorkspaceScoped: true,
      kernelLayerOnly: true,
      vectorSemanticOs: false,
    },
    links: {
      console: '/memory-runtime',
      hub: '/ai-kernel',
      memoryCloud: '/memory-cloud',
      knowledgeMemory: '/knowledge-memory',
      docs: '/docs/MEMORY_RUNTIME.md',
      adr: '/docs/adr/0126-memory-runtime.md',
    },
  };
}
