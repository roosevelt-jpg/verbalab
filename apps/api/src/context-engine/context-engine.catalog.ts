export type ContextCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type ContextCapability = {
  id: string;
  name: string;
  status: ContextCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 52 → Context Engine. Assemble retrieval + memory + prompt — not infinite context. */
export function contextEngineCatalog() {
  return {
    product: 'Lugemi Context Engine',
    note:
      'Assembles workspace/language/user/org/project/conversation/document/historical/KG context for AI requests. Compression is char-budget truncation, not LLM summarization. Not an infinite context window product. Realtime push deferred.',
    capabilities: [
      {
        id: 'conversation-context',
        name: 'Conversation Context',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Memory scope=conversation via conversationId.',
      },
      {
        id: 'document-context',
        name: 'Document Context',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Vector Cloud / Knowledge NN when query provided.',
      },
      {
        id: 'organization-context',
        name: 'Organization Context',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Org name/plan + org-scoped memories.',
      },
      {
        id: 'project-context',
        name: 'Project Context',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Memory scope=project via projectKey.',
      },
      {
        id: 'language-context',
        name: 'Language Context',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Workspace defaultSourceLang / defaultTargetLang.',
      },
      {
        id: 'user-context',
        name: 'User Context',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Subject user memories + session user id.',
      },
      {
        id: 'workspace-context',
        name: 'Workspace Context',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Workspace name + workspace memories.',
      },
      {
        id: 'historical-context',
        name: 'Historical Context',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Recent long_term / shared memories.',
      },
      {
        id: 'context-compression',
        name: 'Context Compression',
        status: 'partial',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Char-budget truncation by priority. LLM summarization deferred.',
      },
      {
        id: 'context-retrieval',
        name: 'Context Retrieval',
        status: 'shipped',
        api: 'POST /v1/context-engine/assemble',
        notes: 'Multi-source assemble into promptContext string.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'deferred',
        api: null,
        notes: 'Streaming context push deferred.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/context-engine/monitoring',
        notes: 'Assemble audit snapshot.',
      },
    ] satisfies ContextCapability[],
    honesty: {
      infiniteContextWindow: false,
      llmSummarization: false,
      realtimePush: false,
      orchestratesExisting: true,
    },
    links: {
      console: '/context-engine',
      hub: '/intelligence-cloud',
      knowledge: '/knowledge',
      vectorCloud: '/vector-cloud',
      memoryCloud: '/memory-cloud',
      knowledgeGraph: '/knowledge-graph',
      assemble: 'POST /v1/context-engine/assemble',
      openapi: '/v1/openapi.json',
      docs: '/docs/CONTEXT_ENGINE.md',
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
      realtime: false,
    },
  };
}
