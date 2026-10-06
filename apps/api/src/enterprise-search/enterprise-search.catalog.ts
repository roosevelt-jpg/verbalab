export type EnterpriseSearchCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EnterpriseSearchCapability = {
  id: string;
  name: string;
  status: EnterpriseSearchCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Enterprise Search. Search over EKB/ — not Elastic/OpenSearch OS. */
export function enterpriseSearchCatalog() {
  return {
    product: 'Lugemi Enterprise Search',
    note:
      'Workspace-scoped search over Knowledge Base chunks. Keyword + semantic (pgvector) + light hybrid RRF. Extends Vector Cloud. Not Elastic/OpenSearch OS; image/voice/BM25-parity deferred.',
    capabilities: [
      {
        id: 'full-text-keyword',
        name: 'Full text / keyword search',
        status: 'shipped',
        api: 'POST /v1/enterprise-search/search',
        notes: 'mode=keyword — ILIKE over knowledge_chunks.content (org+workspace scoped).',
      },
      {
        id: 'semantic-search',
        name: 'Semantic / vector search',
        status: 'shipped',
        api: 'POST /v1/enterprise-search/search',
        notes: 'mode=semantic — wraps pgvector nearest neighbor.',
      },
      {
        id: 'hybrid-search',
        name: 'Hybrid search',
        status: 'partial',
        api: 'POST /v1/enterprise-search/search',
        notes: 'mode=hybrid — light RRF of keyword + semantic. Not BM25/Elastic hybrid OS.',
      },
      {
        id: 'document-search',
        name: 'Document search',
        status: 'shipped',
        api: 'POST /v1/enterprise-search/search',
        notes: 'Filters by collection/tag/contentKind/documentId on top of modes.',
      },
      {
        id: 'knowledge-search',
        name: 'Knowledge search',
        status: 'shipped',
        api: 'POST /v1/enterprise-search/search',
        notes: 'Alias for document chunk search over the Knowledge Base.',
      },
      {
        id: 'filters',
        name: 'Filters',
        status: 'shipped',
        api: 'POST /v1/enterprise-search/search',
        notes: 'collection, tag, contentKind, documentId — all workspace-scoped.',
      },
      {
        id: 'ranking',
        name: 'Ranking',
        status: 'partial',
        api: 'POST /v1/enterprise-search/search',
        notes: 'Cosine score / keyword rank / RRF. Learned rankers deferred.',
      },
      {
        id: 'suggestions',
        name: 'Suggestions',
        status: 'partial',
        api: 'GET /v1/enterprise-search/suggest',
        notes: 'Filename + tag prefix suggestions. Autocomplete OS deferred.',
      },
      {
        id: 'translation-search',
        name: 'Translation search',
        status: 'deferred',
        api: null,
        notes: 'Cross-lingual retrieval deferred — use Language Cloud + RAG later.',
      },
      {
        id: 'image-search',
        name: 'Image search',
        status: 'deferred',
        api: null,
        notes: 'Multimodal image search deferred.',
      },
      {
        id: 'voice-search',
        name: 'Voice search',
        status: 'deferred',
        api: null,
        notes: 'Speech-to-query deferred — use Speech Cloud STT + search later.',
      },
      {
        id: 'analytics',
        name: 'Search analytics',
        status: 'shipped',
        api: 'GET /v1/enterprise-search/analytics',
        notes: 'Audit-count snapshot for enterprise_search.searched.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/enterprise-search/monitoring',
        notes: 'Honesty + deferred capability ids.',
      },
    ] satisfies EnterpriseSearchCapability[],
    honesty: {
      elasticOs: false,
      openSearchParity: false,
      bm25Parity: false,
      imageSearch: false,
      voiceSearch: false,
      translationSearchOs: false,
      orgWorkspaceScoped: true,
      extendsVl062: true,
      extendsVectorCloud: true,
    },
    modes: ['keyword', 'semantic', 'hybrid'] as const,
    links: {
      hub: '/knowledge-cloud',
      console: '/enterprise-search',
      knowledgeBase: '/knowledge-base',
      knowledge: '/knowledge',
      vectorCloud: '/vector-cloud',
      search: 'POST /v1/enterprise-search/search',
      vectorSearch: 'POST /v1/vector-cloud/search',
      rag: 'POST /v1/knowledge/query',
    },
  };
}

export type EnterpriseSearchMode = 'keyword' | 'semantic' | 'hybrid';
