export type BatchCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type BatchCapability = {
  id: string;
  name: string;
  status: BatchCapabilityStatus;
  api: string | null;
  notes: string;
};

export type BatchKind =
  | 'translation'
  | 'speech'
  | 'ocr'
  | 'embedding'
  | 'training'
  | 'video';

export type BatchKindRow = {
  id: BatchKind;
  name: string;
  status: BatchCapabilityStatus;
  existingApi: string | null;
  hubApi: string;
  notes: string;
};

export function batchKinds(): BatchKindRow[] {
  return [
    {
      id: 'translation',
      name: 'Translation Jobs',
      status: 'partial',
      existingApi: 'POST /v1/jobs type=batch_translate',
      hubApi: 'POST /v1/batch-runtime/runs',
      notes: 'Delegates to existing BullMQ batch_translate jobs — not regenerated.',
    },
    {
      id: 'speech',
      name: 'Speech Jobs',
      status: 'partial',
      existingApi: 'POST /v1/stt',
      hubApi: 'POST /v1/batch-runtime/runs',
      notes: 'Sandbox batch of STT item stubs; live STT remains on Gateway.',
    },
    {
      id: 'ocr',
      name: 'OCR Jobs',
      status: 'partial',
      existingApi: 'POST /v1/ocr',
      hubApi: 'POST /v1/batch-runtime/runs',
      notes: 'Sandbox batch of OCR item stubs; live OCR remains on Gateway.',
    },
    {
      id: 'embedding',
      name: 'Embedding Jobs',
      status: 'partial',
      existingApi: 'POST /v1/embeddings',
      hubApi: 'POST /v1/batch-runtime/runs',
      notes: 'Sandbox batch of embedding item stubs; live embeddings remain on Gateway.',
    },
    {
      id: 'training',
      name: 'Training Jobs',
      status: 'partial',
      existingApi: 'POST /v1/training-jobs',
      hubApi: 'GET /v1/batch-runtime/kinds',
      notes: 'Links existing training jobs API — not regenerated here.',
    },
    {
      id: 'video',
      name: 'Video Jobs',
      status: 'deferred',
      existingApi: null,
      hubApi: 'GET /v1/batch-runtime/kinds',
      notes: 'Video batch OS deferred.',
    },
  ];
}

/**
 * Batch Runtime.
 * Hub over BullMQ /v1/jobs + sandbox runs — not a distributed batch OS.
 */
export function batchRuntimeCatalog() {
  return {
    product: 'Lugemi Batch Runtime',
    note:
      'Batch Runtime. Catalogs translation/speech/OCR/embedding/training batch surfaces. Translation runs delegate to existing BullMQ jobs. Sandbox runs support priority, retry budget, and checkpoint cursors. Not a distributed batch/queue OS or video batch fabric.',
    capabilities: [
      {
        id: 'translation-jobs',
        name: 'Translation Jobs',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs',
        notes: 'Delegates to POST /v1/jobs batch_translate.',
      },
      {
        id: 'speech-jobs',
        name: 'Speech Jobs',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs',
        notes: 'Sandbox speech batch items.',
      },
      {
        id: 'ocr-jobs',
        name: 'OCR Jobs',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs',
        notes: 'Sandbox OCR batch items.',
      },
      {
        id: 'embedding-jobs',
        name: 'Embedding Jobs',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs',
        notes: 'Sandbox embedding batch items.',
      },
      {
        id: 'training-jobs',
        name: 'Training Jobs',
        status: 'partial',
        api: 'POST /v1/training-jobs',
        notes: 'Links existing training jobs — not regenerated.',
      },
      {
        id: 'video-jobs',
        name: 'Video Jobs',
        status: 'deferred',
        api: null,
        notes: 'Video batch deferred.',
      },
      {
        id: 'scheduling',
        name: 'Scheduling',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs',
        notes: 'runAt / queue-now — not cron OS.',
      },
      {
        id: 'retry',
        name: 'Retry',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs/:id/retry',
        notes: 'Retry budget on sandbox runs; BullMQ attempts on delegated jobs.',
      },
      {
        id: 'checkpointing',
        name: 'Checkpointing',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs/:id/checkpoint',
        notes: 'Cursor checkpoint on sandbox item index — not distributed snapshot OS.',
      },
      {
        id: 'priority-queues',
        name: 'Priority Queues',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs',
        notes: 'priority low|normal|high ordering in hub queue — not multi-tenant QoS OS.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/batch-runtime/analytics',
        notes: 'Run aggregates — ≠.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/batch-runtime/monitoring',
        notes: 'Monitoring + honesty snapshot.',
      },
      {
        id: 'rest',
        name: 'REST',
        status: 'shipped',
        api: 'GET /v1/batch-runtime/engine',
        notes: 'REST batch hub.',
      },
      {
        id: 'sdk',
        name: 'SDK',
        status: 'shipped',
        api: 'batchRuntimeEngine()',
        notes: '@lugemi/sdk',
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        status: 'shipped',
        api: '/batch-runtime',
        notes: 'Console hub.',
      },
      {
        id: 'documentation',
        name: 'Documentation',
        status: 'shipped',
        api: '/docs/BATCH_RUNTIME.md',
        notes: 'Product documentation.',
      },
      {
        id: 'production-deployment',
        name: 'Production deployment',
        status: 'partial',
        api: 'POST /v1/batch-runtime/runs',
        notes: 'Ships with Nest + existing BullMQ — not a separate batch fleet OS.',
      },
    ] satisfies BatchCapability[],
    honesty: {
      sparkOs: false,
      airflowOs: false,
      celeryOs: false,
      distributedBatchOs: false,
      videoBatchOs: false,
      regeneratesJobsApi: false,
      extendsBullMqJobs: true,
      orgWorkspaceScoped: true,
      sandboxRunsForNonTranslate: true,
      cronSchedulerOs: false,
    },
    links: {
      console: '/batch-runtime',
      hub: '/inference-cloud',
      jobs: '/jobs',
      trainingJobs: '/v1/training-jobs',
      docs: '/docs/BATCH_RUNTIME.md',
      openapi: '/v1/openapi.json',
    },
  };
}

export function batchRuntimeMode(): 'sandbox' | 'disabled' {
  const raw = (process.env.LUGEMI_BATCH_RUNTIME_MODE ?? 'sandbox').toLowerCase();
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

export function batchCeilings() {
  const maxItems = Math.max(
    1,
    Number(process.env.LUGEMI_BATCH_MAX_ITEMS ?? '50') || 50,
  );
  const maxRetries = Math.max(
    0,
    Number(process.env.LUGEMI_BATCH_MAX_RETRIES ?? '2') || 2,
  );
  return {
    maxItemsPerRun: Math.min(maxItems, 100),
    maxRetries: Math.min(maxRetries, 5),
    mode: batchRuntimeMode(),
    note: 'Hard ceilings on sandbox batch item count and retry budget.',
  };
}

export const BATCH_KINDS: BatchKind[] = [
  'translation',
  'speech',
  'ocr',
  'embedding',
  'training',
  'video',
];

export type BatchPriority = 'low' | 'normal' | 'high';

export function priorityWeight(p: BatchPriority): number {
  if (p === 'high') return 30;
  if (p === 'low') return 5;
  return 15;
}
