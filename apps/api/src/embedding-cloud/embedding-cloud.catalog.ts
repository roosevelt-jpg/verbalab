export type EmbeddingCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EmbeddingCapability = {
  id: string;
  name: string;
  status: EmbeddingCapabilityStatus;
  api: string | null;
  notes: string;
};

export type EmbeddingModality = {
  id: string;
  name: string;
  status: EmbeddingCapabilityStatus;
  notes: string;
};

/** Library Phase 48 → Embedding Cloud. Extends existing — not a multimodal embedding OS. */
export function embeddingCloudCatalog {
  return {
    product: 'Lugemi Embedding Cloud',
    note:
      'Text embeddings via AI Gateway (OpenAI text-embedding-3-small by default). Document/code use the same text path. Speech/image/video/cross-modal deferred. Not Voyage/Cohere multimodal parity.',
    capabilities: [
      {
        id: 'text-embeddings',
        name: 'Text Embeddings',
        status: 'shipped',
        api: 'POST /v1/embeddings',
        notes: 'OpenAI-shaped string | string[] input.',
      },
      {
        id: 'document-embeddings',
        name: 'Document Embeddings',
        status: 'partial',
        api: 'POST /v1/embeddings',
        notes: 'Same text path + Knowledge RAG chunk embeds. No separate doc encoder.',
      },
      {
        id: 'code-embeddings',
        name: 'Code Embeddings',
        status: 'partial',
        api: 'POST /v1/embeddings',
        notes: 'Text model with modality=code metadata — not a dedicated code embedder.',
      },
      {
        id: 'multilingual-embeddings',
        name: 'Multilingual Embeddings',
        status: 'partial',
        api: 'POST /v1/embeddings',
        notes: 'Vendor multilingual text model; no language-specific African embedding models.',
      },
      {
        id: 'speech-embeddings',
        name: 'Speech Embeddings',
        status: 'deferred',
        api: null,
        notes: 'Audio→vector models deferred.',
      },
      {
        id: 'voice-embeddings',
        name: 'Voice Embeddings',
        status: 'deferred',
        api: null,
        notes: 'Speaker/voice biometric vectors ≠ Embedding Cloud; see 176.',
      },
      {
        id: 'image-embeddings',
        name: 'Image Embeddings',
        status: 'deferred',
        api: null,
        notes: 'Vision/CLIP-style embeds deferred (Vision Cloud unscheduled).',
      },
      {
        id: 'video-embeddings',
        name: 'Video Embeddings',
        status: 'deferred',
        api: null,
        notes: 'Video encoders deferred.',
      },
      {
        id: 'cross-modal',
        name: 'Cross Modal Embeddings',
        status: 'deferred',
        api: null,
        notes: 'Shared image-text space deferred.',
      },
      {
        id: 'hybrid',
        name: 'Hybrid Embeddings',
        status: 'deferred',
        api: null,
        notes: 'Dense+sparse hybrid retrieval product deferred (Vector Cloud ).',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/embedding-cloud/analytics',
        notes: 'Token/request aggregates from usage_events + audits.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/embedding-cloud/monitoring',
        notes: 'Snapshot + shared request IDs.',
      },
    ] satisfies EmbeddingCapability[],
    modalities: [
      { id: 'text', name: 'Text', status: 'shipped', notes: 'Default modality.' },
      { id: 'document', name: 'Document', status: 'partial', notes: 'Text path + RAG chunks.' },
      { id: 'code', name: 'Code', status: 'partial', notes: 'Text path with modality tag.' },
      { id: 'speech', name: 'Speech', status: 'deferred', notes: 'Deferred.' },
      { id: 'voice', name: 'Voice', status: 'deferred', notes: 'Deferred — biometrics separate.' },
      { id: 'image', name: 'Image', status: 'deferred', notes: 'Deferred.' },
      { id: 'video', name: 'Video', status: 'deferred', notes: 'Deferred.' },
      { id: 'cross_modal', name: 'Cross Modal', status: 'deferred', notes: 'Deferred.' },
      { id: 'hybrid', name: 'Hybrid', status: 'deferred', notes: 'Deferred.' },
    ] satisfies EmbeddingModality[],
    honesty: {
      trainsEmbeddingModels: false,
      multimodalOs: false,
      speechImageVideo: false,
    },
    links: {
      console: '/embedding-cloud',
      hub: '/intelligence-cloud',
      create: 'POST /v1/embeddings',
      knowledge: '/knowledge',
      openapi: '/v1/openapi.json',
      docs: '/docs/EMBEDDING_CLOUD.md',
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
      gateway: true,
      defaultModel: process.env.OPENAI_EMBEDDINGS_MODEL ?? 'text-embedding-3-small',
    },
  };
}

export const SUPPORTED_EMBED_MODALITIES = ['text', 'document', 'code'] as const;
export type SupportedEmbedModality = (typeof SUPPORTED_EMBED_MODALITIES)[number];

export function embeddingModelsCatalog {
  const defaultModel = process.env.OPENAI_EMBEDDINGS_MODEL ?? 'text-embedding-3-small';
  return {
    models: [
      {
        id: defaultModel,
        provider: 'openai_embeddings',
        modalities: ['text', 'document', 'code'],
        dimensions: defaultModel.includes('large') ? 3072 : 1536,
        default: true,
        status: 'shipped' as const,
        notes: 'Gateway OpenAI embeddings. Live path needs OPENAI_API_KEY.',
      },
      {
        id: 'text-embedding-3-large',
        provider: 'openai_embeddings',
        modalities: ['text', 'document', 'code'],
        dimensions: 3072,
        default: false,
        status: 'shipped' as const,
        notes: 'Optional via model= on POST /v1/embeddings.',
      },
    ],
    note: 'Buy embeddings — Lugemi does not train embedding models.',
  };
}
