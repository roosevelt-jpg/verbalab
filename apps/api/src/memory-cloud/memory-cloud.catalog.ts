export type MemoryCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type MemoryCapability = {
  id: string;
  name: string;
  status: MemoryCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Memory Cloud. Persistent memory with GDPR delete/export — not infinite personalization OS. */
export function memoryCloudCatalog() {
  return {
    product: 'Lugemi Memory Cloud',
    note:
      'Persistent AI interaction memory in Postgres with subject export/erase. Conversation/workspace/org/project/agent scopes. Not an infinite personalization OS; semantic vector memory deferred to Vector Cloud patterns.',
    capabilities: [
      {
        id: 'conversation-memory',
        name: 'Conversation Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories',
        notes: 'scope=conversation + conversationId.',
      },
      {
        id: 'workspace-memory',
        name: 'Workspace Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories',
        notes: 'scope=workspace.',
      },
      {
        id: 'organization-memory',
        name: 'Organization Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories',
        notes: 'scope=organization; still workspace-row for residency.',
      },
      {
        id: 'project-memory',
        name: 'Project Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories',
        notes: 'scope=project + projectKey.',
      },
      {
        id: 'agent-memory',
        name: 'Agent Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories',
        notes: 'scope=agent + agentId. Full agent OS deferred.',
      },
      {
        id: 'long-term-memory',
        name: 'Long Term Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories',
        notes: 'kind=long_term; optional expiresAt.',
      },
      {
        id: 'short-term-memory',
        name: 'Short Term Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories',
        notes: 'kind=short_term; prefer TTL via expiresAt.',
      },
      {
        id: 'shared-memory',
        name: 'Shared Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories',
        notes: 'kind=shared within workspace.',
      },
      {
        id: 'semantic-memory',
        name: 'Semantic Memory',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/search',
        notes: 'Text search today. Embedding/NN semantic deferred.',
      },
      {
        id: 'memory-versioning',
        name: 'Memory Versioning',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/memories/:id/revise',
        notes: 'Content revise bumps version integer.',
      },
      {
        id: 'memory-search',
        name: 'Memory Search',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/search',
        notes: 'Case-insensitive content contains + scope/kind filters.',
      },
      {
        id: 'gdpr-export',
        name: 'GDPR Export',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/export',
        notes: 'Subject/workspace memory export JSON. Also in org export.',
      },
      {
        id: 'gdpr-erase',
        name: 'GDPR Erase / Right to be Forgotten',
        status: 'shipped',
        api: 'POST /v1/memory-cloud/erase',
        notes: 'Hard-delete subject or workspace memories after confirm.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/memory-cloud/analytics',
        notes: 'Active counts + write/export/erase audits.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/memory-cloud/monitoring',
        notes: 'Snapshot + deferred flags.',
      },
    ] satisfies MemoryCapability[],
    honesty: {
      infinitePersonalizationOs: false,
      vectorSemanticMemory: false,
      agentOs: false,
      automatedRetentionSweeper: false,
      gdprExport: true,
      gdprErase: true,
    },
    links: {
      console: '/memory-cloud',
      hub: '/intelligence-cloud',
      dataGovernance: '/data',
      vectorCloud: '/vector-cloud',
      export: 'POST /v1/memory-cloud/export',
      erase: 'POST /v1/memory-cloud/erase',
      orgExport: 'POST /v1/organization/export',
      openapi: '/v1/openapi.json',
      docs: '/docs/MEMORY_CLOUD.md',
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
      backend: 'postgres',
      retentionSweeper: false,
    },
  };
}

export const MEMORY_SCOPES = [
  'conversation',
  'workspace',
  'organization',
  'project',
  'agent',
] as const;

export const MEMORY_KINDS = ['short_term', 'long_term', 'shared', 'semantic'] as const;

export type MemoryScope = (typeof MEMORY_SCOPES)[number];
export type MemoryKind = (typeof MEMORY_KINDS)[number];
