export type EnterpriseRagCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EnterpriseRagCapability = {
  id: string;
  name: string;
  status: EnterpriseRagCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 65 → Enterprise RAG Platform. Grounded RAG over existing — not LangChain OS. */
export function enterpriseRagCatalog {
  return {
    product: 'Lugemi Enterprise RAG Platform',
    note:
      'Workspace-scoped retrieval-augmented generation over Knowledge Base chunks. Extends existing RAG + Enterprise Search hybrid + Vector/Context. Not a LangChain/LlamaIndex/agentic-RAG OS. Hand-verify retrieval on real docs — green tests alone are insufficient.',
    capabilities: [
      {
        id: 'retrieval',
        name: 'Retrieval',
        status: 'shipped',
        api: 'POST /v1/enterprise-rag/retrieve',
        notes: 'Keyword / semantic / hybrid retrieval with citations (org+workspace scoped).',
      },
      {
        id: 'chunking',
        name: 'Chunking',
        status: 'shipped',
        api: 'POST /v1/enterprise-rag/chunk',
        notes: 'Preview overlapping character windows (same algorithm as ingest).',
      },
      {
        id: 'hybrid-search',
        name: 'Hybrid search',
        status: 'partial',
        api: 'POST /v1/enterprise-rag/retrieve',
        notes: 'mode=hybrid — light RRF via Enterprise Search. Not BM25 OS.',
      },
      {
        id: 'vector-search',
        name: 'Vector search',
        status: 'shipped',
        api: 'POST /v1/enterprise-rag/retrieve',
        notes: 'mode=semantic — pgvector cosine via existing.',
      },
      {
        id: 'knowledge-ranking',
        name: 'Knowledge ranking',
        status: 'partial',
        api: 'POST /v1/enterprise-rag/retrieve',
        notes: 'Score / RRF order + context optimization. Learned rankers deferred.',
      },
      {
        id: 'citation-engine',
        name: 'Citation engine',
        status: 'shipped',
        api: 'POST /v1/enterprise-rag/retrieve',
        notes: 'Structured [n] citations: documentId, chunkId, filename, snippet, score.',
      },
      {
        id: 'context-optimization',
        name: 'Context optimization',
        status: 'partial',
        api: 'POST /v1/enterprise-rag/retrieve',
        notes: 'Dedupe + maxChars truncation before LLM. Advanced compression deferred.',
      },
      {
        id: 'grounded-responses',
        name: 'Grounded responses',
        status: 'shipped',
        api: 'POST /v1/enterprise-rag/query',
        notes: 'Answer using ONLY retrieved context + citation rules (rag prompt).',
      },
      {
        id: 'enterprise-security',
        name: 'Enterprise security',
        status: 'shipped',
        api: 'POST /v1/enterprise-rag/query',
        notes: 'TranslateAuth + org/workspace isolation on every path.',
      },
      {
        id: 'workspace-isolation',
        name: 'Workspace isolation',
        status: 'shipped',
        api: null,
        notes: 'All retrieve/query scoped to organizationId + workspaceId.',
      },
      {
        id: 'rag-engine',
        name: 'RAG engine',
        status: 'shipped',
        api: 'GET /v1/enterprise-rag/engine',
        notes: 'Product catalog + honesty flags.',
      },
      {
        id: 'generate',
        name: 'Generate',
        status: 'shipped',
        api: 'POST /v1/enterprise-rag/query',
        notes: 'Grounded generation path (alias of query).',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/enterprise-rag/analytics',
        notes: 'Retrieve/query audit counts for workspace.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/enterprise-rag/monitoring',
        notes: 'Honesty + deferred capability ids.',
      },
      {
        id: 'agentic-rag',
        name: 'Agentic / multi-hop RAG',
        status: 'deferred',
        api: null,
        notes: 'Tool-calling / multi-hop agent loops deferred.',
      },
      {
        id: 'langchain-os',
        name: 'LangChain / LlamaIndex OS',
        status: 'deferred',
        api: null,
        notes: 'Framework parity deferred — bounded Nest hub only.',
      },
    ] satisfies EnterpriseRagCapability[],
    honesty: {
      langchainOs: false,
      llamaindexParity: false,
      agenticRagOs: false,
      bm25Parity: false,
      learnedRanker: false,
      regeneratesVl062: false,
      extendsVl062: true,
      extendsEnterpriseSearch: true,
      orgWorkspaceScoped: true,
      handVerifyRequired: true,
    },
    modes: ['keyword', 'semantic', 'hybrid'] as const,
    links: {
      hub: '/knowledge-cloud',
      console: '/enterprise-rag',
      knowledge: '/knowledge',
      knowledgeBase: '/knowledge-base',
      enterpriseSearch: '/enterprise-search',
      vectorCloud: '/vector-cloud',
      contextEngine: '/context-engine',
      retrieve: 'POST /v1/enterprise-rag/retrieve',
      query: 'POST /v1/enterprise-rag/query',
      legacyQuery: 'POST /v1/knowledge/query',
    },
  };
}

export type EnterpriseRagMode = 'keyword' | 'semantic' | 'hybrid';
