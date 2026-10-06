export type KnowledgeMemoryCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeMemoryCapability = {
  id: string;
  name: string;
  status: KnowledgeMemoryCapabilityStatus;
  api: string | null;
  notes: string;
};

export const KNOWLEDGE_MEMORY_SCOPES = [
  'organization',
  'workspace',
  'user',
  'conversation',
  'ai',
] as const;

export type KmScope = (typeof KNOWLEDGE_MEMORY_SCOPES)[number];

export const KNOWLEDGE_MEMORY_LAYER = 'knowledge';

/**
 * Library Phase 66 → Knowledge Memory (VL-199).
 * Knowledge-layer memory over VL-183 Memory Cloud storage — not a second Mem0/Zep OS.
 */
export function knowledgeMemoryCatalog() {
  return {
    product: 'Lugemi Knowledge Memory',
    note:
      'Persistent knowledge-layer memory for Knowledge Cloud (VL-199). Org/workspace/user/conversation/AI scopes with document links, evolution, and versioning. Backed by VL-183 MemoryRecord rows (metadata.layer=knowledge). Distinct from Intelligence Memory Cloud product surface; not Mem0/Zep/infinite personalization OS.',
    capabilities: [
      {
        id: 'persistent-memory',
        name: 'Persistent Memory',
        status: 'shipped',
        api: 'POST /v1/knowledge-memory/memories',
        notes: 'Long-lived knowledge facts (kind=long_term by default).',
      },
      {
        id: 'organization-memory',
        name: 'Organization Memory',
        status: 'shipped',
        api: 'POST /v1/knowledge-memory/memories',
        notes: 'scope=organization — still workspace-resident for tenancy.',
      },
      {
        id: 'workspace-memory',
        name: 'Workspace Memory',
        status: 'shipped',
        api: 'POST /v1/knowledge-memory/memories',
        notes: 'scope=workspace.',
      },
      {
        id: 'user-memory',
        name: 'User Memory',
        status: 'shipped',
        api: 'POST /v1/knowledge-memory/memories',
        notes: 'scope=user → workspace row + subjectUserId (required).',
      },
      {
        id: 'conversation-memory',
        name: 'Conversation Memory',
        status: 'shipped',
        api: 'POST /v1/knowledge-memory/memories',
        notes: 'scope=conversation + conversationId.',
      },
      {
        id: 'ai-memory',
        name: 'AI Memory',
        status: 'partial',
        api: 'POST /v1/knowledge-memory/memories',
        notes: 'scope=ai → workspace/agent row for assistant facts. Full agent memory OS deferred.',
      },
      {
        id: 'knowledge-evolution',
        name: 'Knowledge Evolution',
        status: 'shipped',
        api: 'POST /v1/knowledge-memory/memories/:id/evolve',
        notes: 'Revise content and append evolution history in metadata.',
      },
      {
        id: 'knowledge-versioning',
        name: 'Knowledge Versioning',
        status: 'shipped',
        api: 'GET /v1/knowledge-memory/memories/:id/versions',
        notes: 'Current version integer + evolution trail (not a full VCS).',
      },
      {
        id: 'document-link',
        name: 'Document link',
        status: 'shipped',
        api: 'POST /v1/knowledge-memory/memories',
        notes: 'Optional documentId → KnowledgeDocument (org+workspace scoped).',
      },
      {
        id: 'memory-engine',
        name: 'Memory Engine',
        status: 'shipped',
        api: 'GET /v1/knowledge-memory/engine',
        notes: 'Product catalog + honesty flags.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/knowledge-memory/monitoring',
        notes: 'Honesty + deferred flags + counts.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/knowledge-memory/analytics',
        notes: 'Knowledge-layer memory counts for workspace.',
      },
      {
        id: 'mem0-os',
        name: 'Mem0 / Zep memory OS',
        status: 'deferred',
        api: null,
        notes: 'Framework/OS parity deferred — bounded Nest hub only.',
      },
      {
        id: 'vector-semantic-memory',
        name: 'Vector semantic memory',
        status: 'deferred',
        api: null,
        notes: 'NN over memory embeddings deferred — use Vector Cloud + text search today.',
      },
    ] satisfies KnowledgeMemoryCapability[],
    honesty: {
      mem0Os: false,
      zepParity: false,
      infinitePersonalizationOs: false,
      regeneratesMemoryCloud: false,
      extendsVl183: true,
      distinctFromMemoryCloud: true,
      orgWorkspaceScoped: true,
      gdprViaMemoryCloud: true,
    },
    scopes: KNOWLEDGE_MEMORY_SCOPES,
    links: {
      hub: '/knowledge-cloud',
      console: '/knowledge-memory',
      memoryCloud: '/memory-cloud',
      knowledgeBase: '/knowledge-base',
      enterpriseRag: '/enterprise-rag',
      knowledge: '/knowledge',
      create: 'POST /v1/knowledge-memory/memories',
      evolve: 'POST /v1/knowledge-memory/memories/:id/evolve',
      memoryCloudApi: '/v1/memory-cloud',
    },
  };
}
