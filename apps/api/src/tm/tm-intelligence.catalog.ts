export type TmCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type TmCapability = {
  id: string;
  name: string;
  status: TmCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 13 → Lugemi Enterprise Translation Memory. */
export function tmIntelligenceCatalog() {
  return {
    product: 'Enterprise Translation Memory',
    note:
      'Scoped TM (workspace/enterprise/shared/project) with exact match, lexical + optional vector similarity, versioning, and glossary/terminology links. Not Phrase/MemoQ parity.',
    capabilities: [
      {
        id: 'enterprise_memory',
        name: 'Enterprise memory',
        status: 'shipped',
        api: 'POST /v1/tm/entries scope=enterprise',
        notes: 'Org-wide readable exact matches.',
      },
      {
        id: 'workspace_memory',
        name: 'Workspace memory',
        status: 'shipped',
        api: 'POST /v1/tm/entries',
        notes: 'Default workspace-scoped exact TM.',
      },
      {
        id: 'project_memory',
        name: 'Project memory',
        status: 'shipped',
        api: 'POST /v1/tm/entries scope=project&projectKey=',
        notes: 'Lightweight projectKey partition — not a full project TMS.',
      },
      {
        id: 'shared_memory',
        name: 'Shared memory',
        status: 'shipped',
        api: 'POST /v1/tm/entries scope=shared',
        notes: 'Org-shared exact matches across workspaces.',
      },
      {
        id: 'glossaries',
        name: 'Glossaries',
        status: 'shipped',
        api: '/v1/glossary/terms',
        notes: 'Existing workspace glossary + vertical packs.',
      },
      {
        id: 'terminology',
        name: 'Terminology',
        status: 'partial',
        api: 'GET /v1/tm/terminology',
        notes: 'Glossary façade — no separate termbase product.',
      },
      {
        id: 'translation_history',
        name: 'Translation history',
        status: 'shipped',
        api: 'GET /v1/tm/history',
        notes: 'TM version snapshots + recent TM audit events.',
      },
      {
        id: 'similarity_search',
        name: 'Similarity search',
        status: 'shipped',
        api: 'POST /v1/tm/search',
        notes: 'Lexical bigram similarity; optional vector re-rank when embeddings keyed.',
      },
      {
        id: 'versioning',
        name: 'Versioning',
        status: 'shipped',
        api: 'GET /v1/tm/entries/:id/versions',
        notes: 'Version bump + snapshot on target text change.',
      },
      {
        id: 'vector_search',
        name: 'Vector search',
        status: 'partial',
        api: 'POST /v1/tm/search mode=vector',
        notes: 'pgvector when OPENAI_API_KEY set and entry embeddings stored; else lexical fallback.',
      },
    ] satisfies TmCapability[],
    engines: {
      memory: { status: 'shipped', api: '/v1/tm/*' },
      vector: { status: 'partial', notes: 'Optional OpenAI embeddings + pgvector' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', notes: 'tmIntelligence + searchTm' },
      sdk: { status: 'shipped', package: '@lugemi/sdk' },
      analytics: { status: 'shipped', api: 'GET /v1/tm/analytics' },
      monitoring: { status: 'partial', api: 'GET /v1/metrics/translate', notes: 'Shared observability stack' },
    },
    links: {
      dashboard: '/tm',
      glossary: '/glossary',
      docs: '/docs/TM.md',
    },
  };
}
