export type RecCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type RecCapability = {
  id: string;
  name: string;
  status: RecCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 54 → Recommendation Engine (VL-187). Light rankers — not a retail recommender OS. */
export function recommendationEngineCatalog() {
  return {
    product: 'VerbaLab Recommendation Engine',
    note:
      'Light rankers over languages, voices, knowledge/content, translation pairs, models, and workflow APIs (VL-187). Uses registry/TTS/Vector/Memory catalogs + optional memory text signals. Not a collaborative-filtering / retail recommender OS.',
    capabilities: [
      {
        id: 'content-recommendation',
        name: 'Content Recommendation',
        status: 'shipped',
        api: 'POST /v1/recommendation-engine/recommend',
        notes: 'kind=content — knowledge docs via vector search or filename match.',
      },
      {
        id: 'language-recommendation',
        name: 'Language Recommendation',
        status: 'shipped',
        api: 'POST /v1/recommendation-engine/recommend',
        notes: 'kind=language — registry rank + African tier + workspace defaults.',
      },
      {
        id: 'voice-recommendation',
        name: 'Voice Recommendation',
        status: 'shipped',
        api: 'POST /v1/recommendation-engine/recommend',
        notes: 'kind=voice — Neural TTS + marketplace listings.',
      },
      {
        id: 'translation-recommendation',
        name: 'Translation Recommendation',
        status: 'shipped',
        api: 'POST /v1/recommendation-engine/recommend',
        notes: 'kind=translation — suggested language pairs.',
      },
      {
        id: 'model-recommendation',
        name: 'Model Recommendation',
        status: 'partial',
        api: 'POST /v1/recommendation-engine/recommend',
        notes: 'kind=model — embedding model catalog rank. Chat model marketplace deferred.',
      },
      {
        id: 'workflow-recommendation',
        name: 'Workflow Recommendation',
        status: 'partial',
        api: 'POST /v1/recommendation-engine/recommend',
        notes: 'kind=workflow — fixed API recipe catalog, not an automation OS.',
      },
      {
        id: 'knowledge-recommendation',
        name: 'Knowledge Recommendation',
        status: 'shipped',
        api: 'POST /v1/recommendation-engine/recommend',
        notes: 'kind=knowledge — alias of content via Vector Cloud search.',
      },
      {
        id: 'enterprise-recommendation',
        name: 'Enterprise Recommendation',
        status: 'deferred',
        api: null,
        notes: 'Cross-tenant / retail personalization OS deferred.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/recommendation-engine/analytics',
        notes: 'Recommend audit counts.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/recommendation-engine/monitoring',
        notes: 'Snapshot + honesty flags.',
      },
    ] satisfies RecCapability[],
    honesty: {
      retailRecommenderOs: false,
      collaborativeFiltering: false,
      banditsFeatureStore: false,
      trainsRankingModels: false,
      lightRankers: true,
    },
    links: {
      console: '/recommendation-engine',
      hub: '/intelligence-cloud',
      embeddingCloud: '/embedding-cloud',
      vectorCloud: '/vector-cloud',
      memoryCloud: '/memory-cloud',
      recommend: 'POST /v1/recommendation-engine/recommend',
      openapi: '/v1/openapi.json',
      docs: '/docs/RECOMMENDATION_ENGINE.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@verbalab/sdk',
      cli: '@verbalab/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      backend: 'light_rankers',
    },
  };
}

export const RECOMMEND_KINDS = [
  'language',
  'voice',
  'content',
  'knowledge',
  'translation',
  'model',
  'workflow',
] as const;

export type RecommendKind = (typeof RECOMMEND_KINDS)[number];

export const WORKFLOW_RECIPES = [
  {
    id: 'translate_then_tts',
    name: 'Translate then speak',
    apis: ['POST /v1/translate', 'POST /v1/tts/synthesize'],
    tags: ['translate', 'voice', 'tts'],
  },
  {
    id: 'rag_answer',
    name: 'Knowledge RAG answer',
    apis: ['POST /v1/knowledge/query'],
    tags: ['knowledge', 'rag', 'content'],
  },
  {
    id: 'embed_and_search',
    name: 'Embed query and vector search',
    apis: ['POST /v1/embedding-cloud/embed', 'POST /v1/vector-cloud/search'],
    tags: ['embedding', 'vector', 'knowledge'],
  },
  {
    id: 'assemble_and_reason',
    name: 'Assemble context then reason',
    apis: ['POST /v1/context-engine/assemble', 'POST /v1/reasoning-cloud/reason'],
    tags: ['context', 'reasoning'],
  },
  {
    id: 'detect_and_translate',
    name: 'Detect language then translate',
    apis: ['POST /v1/detect', 'POST /v1/translate'],
    tags: ['language', 'translate'],
  },
] as const;
