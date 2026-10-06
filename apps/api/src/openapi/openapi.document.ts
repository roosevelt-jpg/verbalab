export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Lugemi API',
    version: '0.1.0',
    description:
      'Enterprise language-intelligence API. Core surface: languages, translate, API keys, and usage.',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Local' }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'lg_live_ | lg_test_',
        description: 'API key from the console (lg_live_… production label, lg_test_… soft sandbox).',
      },
      ClerkAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk session JWT for console routes.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              request_id: { type: 'string' },
            },
            required: ['code', 'message', 'request_id'],
          },
        },
        required: ['error'],
      },
      TranslateRequest: {
        type: 'object',
        required: ['text', 'source', 'target'],
        properties: {
          text: { type: 'string', minLength: 1 },
          source: {
            type: 'string',
            description: 'Source language code, or "auto" to detect first.',
            example: 'en',
          },
          target: { type: 'string', example: 'sw' },
        },
      },
      DetectRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1 },
        },
      },
      DetectResponse: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          confidence: { type: 'number' },
          provider: { type: 'string' },
        },
        required: ['language', 'confidence', 'provider'],
      },
      TranslateResponse: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          source: { type: 'string' },
          target: { type: 'string' },
          provider: { type: 'string' },
          characters: { type: 'integer' },
          glossaryApplied: { type: 'integer' },
          tmHit: { type: 'boolean' },
          reviewId: { type: 'string' },
          qualityScore: { type: 'integer' },
          needsReview: { type: 'boolean' },
          detection: {
            nullable: true,
            allOf: [{ $ref: '#/components/schemas/DetectResponse' }],
            description: 'Present when source was "auto".',
          },
        },
        required: ['text', 'source', 'target', 'provider', 'characters'],
      },
      ChatMessage: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['system', 'user', 'assistant'] },
          content: { type: 'string' },
        },
      },
      ChatCompletionRequest: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: { $ref: '#/components/schemas/ChatMessage' },
            minItems: 1,
          },
          model: { type: 'string', description: 'Optional OpenAI model override' },
          translateReplyTo: {
            type: 'string',
            description: 'Optional registry language to MT the assistant reply into',
          },
        },
      },
      ChatCompletionResponse: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          object: { type: 'string', example: 'chat.completion' },
          model: { type: 'string' },
          provider: { type: 'string' },
          choices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'integer' },
                message: { $ref: '#/components/schemas/ChatMessage' },
                finish_reason: { type: 'string' },
              },
            },
          },
          usage: {
            type: 'object',
            properties: {
              prompt_tokens: { type: 'integer' },
              completion_tokens: { type: 'integer' },
              total_tokens: { type: 'integer' },
            },
          },
          translated: { type: 'boolean' },
          translateReplyTo: { type: 'string', nullable: true },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['batch_translate', 'document_translate', 'workflow'] },
          status: { type: 'string', enum: ['queued', 'running', 'succeeded', 'failed'] },
          input: { type: 'object' },
          result: { type: 'object', nullable: true },
          error: { type: 'string', nullable: true },
          webhookUrl: { type: 'string', nullable: true },
          webhookStatus: { type: 'string', nullable: true },
          attempts: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Workflow: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          steps: {
            type: 'array',
            items: { type: 'object' },
            description: 'Directed steps: transcribe | translate | notify',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Language: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          nativeName: { type: 'string', nullable: true },
          script: { type: 'string', nullable: true },
          rtl: { type: 'boolean' },
          tier: { type: 'string', enum: ['vendor', 'strategic_african'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is up (includes in-process translate latency snapshot)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    translateLatency: {
                      type: 'object',
                      properties: {
                        samples: { type: 'integer' },
                        p50Ms: { type: 'number', nullable: true },
                        p95Ms: { type: 'number', nullable: true },
                        p99Ms: { type: 'number', nullable: true },
                        maxMs: { type: 'number', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/metrics/translate': {
      get: {
        summary: 'Translate latency percentiles (in-process)',
        operationId: 'translateLatencyMetrics',
        responses: {
          '200': {
            description: 'Rolling-window p50/p95/p99 for this API instance',
          },
        },
      },
    },
    '/v1/languages/engine': {
      get: {
        summary: 'Language Engine catalog',
        operationId: 'getLanguageEngine',
        responses: {
          '200': {
            description: 'Language registry capabilities and honesty notes',
          },
        },
      },
    },
    '/v1/languages': {
      get: {
        summary: 'List languages',
        operationId: 'listLanguages',
        responses: {
          '200': {
            description: 'Language registry',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Language' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/languages/{code}': {
      get: {
        summary: 'Get language with family, dialects, accents, and linguistic rules',
        operationId: 'getLanguage',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Language detail' },
          '404': { description: 'Not in registry' },
        },
      },
    },
    '/v1/registry': {
      get: {
        summary: 'Enterprise Language Registry overview',
        operationId: 'registryOverview',
        responses: { '200': { description: 'Counts and links' } },
      },
    },
    '/v1/registry/families': {
      get: {
        summary: 'List language families',
        operationId: 'listLanguageFamilies',
        responses: { '200': { description: 'Families' } },
      },
    },
    '/v1/registry/scripts': {
      get: {
        summary: 'List writing systems / scripts',
        operationId: 'listScripts',
        parameters: [
          {
            name: 'kind',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['alphabet', 'abjad', 'abugida', 'syllabary', 'logographic', 'other'],
            },
          },
        ],
        responses: { '200': { description: 'ISO 15924 writing systems' } },
      },
    },
    '/v1/registry/alphabets': {
      get: {
        summary: 'List alphabet writing systems',
        operationId: 'listAlphabets',
        responses: { '200': { description: 'kind=alphabet subset' } },
      },
    },
    '/v1/registry/rules': {
      get: {
        summary: 'List linguistic rules (pronunciation/grammar/phonetic/morphology)',
        operationId: 'listLinguisticRules',
        parameters: [
          { name: 'kind', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'language', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Curated rule catalog' } },
      },
    },
    '/v1/registry/validate': {
      post: {
        summary: 'Validate registry codes',
        operationId: 'validateRegistry',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  language: { type: 'string' },
                  dialect: { type: 'string' },
                  accent: { type: 'string' },
                  locale: { type: 'string' },
                  script: { type: 'string' },
                  family: { type: 'string' },
                  rule: { type: 'string' },
                  bcp47: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Validation result' } },
      },
    },
    '/v1/registry/analytics': {
      get: {
        summary: 'Registry coverage analytics',
        operationId: 'registryAnalytics',
        responses: { '200': { description: 'Counts by tier/family/script/rule kind' } },
      },
    },
    '/v1/registry/health': {
      get: {
        summary: 'Registry integrity monitoring',
        operationId: 'registryHealth',
        responses: { '200': { description: 'ok or degraded with issues' } },
      },
    },
    '/v1/locales/engine': {
      get: {
        summary: 'Locale Engine catalog',
        operationId: 'getLocaleEngine',
        responses: {
          '200': { description: 'Locale pack capabilities and honesty notes' },
        },
      },
    },
    '/v1/locales': {
      get: {
        summary: 'List locale / cultural packs',
        operationId: 'listLocales',
        responses: {
          '200': {
            description: 'Seeded packs (date/number/currency notes, honorifics, do-not-translate)',
          },
        },
      },
    },
    '/v1/locales/{code}': {
      get: {
        summary: 'Get locale pack for a language code',
        operationId: 'getLocale',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Locale pack' },
          '404': { description: 'No pack for code' },
        },
      },
    },
    '/v1/locales/{code}/examples': {
      get: {
        summary: 'Intl date/number/currency examples for a locale pack',
        operationId: 'getLocaleExamples',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Formatted samples' } },
      },
    },
    '/v1/finetunes/candidates': {
      get: {
        summary: 'List failed language-pair fine-tune candidates from coverage',
        operationId: 'listFineTuneCandidates',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Candidates below coverage thresholds' } },
      },
    },
    '/v1/finetunes/jobs': {
      get: {
        summary: 'List fine-tune jobs for the organization',
        operationId: 'listFineTuneJobs',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Jobs' } },
      },
      post: {
        summary: 'Create a fine-tune job from a golden training pack (Pro)',
        operationId: 'createFineTuneJob',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceLang', 'targetLang'],
                properties: {
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  launcher: { type: 'string', enum: ['manual', 'modal'] },
                  baseModel: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '402': { description: 'Pro plan required' },
        },
      },
    },
    '/v1/finetunes/jobs/{id}/launch': {
      post: {
        summary: 'Launch or defer a fine-tune job (Pro)',
        operationId: 'launchFineTuneJob',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Status updated (running or awaiting_gpu)' },
          '402': { description: 'Pro plan required' },
        },
      },
    },
    '/v1/finetunes/jobs/{id}/complete': {
      post: {
        summary: 'Attach artifact and optionally promote to model registry (Pro)',
        operationId: 'completeFineTuneJob',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  artifactKind: { type: 'string', enum: ['phrase_map', 'http_endpoint'] },
                  artifactUri: { type: 'string' },
                  useGoldenPhraseMap: { type: 'boolean' },
                  promote: { type: 'boolean' },
                  displayName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Completed' }, '402': { description: 'Pro plan required' } },
      },
    },
    '/v1/finetunes/models': {
      get: {
        summary: 'List model registry entries',
        operationId: 'listFineTuneModels',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Registry' } },
      },
    },
    '/v1/finetunes/models/{id}/retire': {
      post: {
        summary: 'Retire a ready fine-tune model (Pro)',
        operationId: 'retireFineTuneModel',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Retired' }, '402': { description: 'Pro plan required' } },
      },
    },
    '/v1/models/engine': {
      get: {
        summary: 'Models Engine catalog',
        operationId: 'getModelsEngine',
        responses: {
          '200': {
            description: 'Models Engine capabilities and honesty notes (not MLflow)',
          },
        },
      },
    },
    '/v1/models/live': {
      get: {
        summary: 'Public live model matrix per gateway feature',
        operationId: 'getModelsLive',
        responses: {
          '200': {
            description: 'Ready vendor + fine-tune entries with configured flags (not MLflow)',
          },
        },
      },
    },
    '/v1/models': {
      get: {
        summary: 'List model registry entries',
        operationId: 'listModels',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'feature', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Registry rows' } },
      },
    },
    '/v1/models/{idOrSlug}': {
      get: {
        summary: 'Get a model registry entry',
        operationId: 'getModel',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Entry' }, '404': { description: 'Not found' } },
      },
    },
    '/v1/models/{idOrSlug}/external-url': {
      post: {
        summary: 'Set optional external URL (e.g. W&B) — platform admin',
        operationId: 'setModelExternalUrl',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' }, '403': { description: 'Platform admin required' } },
      },
    },
    '/v1/models/{idOrSlug}/status': {
      post: {
        summary: 'Set registry status ready/retired/draft — platform admin',
        operationId: 'setModelStatus',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' }, '403': { description: 'Platform admin required' } },
      },
    },
    '/v1/training-jobs/launchers': {
      get: {
        summary: 'List training launchers and configuration status',
        operationId: 'listTrainingLaunchers',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'manual/modal/vertex/fixture configured flags' } },
      },
    },
    '/v1/training-jobs': {
      get: {
        summary: 'List rented-GPU / manual training jobs',
        operationId: 'listTrainingJobs',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Jobs' } },
      },
      post: {
        summary: 'Create a training job (Pro)',
        operationId: 'createTrainingJob',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceLang', 'targetLang'],
                properties: {
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  launcher: { type: 'string', enum: ['manual', 'modal', 'vertex', 'fixture'] },
                  baseModel: { type: 'string' },
                  datasetAssetId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '402': { description: 'Pro required' } },
      },
    },
    '/v1/training-jobs/callback': {
      post: {
        summary: 'Rented-GPU completion callback (token auth)',
        operationId: 'trainingJobCallback',
        responses: {
          '200': { description: 'Job updated / model promoted' },
          '401': { description: 'Invalid callback token' },
        },
      },
    },
    '/v1/training-jobs/{id}/launch': {
      post: {
        summary: 'Launch training on manual/Modal/Vertex/fixture (Pro)',
        operationId: 'launchTrainingJob',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'running or awaiting_gpu; returns callbackToken once' },
          '402': { description: 'Pro required' },
        },
      },
    },
    '/v1/training-jobs/{id}/complete': {
      post: {
        summary: 'Attach artifact and optionally promote (Pro)',
        operationId: 'completeTrainingJob',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Completed' } },
      },
    },
    '/v1/coverage': {
      get: {
        summary: 'Public language coverage matrix and golden-eval status',
        operationId: 'getCoverage',
        responses: {
          '200': {
            description:
              'Focus pairs (EN→sw/yo/am) with golden eval scores when available; honest disclaimer',
          },
        },
      },
    },
    '/v1/datasets': {
      get: {
        summary: 'List dataset assets in the session workspace',
        operationId: 'listDatasets',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Dataset assets with versions' } },
      },
      post: {
        summary: 'Create dataset asset with legal metadata + first file version',
        operationId: 'createDataset',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Created asset' },
          '400': { description: 'Missing license/consent or invalid file' },
        },
      },
    },
    '/v1/datasets/licenses': {
      get: {
        summary: 'List known license tags for dataset intake',
        operationId: 'listDatasetLicenses',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'License tag enum' } },
      },
    },
    '/v1/datasets/{id}': {
      get: {
        summary: 'Get a dataset asset',
        operationId: 'getDataset',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Asset with versions' } },
      },
      patch: {
        summary: 'Update dataset legal metadata or status',
        operationId: 'updateDataset',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
      delete: {
        summary: 'Archive dataset and unlink stored files',
        operationId: 'archiveDataset',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Archived' } },
      },
    },
    '/v1/datasets/{id}/versions': {
      post: {
        summary: 'Upload a new dataset file version',
        operationId: 'addDatasetVersion',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Version added' } },
      },
    },
    '/v1/datasets/{id}/versions/{version}/content': {
      get: {
        summary: 'Download dataset version bytes',
        operationId: 'downloadDatasetVersion',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'version', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'File bytes' } },
      },
    },
    '/v1/eval/run': {
      post: {
        summary: 'Run golden-set eval against the active MT gateway (owner/admin)',
        operationId: 'runEval',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'mode',
            in: 'query',
            schema: { type: 'string', enum: ['fixture', 'live', 'reference_oracle'], default: 'fixture' },
          },
        ],
        responses: {
          '200': { description: 'Eval snapshot written to eval/results/latest.json' },
          '400': { description: 'Live mode disabled without EVAL_LIVE=1' },
        },
      },
    },
    '/v1/detect': {
      post: {
        summary: 'Detect language of text',
        operationId: 'detectLanguage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DetectRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Detected language',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DetectResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '422': {
            description: 'Detection failed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/chat/completions': {
      post: {
        summary: 'Language-intelligence chat completion',
        operationId: 'chatCompletions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatCompletionRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Assistant reply',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatCompletionResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '503': {
            description: 'Provider not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/translate': {
      post: {
        summary: 'Translate text',
        operationId: 'translateText',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TranslateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Translated text',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TranslateResponse' },
              },
            },
          },
          '400': {
            description: 'Validation or unsupported language',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '429': {
            description: 'Rate limited (Retry-After)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            headers: {
              'Retry-After': { schema: { type: 'integer' } },
              'X-RateLimit-Limit': { schema: { type: 'string' } },
              'X-RateLimit-Remaining': { schema: { type: 'string' } },
            },
          },
          '503': {
            description: 'Provider or auth not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/translate/engine': {
      get: {
        summary: 'Translation engine capability catalog (capability catalog)',
        operationId: 'translateEngine',
        responses: { '200': { description: 'Shipped / partial / deferred capabilities' } },
      },
    },
    '/v1/translate/formats': {
      post: {
        summary: 'Translate HTML, Markdown, XML, CSV, or SRT content',
        operationId: 'translateFormat',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Format-preserving translation' } },
      },
    },
    '/v1/translate/stream': {
      post: {
        summary: 'Stream translation as SSE chunks',
        operationId: 'translateStream',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'text/event-stream' } },
      },
    },
    '/v1/translate/chat': {
      post: {
        summary: 'Translate chat message contents',
        operationId: 'translateChat',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Translated messages' } },
      },
    },
    '/v1/api-keys': {
      get: {
        summary: 'List API keys',
        operationId: 'listApiKeys',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Key prefixes (secrets never returned)' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create API key',
        operationId: 'createApiKey',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created; includes secret once' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/api-keys/{id}': {
      delete: {
        summary: 'Revoke API key',
        operationId: 'revokeApiKey',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Revoked' },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/usage/summary': {
      get: {
        summary: 'Month-to-date usage summary',
        operationId: 'getUsageSummary',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Usage summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    periodStart: { type: 'string', format: 'date-time' },
                    requests: { type: 'integer' },
                    characters: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/analytics/overview': {
      get: {
        summary: 'Org analytics overview (volume, estimated cost, job error rate)',
        operationId: 'getAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Period start (default: first day of current UTC month)',
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Period end exclusive (default: now)',
          },
        ],
        responses: {
          '200': {
            description: 'Aggregates from usage_events, translation_requests, and jobs',
          },
          '400': {
            description: 'Invalid period',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompts': {
      get: {
        summary: 'List managed prompt keys and active versions',
        operationId: 'listPrompts',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'chat, rag, voice_faq summaries' } },
      },
    },
    '/v1/prompts/{key}/versions': {
      get: {
        summary: 'List versions for a prompt key',
        operationId: 'listPromptVersions',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['chat', 'rag', 'voice_faq'] },
          },
        ],
        responses: { '200': { description: 'Version history' } },
      },
      post: {
        summary: 'Create a prompt version (activates by default)',
        operationId: 'createPromptVersion',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['chat', 'rag', 'voice_faq'] },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['body'],
                properties: {
                  body: { type: 'string' },
                  note: { type: 'string' },
                  activate: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/v1/prompts/{key}/activate': {
      post: {
        summary: 'Activate a prompt version (rollback)',
        operationId: 'activatePromptVersion',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['chat', 'rag', 'voice_faq'] },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['version'],
                properties: { version: { type: 'integer' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Activated' } },
      },
    },
    '/v1/prompts/{key}/fallback': {
      post: {
        summary: 'Clear active version and use code fallback',
        operationId: 'restorePromptFallback',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['chat', 'rag', 'voice_faq'] },
          },
        ],
        responses: { '200': { description: 'Using fallback' } },
      },
    },
    '/v1/marketplace/listings': {
      get: {
        summary: 'List published marketplace listings (Pro)',
        operationId: 'listMarketplaceListings',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'mine',
            in: 'query',
            schema: { type: 'string', enum: ['1', 'true'] },
            description: 'When set, return listings published by the current org',
          },
          {
            name: 'kind',
            in: 'query',
            schema: { type: 'string', enum: ['glossary', 'prompt', 'dataset'] },
            description: 'Filter by listing kind',
          },
        ],
        responses: {
          '200': { description: 'Listings (glossary, prompt, or dataset)' },
          '402': { description: 'Pro plan required' },
        },
      },
      post: {
        summary: 'Publish a marketplace listing from the workspace (Pro, owner/admin)',
        operationId: 'publishMarketplaceListing',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  kind: {
                    type: 'string',
                    enum: ['glossary', 'prompt', 'dataset'],
                    default: 'glossary',
                    description:
                      'glossary = terms; prompt = active managed prompts; dataset = approved TM pairs',
                  },
                  priceCents: {
                    type: 'integer',
                    minimum: 0,
                    description: '0 = free; paid listings require Connect when Stripe is live',
                  },
                  currency: { type: 'string', default: 'usd' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Published listing with frozen snapshot' },
          '402': { description: 'Pro plan required' },
        },
      },
    },
    '/v1/marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a listing into the session workspace (copy-on-install)',
        operationId: 'installMarketplaceListing',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description:
              'Install receipt, or { requiresPayment, checkoutUrl } for paid listings when Stripe is configured',
          },
          '402': { description: 'Pro plan required' },
          '409': { description: 'Already installed' },
        },
      },
    },
    '/v1/marketplace/listings/{id}': {
      delete: {
        summary: 'Unpublish a listing (publisher org only)',
        operationId: 'unpublishMarketplaceListing',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Unpublished' } },
      },
    },
    '/v1/marketplace/installs': {
      get: {
        summary: 'List marketplace installs for the session workspace',
        operationId: 'listMarketplaceInstalls',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Installs' } },
      },
    },
    '/v1/marketplace/sales': {
      get: {
        summary: 'List marketplace sales for the current org (buyer or publisher)',
        operationId: 'listMarketplaceSales',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Sales with platform fee' } },
      },
    },
    '/v1/marketplace/connect/status': {
      get: {
        summary: 'Stripe Connect payout status for the current org',
        operationId: 'getMarketplaceConnectStatus',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Connect status' } },
      },
    },
    '/v1/marketplace/connect/onboard': {
      post: {
        summary: 'Start Stripe Connect Express onboarding',
        operationId: 'startMarketplaceConnectOnboarding',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Account Link URL' },
          '503': { description: 'Connect not configured' },
        },
      },
    },
    '/v1/audit-events': {
      get: {
        summary: 'List audit events',
        operationId: 'listAuditEvents',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50, maximum: 200 },
          },
        ],
        responses: {
          '200': { description: 'Recent audit events for the organization' },
          '403': {
            description: 'Forbidden for members',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/billing/summary': {
      get: {
        summary: 'Billing and quota summary',
        operationId: 'getBillingSummary',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Plan, quota, and usage' },
        },
      },
    },
    '/v1/billing/checkout': {
      post: {
        summary: 'Create Stripe Checkout session for Pro',
        operationId: 'createBillingCheckout',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Checkout URL' },
          '503': {
            description: 'Stripe not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/billing/portal': {
      post: {
        summary: 'Create Stripe Customer Portal session',
        operationId: 'createBillingPortal',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Portal URL' },
        },
      },
    },
    '/v1/billing/webhook': {
      post: {
        summary: 'Stripe webhook receiver',
        operationId: 'stripeWebhook',
        responses: {
          '201': { description: 'Acknowledged' },
          '400': {
            description: 'Invalid signature',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/connectors/slack/commands': {
      post: {
        summary: 'Slack slash command webhook',
        operationId: 'slackSlashCommand',
        responses: {
          '200': { description: 'Slack message payload' },
          '401': { description: 'Invalid signature' },
        },
      },
    },
    '/v1/connectors/slack/events': {
      post: {
        summary: 'Slack Events API (url_verification)',
        operationId: 'slackEvents',
        responses: {
          '200': { description: 'Challenge or ack' },
        },
      },
    },
    '/v1/connectors/platform': {
      get: {
        summary: 'List Lugemi Studio platform connector installers',
        operationId: 'listPlatformConnectors',
        parameters: [
          {
            name: 'category',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by category (voice, messaging, crm, …)',
          },
        ],
        responses: {
          '200': { description: 'Platform connector registry' },
        },
      },
    },
    '/v1/connectors/platform/engine': {
      get: {
        summary: 'Platform connectors engine overview',
        operationId: 'platformConnectorsEngine',
        responses: {
          '200': { description: 'Engine catalog with core Lugemi APIs' },
        },
      },
    },
    '/v1/connectors/platform/{id}': {
      get: {
        summary: 'Platform connector integration guide + SDK snippets',
        operationId: 'getPlatformConnector',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Integration guide' },
          '404': { description: 'Unknown connector' },
        },
      },
    },
    '/v1/connectors/platform/{id}/demo': {
      post: {
        summary: 'Soft-sandbox demo hook for a platform connector',
        operationId: 'demoPlatformConnector',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  source: { type: 'string' },
                  target: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Demo wiring tips + next API calls' },
          '404': { description: 'Unknown connector' },
        },
      },
    },
    '/v1/organization/members': {
      get: {
        summary: 'List organization members',
        operationId: 'listOrganizationMembers',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Members with role and profile fields' },
        },
      },
    },
    '/v1/organization/members/{id}': {
      patch: {
        summary: 'Update organization member role',
        operationId: 'updateOrganizationMemberRole',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['owner', 'admin', 'member'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated membership' },
          '403': { description: 'Forbidden for members or insufficient role' },
        },
      },
      delete: {
        summary: 'Remove organization member',
        operationId: 'removeOrganizationMember',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Removed' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/v1/organization/invites': {
      get: {
        summary: 'List organization invites',
        operationId: 'listOrganizationInvites',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Recent invites including pending' },
        },
      },
      post: {
        summary: 'Invite teammate by email',
        operationId: 'createOrganizationInvite',
        security: [{ ClerkAuth: [] }],
        description:
          'Owners and admins invite teammates to share the workspace (owner/admin/member). Branded email sends when Resend is configured; create succeeds without it. Invitee accepts by signing in with the invited email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['owner', 'admin', 'member'], default: 'member' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Invite created' },
          '200': { description: 'Invite created' },
          '403': { description: 'Forbidden for members' },
          '409': { description: 'Already a member or pending invite exists' },
        },
      },
    },
    '/v1/organization/invites/{id}': {
      delete: {
        summary: 'Revoke a pending organization invite',
        operationId: 'revokeOrganizationInvite',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invite revoked' },
          '404': { description: 'Invite not found' },
        },
      },
    },
    '/v1/admin/status': {
      get: {
        summary: 'Whether the current user is a platform admin',
        operationId: 'getAdminStatus',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: '{ admin: boolean }' } },
      },
    },
    '/v1/admin/plans': {
      get: {
        summary: 'List Lugemi plan filters for the admin console',
        operationId: 'adminListPlans',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Plan id/name pairs' },
          '403': { description: 'Not a platform admin' },
        },
      },
    },
    '/v1/admin/workspaces': {
      get: {
        summary: 'List all workspaces (platform admin)',
        operationId: 'adminListWorkspaces',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Paginated workspace directory' } },
      },
      post: {
        summary: 'Create a customer workspace (platform admin)',
        operationId: 'adminCreateWorkspace',
        security: [{ ClerkAuth: [] }],
        responses: { '201': { description: 'Created workspace' } },
      },
    },
    '/v1/admin/workspaces/analytics': {
      get: {
        summary: 'Cross-workspace usage analytics',
        operationId: 'adminWorkspaceAnalytics',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregated usage' } },
      },
    },
    '/v1/admin/workspaces/audit': {
      get: {
        summary: 'Platform admin audit log',
        operationId: 'adminPlatformAudit',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'AdminAuditEvent rows' } },
      },
    },
    '/v1/admin/workspaces/bulk': {
      post: {
        summary: 'Bulk suspend, resume, or CSV export',
        operationId: 'adminBulkWorkspaces',
        security: [{ ClerkAuth: [] }],
        responses: { '201': { description: 'Bulk result or CSV' } },
      },
    },
    '/v1/admin/workspaces/{id}': {
      get: {
        summary: 'Workspace detail for platform admin',
        operationId: 'adminGetWorkspace',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Workspace detail' } },
      },
      patch: {
        summary: 'Update workspace plan, quotas, region, or feature overrides',
        operationId: 'adminUpdateWorkspace',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated workspace' } },
      },
    },
    '/v1/admin/workspaces/{id}/suspend': {
      post: {
        summary: 'Suspend a workspace',
        operationId: 'adminSuspendWorkspace',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Suspended' } },
      },
    },
    '/v1/admin/workspaces/{id}/resume': {
      post: {
        summary: 'Resume a suspended workspace',
        operationId: 'adminResumeWorkspace',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Resumed' } },
      },
    },
    '/v1/admin/workspaces/{id}/members': {
      get: {
        summary: 'List workspace members',
        operationId: 'adminWorkspaceMembers',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Members' } },
      },
    },
    '/v1/admin/workspaces/{id}/usage': {
      get: {
        summary: 'Workspace usage summary',
        operationId: 'adminWorkspaceUsage',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Usage + quota' } },
      },
    },
    '/v1/admin/workspaces/{id}/audit': {
      get: {
        summary: 'Workspace audit snippet',
        operationId: 'adminWorkspaceAudit',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Audit events' } },
      },
    },
    '/v1/admin/workspaces/{id}/open-as': {
      post: {
        summary: 'Open as workspace (admin session org context)',
        operationId: 'adminOpenAsWorkspace',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'organizationId + workspaceId' } },
      },
    },
    '/v1/admin/workspaces/{id}/revoke-keys': {
      post: {
        summary: 'Revoke all API keys for a workspace',
        operationId: 'adminRevokeWorkspaceKeys',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '201': { description: 'Keys revoked' },
          '403': { description: 'Not a platform admin' },
        },
      },
    },
    '/v1/admin/workspaces/{id}/invites': {
      post: {
        summary: 'Invite a user to a workspace',
        operationId: 'adminInviteWorkspace',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Invite created' } },
      },
    },
    '/v1/admin/organizations': {
      get: {
        summary: 'Search organizations (platform admin)',
        operationId: 'adminSearchOrganizations',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100 } },
        ],
        responses: {
          '200': { description: 'Matching organizations' },
          '403': { description: 'Not a platform admin' },
        },
      },
    },
    '/v1/admin/organizations/{id}': {
      get: {
        summary: 'Organization detail for platform admin',
        operationId: 'adminGetOrganization',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Usage, keys, members' } },
      },
    },
    '/v1/admin/organizations/{id}/revoke-keys': {
      post: {
        summary: 'Revoke all API keys for an organization',
        operationId: 'adminRevokeOrganizationKeys',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Revoke count' } },
      },
    },
    '/v1/admin/organizations/{id}/disable': {
      post: {
        summary: 'Disable or re-enable an organization',
        operationId: 'adminDisableOrganization',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  disabled: { type: 'boolean', default: true },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Updated org' } },
      },
    },
    '/v1/organization/data-settings': {
      get: {
        summary: 'Get organization data governance settings',
        operationId: 'getDataSettings',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Retention and persistence flags' },
        },
      },
      patch: {
        summary: 'Update data governance settings',
        operationId: 'updateDataSettings',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  retentionDays: { type: 'integer', nullable: true, minimum: 1, maximum: 3650 },
                  persistSourceText: { type: 'boolean' },
                  allowVendorTraining: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated settings' },
          '403': {
            description: 'Forbidden for members',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/regions': {
      get: {
        summary: 'List residency islands (public)',
        operationId: 'listRegions',
        responses: {
          '200': {
            description:
              'Catalog of US/EU islands; each is a separate deploy + database (not a mesh)',
          },
        },
      },
    },
    '/v1/organization/residency': {
      get: {
        summary: 'Get organization data residency pin',
        operationId: 'getOrganizationResidency',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Pinned region vs current deploy' },
        },
      },
      patch: {
        summary: 'Set organization data residency pin (owner only)',
        description:
          'Pinning does not migrate data. A pin that mismatches LUGEMI_REGION yields residency_mismatch on authenticated routes.',
        operationId: 'setOrganizationResidency',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dataRegion'],
                properties: {
                  dataRegion: {
                    type: 'string',
                    nullable: true,
                    enum: ['us', 'eu'],
                    description: 'Residency island code, or null to clear the pin',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated residency' },
          '400': {
            description: 'validation_error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '403': {
            description: 'forbidden (non-owner) or residency_mismatch on wrong island',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/organization/export': {
      post: {
        summary: 'Export current workspace data (JSON)',
        operationId: 'exportOrganizationWorkspace',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Workspace export payload' },
          '403': {
            description: 'Forbidden for members',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/organization': {
      delete: {
        summary: 'Delete organization (cascade; owner only)',
        operationId: 'deleteOrganization',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['confirmName'],
                properties: {
                  confirmName: {
                    type: 'string',
                    description: 'Must exactly match the organization name',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Organization deleted' },
          '403': {
            description: 'Only owners can delete',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/voice/status': {
      get: {
        summary: 'Voice FAQ / Twilio configuration status',
        operationId: 'getVoiceStatus',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Config flags and webhook URLs' },
        },
      },
    },
    '/v1/voice/simulate': {
      post: {
        summary: 'Simulate a bilingual FAQ voice turn (text or audio)',
        operationId: 'simulateVoiceTurn',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  voice: { type: 'string' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  text: { type: 'string' },
                  voice: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'FAQ reply + audioBase64' },
          '503': { description: 'Voice agent disabled or providers missing' },
        },
      },
    },
    '/v1/voice/calls': {
      post: {
        summary: 'Place an outbound Twilio demo call',
        operationId: 'createVoiceCall',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to'],
                properties: { to: { type: 'string', description: 'E.164 phone number' } },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Call queued' },
          '503': { description: 'Twilio not configured' },
        },
      },
    },
    '/v1/voice/twilio/inbound': {
      post: {
        summary: 'Twilio inbound webhook (signed) — returns TwiML',
        operationId: 'twilioVoiceInbound',
        responses: {
          '200': { description: 'TwiML' },
          '401': { description: 'Invalid signature' },
        },
      },
    },
    '/v1/voice/twilio/turn': {
      post: {
        summary: 'Twilio recording callback — STT → FAQ → TTS → TwiML',
        operationId: 'twilioVoiceTurn',
        responses: {
          '200': { description: 'TwiML' },
          '401': { description: 'Invalid signature' },
        },
      },
    },
    '/v1/workflows': {
      get: {
        summary: 'List saved workflow definitions',
        operationId: 'listWorkflows',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Workflows for the current workspace',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Workflow' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a workflow definition',
        operationId: 'createWorkflow',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'steps'],
                properties: {
                  name: { type: 'string' },
                  steps: {
                    type: 'array',
                    description: 'transcribe (documentId), translate (source/target/text), notify (channel/message)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Workflow' } },
            },
          },
        },
      },
    },
    '/v1/workflows/{id}': {
      get: {
        summary: 'Get a workflow definition',
        operationId: 'getWorkflow',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Workflow',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Workflow' } },
            },
          },
        },
      },
      delete: {
        summary: 'Delete a workflow definition',
        operationId: 'deleteWorkflow',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/workflows/{id}/run': {
      post: {
        summary: 'Enqueue a workflow job from a saved definition',
        operationId: 'runWorkflow',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { webhookUrl: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Job queued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Job' } },
            },
          },
        },
      },
    },
    '/v1/jobs': {
      post: {
        summary: 'Create an async job (batch_translate, document_translate, or workflow)',
        operationId: 'createJob',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'input'],
                properties: {
                  type: { type: 'string', enum: ['batch_translate', 'document_translate', 'workflow'] },
                  input: {
                    type: 'object',
                    description:
                      'batch_translate: source/target/items; document_translate: documentId/source/target; workflow: steps[] (transcribe|translate|notify) or workflowId',
                  },
                  webhookUrl: {
                    type: 'string',
                    description: 'Optional HTTPS endpoint for signed job.succeeded / job.failed events',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Job queued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Job' } },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      get: {
        summary: 'List recent jobs',
        operationId: 'listJobs',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Jobs for the API key organization',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Job' },
                },
              },
            },
          },
        },
      },
    },
    '/v1/jobs/{id}': {
      get: {
        summary: 'Get job status and result',
        operationId: 'getJob',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Job',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Job' } },
            },
          },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/documents/translate': {
      post: {
        summary: 'Upload DOCX/PDF and enqueue document translation',
        operationId: 'translateDocument',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'source', 'target'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  source: { type: 'string' },
                  target: { type: 'string' },
                  webhookUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'document_translate job queued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Job' } },
            },
          },
        },
      },
    },
    '/v1/documents/{id}': {
      get: {
        summary: 'Document metadata',
        operationId: 'getDocument',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Document metadata' } },
      },
    },
    '/v1/documents/{id}/content': {
      get: {
        summary: 'Download document bytes',
        operationId: 'downloadDocument',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'File bytes' } },
      },
    },
    '/v1/knowledge/documents': {
      get: {
        summary: 'List knowledge documents',
        operationId: 'listKnowledgeDocuments',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Workspace knowledge documents' },
        },
      },
      post: {
        summary: 'Upload and embed a knowledge document',
        operationId: 'uploadKnowledgeDocument',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Document ingested (status ready or failed)' },
          '503': {
            description: 'Embeddings provider not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge/documents/{id}': {
      get: {
        summary: 'Get knowledge document',
        operationId: 'getKnowledgeDocument',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Document' }, '404': { description: 'Not found' } },
      },
      delete: {
        summary: 'Delete knowledge document',
        operationId: 'deleteKnowledgeDocument',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } },
      },
    },
    '/v1/knowledge/query': {
      post: {
        summary: 'Query knowledge base (RAG)',
        operationId: 'queryKnowledge',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: {
                  question: { type: 'string' },
                  k: { type: 'integer', minimum: 1, maximum: 10 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Answer with citations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    answer: { type: 'string' },
                    citations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          index: { type: 'integer' },
                          documentId: { type: 'string' },
                          chunkId: { type: 'string' },
                          filename: { type: 'string' },
                          snippet: { type: 'string' },
                          score: { type: 'number' },
                        },
                      },
                    },
                    model: { type: 'string', nullable: true },
                    provider: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/embeddings': {
      post: {
        summary: 'Create embeddings',
        operationId: 'createEmbeddings',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['input'],
                properties: {
                  input: {
                    oneOf: [
                      { type: 'string' },
                      { type: 'array', items: { type: 'string' }, minItems: 1 },
                    ],
                  },
                  model: {
                    type: 'string',
                    description: 'Optional model override (default text-embedding-3-small)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Embedding vectors',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    object: { type: 'string', example: 'list' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          object: { type: 'string' },
                          index: { type: 'integer' },
                          embedding: { type: 'array', items: { type: 'number' } },
                        },
                      },
                    },
                    model: { type: 'string' },
                    provider: { type: 'string' },
                    usage: {
                      type: 'object',
                      properties: {
                        prompt_tokens: { type: 'integer' },
                        total_tokens: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '503': {
            description: 'OPENAI_API_KEY not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/interpret': {
      post: {
        summary: 'Live interpreter (STT → MT → TTS)',
        operationId: 'interpretAudio',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'target', 'voice'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  target: { type: 'string', description: 'Target language code' },
                  source: {
                    type: 'string',
                    description: 'Source language or "auto" (default: STT language / auto)',
                  },
                  language: {
                    type: 'string',
                    description: 'Optional STT language hint',
                  },
                  voice: { type: 'string', example: 'alloy' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Transcript, translation, and synthesized audio',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sourceText: { type: 'string' },
                    targetText: { type: 'string' },
                    source: { type: 'string' },
                    target: { type: 'string' },
                    durationSeconds: { type: 'number' },
                    durationMinutes: { type: 'number' },
                    voice: { type: 'string' },
                    format: { type: 'string' },
                    mimeType: { type: 'string' },
                    audioBase64: { type: 'string' },
                    skippedMt: { type: 'boolean' },
                    providers: {
                      type: 'object',
                      properties: {
                        stt: { type: 'string' },
                        mt: { type: 'string', nullable: true },
                        tts: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '503': {
            description: 'Provider not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/speech/products': {
      get: {
        summary: 'Speech Cloud product catalog',
        operationId: 'listSpeechProducts',
        responses: {
          '200': {
            description: 'Speech products and architecture honesty notes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          status: { type: 'string', enum: ['shipped', 'partial', 'deferred'] },
                          api: { type: 'string', nullable: true },
                          console: { type: 'string', nullable: true },
                          notes: { type: 'string' },
                        },
                      },
                    },
                    architecture: { type: 'object' },
                    docs: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/speech/engine': {
      get: {
        summary: 'Speech Recognition Engine catalog',
        operationId: 'getSpeechEngine',
        responses: {
          '200': {
            description: 'Capabilities, engines, and deployment honesty notes',
          },
        },
      },
    },
    '/v1/speakers/engine': {
      get: {
        summary: 'Speaker Intelligence engine catalog',
        operationId: 'getSpeakerEngine',
        responses: {
          '200': {
            description: 'Speaker capabilities and honesty notes',
          },
        },
      },
    },
    '/v1/accents/engine': {
      get: {
        summary: 'Accent Intelligence engine catalog',
        operationId: 'getAccentEngine',
        responses: {
          '200': { description: 'Accent capabilities and honesty notes' },
        },
      },
    },
    '/v1/accents': {
      get: {
        summary: 'List accent catalog',
        operationId: 'listAccents',
        parameters: [
          {
            name: 'language',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by language code',
          },
        ],
        responses: { '200': { description: 'Accent rows' } },
      },
    },
    '/v1/accents/detect': {
      post: {
        summary: 'Detect spoken accent cues',
        operationId: 'detectAccent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Detected accent candidates' } },
      },
    },
    '/v1/accents/{code}': {
      get: {
        summary: 'Get accent by code',
        operationId: 'getAccent',
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Accent detail' }, '404': { description: 'Not found' } },
      },
    },
    '/v1/accents/classify': {
      post: {
        summary: 'Classify spoken accent (ranked candidates)',
        operationId: 'classifyAccent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Classification with confidence band' } },
      },
    },
    '/v1/accents/analytics': {
      get: {
        summary: 'Accent Intelligence analytics',
        operationId: 'getAccentAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org accent detect/classify usage' } },
      },
    },
    '/v1/country-packs/engine': {
      get: {
        summary: 'Country Engine catalog',
        operationId: 'getCountryEngine',
        responses: {
          '200': { description: 'Country pack capabilities and honesty notes' },
        },
      },
    },
    '/v1/country-packs': {
      get: {
        summary: 'List country packs',
        operationId: 'listCountryPacks',
        parameters: [
          {
            name: 'region',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'Country pack rows' } },
      },
    },
    '/v1/country-packs/{code}': {
      get: {
        summary: 'Get country pack',
        operationId: 'getCountryPack',
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'includeLocales',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
          },
        ],
        responses: { '200': { description: 'Country pack detail' } },
      },
    },
    '/v1/dialects/engine': {
      get: {
        summary: 'Dialect Engine catalog',
        operationId: 'getDialectEngine',
        responses: {
          '200': { description: 'Dialect capabilities and honesty notes' },
        },
      },
    },
    '/v1/dialects': {
      get: {
        summary: 'List dialects',
        operationId: 'listDialects',
        responses: { '200': { description: 'Dialect catalog' } },
      },
    },
    '/v1/dialects/detect': {
      post: {
        summary: 'Detect dialect cues',
        operationId: 'detectDialect',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Dialect candidates' } },
      },
    },
    '/v1/language/engine': {
      get: {
        summary: 'Language Cloud hub engine catalog',
        operationId: 'getLanguageCloudEngine',
        responses: {
          '200': { description: 'Language Cloud product map and honesty notes' },
        },
      },
    },
    '/v1/language/products': {
      get: {
        summary: 'Language Cloud product catalog',
        operationId: 'listLanguageProducts',
        responses: { '200': { description: 'Language Cloud products' } },
      },
    },
    '/v1/language/overview': {
      get: {
        summary: 'Language Cloud workspace overview',
        operationId: 'getLanguageOverview',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace language overview' } },
      },
    },
    '/v1/language-intelligence': {
      get: {
        summary: 'Language Intelligence catalog',
        operationId: 'getLanguageIntelligence',
        responses: {
          '200': { description: 'Language Intelligence capabilities and honesty notes' },
        },
      },
    },
    '/v1/language-intelligence/engine': {
      get: {
        summary: 'Language Intelligence engine catalog (alias)',
        operationId: 'getLanguageIntelligenceEngine',
        responses: {
          '200': { description: 'Same catalog as GET /v1/language-intelligence' },
        },
      },
    },
    '/v1/language-intelligence/analyze': {
      post: {
        summary: 'Unified language intelligence analyze',
        operationId: 'analyzeLanguageIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Detect + heuristic signals' } },
      },
    },
    '/v1/emotion/engine': {
      get: {
        summary: 'Emotion Intelligence engine catalog',
        operationId: 'getEmotionEngine',
        responses: { '200': { description: 'Emotion labels and capabilities' } },
      },
    },
    '/v1/emotion/detect': {
      post: {
        summary: 'Detect speech emotion from text or audio',
        operationId: 'detectEmotion',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Emotion label, confidence, ranked scores' } },
      },
    },
    '/v1/audio-intelligence/engine': {
      get: {
        summary: 'Audio Intelligence engine catalog',
        operationId: 'getAudioEngine',
        responses: { '200': { description: 'Noise/silence/enhance capabilities' } },
      },
    },
    '/v1/audio-intelligence/echo': {
      get: {
        summary: 'Echo cancellation status (deferred)',
        operationId: 'getAudioEchoStatus',
        responses: { '200': { description: 'AEC deferred status' } },
      },
    },
    '/v1/audio-intelligence/analyze': {
      post: {
        summary: 'Analyze audio for noise and silence',
        operationId: 'analyzeAudioIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Noise/silence metrics' } },
      },
    },
    '/v1/audio-intelligence/silence': {
      post: {
        summary: 'Detect silence regions',
        operationId: 'detectAudioSilence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Silence regions' } },
      },
    },
    '/v1/audio-intelligence/enhance': {
      post: {
        summary: 'Enhance audio (noise gate)',
        operationId: 'enhanceAudioIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Enhanced WAV base64' } },
      },
    },
    '/v1/audio-intelligence/upscale': {
      post: {
        summary: 'Upscale audio sample rate (linear)',
        operationId: 'upscaleAudioIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Upsampled WAV base64' } },
      },
    },
    '/v1/audio-intelligence/isolate': {
      post: {
        summary: 'Isolate voice via energy VAD',
        operationId: 'isolateAudioVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Isolated WAV base64' } },
      },
    },
    '/v1/audio-intelligence/analyze/stream': {
      post: {
        summary: 'Stream audio analysis progress (SSE)',
        operationId: 'streamAudioAnalyze',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'SSE analysis events' } },
      },
    },
    '/v1/audio-intelligence/analytics': {
      get: {
        summary: 'Audio Intelligence analytics',
        operationId: 'getAudioIntelligenceAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org audit-derived usage' } },
      },
    },
    '/v1/pronunciation/engine': {
      get: {
        summary: 'Pronunciation Intelligence engine catalog',
        operationId: 'getPronunciationEngine',
        responses: { '200': { description: 'Assessment capabilities' } },
      },
    },
    '/v1/pronunciation/assess': {
      post: {
        summary: 'Assess pronunciation vs reference',
        operationId: 'assessPronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Scores, alignment, coaching' } },
      },
    },
    '/v1/pronunciation/score': {
      post: {
        summary: 'Pronunciation scores only',
        operationId: 'scorePronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Overall/accuracy/fluency/stress' } },
      },
    },
    '/v1/pronunciation/coach': {
      post: {
        summary: 'Accent/pronunciation coaching tips',
        operationId: 'coachPronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Coaching tips + scores' } },
      },
    },
    '/v1/pronunciation/phonemes': {
      post: {
        summary: 'Approximate phonemes and word stress',
        operationId: 'pronunciationPhonemes',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Grapheme/dictionary phonemes' } },
      },
    },
    '/v1/pronunciation/fluency': {
      post: {
        summary: 'Sentence fluency from audio',
        operationId: 'pronunciationFluency',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Speaking rate + silence proxies' } },
      },
    },
    '/v1/pronunciation/assess/stream': {
      post: {
        summary: 'Stream pronunciation assessment (SSE)',
        operationId: 'streamPronunciationAssess',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'SSE assessment events' } },
      },
    },
    '/v1/pronunciation/analytics': {
      get: {
        summary: 'Pronunciation Intelligence analytics',
        operationId: 'getPronunciationAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org audit-derived usage' } },
      },
    },
    '/v1/wake-word/engine': {
      get: {
        summary: 'Wake Word engine catalog',
        operationId: 'getWakeWordEngine',
        responses: { '200': { description: 'Wake/keyword capabilities' } },
      },
    },
    '/v1/wake-word/keywords': {
      get: {
        summary: 'List custom wake/keyword/trigger phrases',
        operationId: 'listWakeKeywords',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace phrases' } },
      },
      post: {
        summary: 'Add custom wake/keyword/trigger phrase',
        operationId: 'addWakeKeyword',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created phrase' } },
      },
    },
    '/v1/wake-word/detect': {
      post: {
        summary: 'Detect wake words in text or audio',
        operationId: 'detectWakeWord',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Wake detection hits' } },
      },
    },
    '/v1/wake-word/spot': {
      post: {
        summary: 'Spot keywords in text or audio',
        operationId: 'spotWakeKeywords',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Keyword hits' } },
      },
    },
    '/v1/wake-word/triggers': {
      post: {
        summary: 'Evaluate enterprise trigger phrases',
        operationId: 'evaluateWakeTriggers',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Fired triggers' } },
      },
    },
    '/v1/wake-word/detect/stream': {
      post: {
        summary: 'Stream wake detection (SSE)',
        operationId: 'streamWakeDetect',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'SSE wake events' } },
      },
    },
    '/v1/wake-word/analytics': {
      get: {
        summary: 'Wake Word analytics',
        operationId: 'getWakeWordAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org audit-derived usage' } },
      },
    },
    '/v1/call-intelligence/engine': {
      get: {
        summary: 'Call Intelligence engine catalog',
        operationId: 'getCallIntelligenceEngine',
        responses: { '200': { description: 'Call analytics capabilities' } },
      },
    },
    '/v1/call-intelligence/calls': {
      get: {
        summary: 'List call records',
        operationId: 'listCallRecords',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace calls' } },
      },
      post: {
        summary: 'Ingest call (transcript and/or recording)',
        operationId: 'createCallRecord',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created call with optional analysis' } },
      },
    },
    '/v1/call-intelligence/calls/{id}/analyze': {
      post: {
        summary: 'Analyze an existing call',
        operationId: 'analyzeCallRecord',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Updated call analysis' } },
      },
    },
    '/v1/call-intelligence/report': {
      get: {
        summary: 'Call Intelligence workspace report',
        operationId: 'getCallIntelligenceReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregated call metrics' } },
      },
    },
    '/v1/call-intelligence/analytics': {
      get: {
        summary: 'Call Intelligence analytics',
        operationId: 'getCallIntelligenceAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org audit-derived usage' } },
      },
    },
    '/v1/call-intelligence/analyze/stream': {
      post: {
        summary: 'Stream call ingest/analyze (SSE)',
        operationId: 'streamCallAnalyze',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'SSE call events' } },
      },
    },
    '/v1/speech-analytics/engine': {
      get: {
        summary: 'Speech Analytics engine catalog',
        operationId: 'getSpeechAnalyticsEngine',
        responses: { '200': { description: 'Speech analytics capabilities' } },
      },
    },
    '/v1/speech-analytics/overview': {
      get: {
        summary: 'Speech Analytics overview',
        operationId: 'getSpeechAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Usage + cost snapshot' } },
      },
    },
    '/v1/speech-analytics/usage': {
      get: {
        summary: 'Speech STT/TTS usage',
        operationId: 'getSpeechAnalyticsUsage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'STT/TTS usage aggregates' } },
      },
    },
    '/v1/speech-analytics/report': {
      get: {
        summary: 'Bundled Speech Analytics report',
        operationId: 'getSpeechAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Enterprise speech report JSON' } },
      },
    },
    '/v1/speech-analytics/monitoring': {
      get: {
        summary: 'Speech Analytics monitoring snapshot',
        operationId: 'getSpeechAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/speakers/profiles': {
      get: {
        summary: 'List speaker profiles',
        operationId: 'listSpeakerProfiles',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace speaker profiles' } },
      },
      post: {
        summary: 'Create speaker profile',
        operationId: 'createSpeakerProfile',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created profile' } },
      },
    },
    '/v1/speakers/verify': {
      post: {
        summary: 'Verify speaker (1:1)',
        operationId: 'verifySpeaker',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Match score and decision' } },
      },
    },
    '/v1/speakers/identify': {
      post: {
        summary: 'Identify speaker (1:N)',
        operationId: 'identifySpeaker',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Top candidates and decision' } },
      },
    },
    '/v1/speakers/diarize': {
      post: {
        summary: 'Diarize speakers (gap-based over Whisper segments)',
        operationId: 'diarizeSpeech',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Speaker turns and labels' } },
      },
    },
    '/v1/speech/recognize': {
      post: {
        summary: 'Recognize speech (batch STT with segments)',
        operationId: 'recognizeSpeech',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  language: { type: 'string', description: 'Optional ISO-639-1; omit to auto-detect' },
                  industryPacks: {
                    type: 'string',
                    description: 'Comma-separated: medical,legal,financial,government',
                  },
                  vocabulary: { type: 'string', description: 'Comma-separated custom phrases' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Transcript with segments, timestamps, confidence' },
        },
      },
    },
    '/v1/speech/stream': {
      post: {
        summary: 'Stream speech recognition events (SSE segment stream)',
        operationId: 'streamSpeechRecognition',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  language: { type: 'string' },
                  industryPacks: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'text/event-stream with start, segment, done events',
          },
        },
      },
    },
    '/v1/speech/subtitles': {
      post: {
        summary: 'Generate SRT or WebVTT subtitles from audio',
        operationId: 'createSpeechSubtitles',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Subtitle file content + metadata' },
        },
      },
    },
    '/v1/speech/overview': {
      get: {
        summary: 'Speech Cloud org overview',
        operationId: 'getSpeechOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session usage, products, deferred flags, and console links',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/voice-cloud/products': {
      get: {
        summary: 'Voice Cloud product catalog',
        operationId: 'listVoiceProducts',
        responses: {
          '200': {
            description: 'Voice products and architecture honesty notes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          status: { type: 'string', enum: ['shipped', 'partial', 'deferred'] },
                          api: { type: 'string', nullable: true },
                          console: { type: 'string', nullable: true },
                          notes: { type: 'string' },
                        },
                      },
                    },
                    architecture: { type: 'object' },
                    docs: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/voice-cloud/overview': {
      get: {
        summary: 'Voice Cloud org overview',
        operationId: 'getVoiceOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session TTS usage, products, deferred flags, and console links',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/intelligence-cloud/products': {
      get: {
        summary: 'Intelligence Cloud product catalog',
        operationId: 'listIntelligenceProducts',
        responses: {
          '200': {
            description: 'Intelligence products and architecture honesty notes',
          },
        },
      },
    },
    '/v1/intelligence-cloud/overview': {
      get: {
        summary: 'Intelligence Cloud org overview',
        operationId: 'getIntelligenceOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session chat/embeddings usage, products, deferred flags, and console links',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-cloud/products': {
      get: {
        summary: 'Knowledge Cloud product catalog',
        operationId: 'listKnowledgeProducts',
        responses: {
          '200': {
            description: 'Knowledge products and architecture honesty notes',
          },
        },
      },
    },
    '/v1/knowledge-cloud/overview': {
      get: {
        summary: 'Knowledge Cloud org overview',
        operationId: 'getKnowledgeOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session knowledge doc/chunk counts, products, deferred flags, and console links',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/inference-cloud/products': {
      get: {
        summary: 'Inference Cloud product catalog',
        operationId: 'listInferenceProducts',
        responses: {
          '200': {
            description: 'Inference products and architecture honesty notes',
          },
        },
      },
    },
    '/v1/ai-kernel/products': {
      get: {
        summary: 'AI Kernel runtime catalog',
        operationId: 'listAiKernelRuntimes',
        responses: {
          '200': {
            description: 'Internal kernel runtimes, architecture, and safety notes',
          },
        },
      },
    },
    '/v1/ai-kernel/engine': {
      get: {
        summary: 'AI Kernel engine (alias of products)',
        operationId: 'getAiKernelEngine',
        responses: {
          '200': { description: 'Kernel catalog + honesty' },
        },
      },
    },
    '/v1/ai-kernel/overview': {
      get: {
        summary: 'AI Kernel org overview',
        operationId: 'getAiKernelOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session usage, deferred runtimes, safety notes',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ai-kernel/monitoring': {
      get: {
        summary: 'AI Kernel foundation monitoring',
        operationId: 'getAiKernelMonitoring',
        responses: {
          '200': { description: 'Runtime status snapshot + safety honesty' },
        },
      },
    },
    '/v1/foundation-model-cloud/products': {
      get: {
        summary: 'Foundation Model Cloud product catalog',
        operationId: 'listFoundationModelCloudProducts',
        responses: {
          '200': {
            description:
              'Model-family catalog, architecture, and honesty (no trained competitive weights)',
          },
        },
      },
    },
    '/v1/foundation-model-cloud/engine': {
      get: {
        summary: 'Foundation Model Cloud engine (alias of products)',
        operationId: 'getFoundationModelCloudEngine',
        responses: {
          '200': { description: 'FMC catalog + honesty' },
        },
      },
    },
    '/v1/foundation-model-cloud/overview': {
      get: {
        summary: 'Foundation Model Cloud org overview',
        operationId: 'getFoundationModelCloudOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session usage, deferred model families, honesty notes',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/foundation-model-cloud/monitoring': {
      get: {
        summary: 'Foundation Model Cloud foundation monitoring',
        operationId: 'getFoundationModelCloudMonitoring',
        responses: {
          '200': { description: 'Product status snapshot + honesty' },
        },
      },
    },
    '/v1/model-training-platform/engine': {
      get: {
        summary: 'Model Training Platform engine catalog',
        operationId: 'getModelTrainingPlatformEngine',
        responses: {
          '200': {
            description:
              'Training methods, ceilings, launchers, honesty (no distributed/RLHF lab)',
          },
        },
      },
    },
    '/v1/model-training-platform/methods': {
      get: {
        summary: 'Model Training Platform methods',
        operationId: 'listModelTrainingMethods',
        responses: {
          '200': { description: 'LoRA/instruction launchable; RLHF/DPO deferred' },
        },
      },
    },
    '/v1/model-training-platform/overview': {
      get: {
        summary: 'Model Training Platform org overview',
        operationId: 'getModelTrainingPlatformOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, experiments, deferred methods' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-training-platform/experiments': {
      get: {
        summary: 'List training experiment plans',
        operationId: 'listModelTrainingExperiments',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Org-scoped sandbox experiments' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create training experiment plan',
        operationId: 'createModelTrainingExperiment',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Experiment plan created' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-training-platform/monitoring': {
      get: {
        summary: 'Model Training Platform monitoring',
        operationId: 'getModelTrainingPlatformMonitoring',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Experiment status snapshot + honesty' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/engine': {
      get: {
        summary: 'Model Evaluation Platform engine catalog',
        operationId: 'getModelEvaluationPlatformEngine',
        responses: {
          '200': {
            description:
              'Eval suites, ceilings, coverage link, honesty (no global leaderboard/SOTA)',
          },
        },
      },
    },
    '/v1/model-evaluation-platform/suites': {
      get: {
        summary: 'Model Evaluation Platform suites',
        operationId: 'listModelEvaluationSuites',
        responses: {
          '200': {
            description: 'Translation/bias/safety/latency runnable; MMLU/HumanEval deferred',
          },
        },
      },
    },
    '/v1/model-evaluation-platform/overview': {
      get: {
        summary: 'Model Evaluation Platform org overview',
        operationId: 'getModelEvaluationPlatformOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, runs, deferred suites' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/runs': {
      get: {
        summary: 'List evaluation runs',
        operationId: 'listModelEvaluationRuns',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Org-scoped sandbox/handoff runs' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create evaluation run',
        operationId: 'createModelEvaluationRun',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Run created (and executed unless execute=false)' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/leaderboard': {
      get: {
        summary: 'Org-scoped evaluation leaderboard',
        operationId: 'getModelEvaluationLeaderboard',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Local ranks only — not public SOTA board' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/reports': {
      get: {
        summary: 'Evaluation reports aggregate',
        operationId: 'getModelEvaluationReports',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Run aggregates + coverage snapshot' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/monitoring': {
      get: {
        summary: 'Model Evaluation Platform monitoring',
        operationId: 'getModelEvaluationPlatformMonitoring',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Run status snapshot + honesty' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-registry/engine': {
      get: {
        summary: 'Model Registry hub engine',
        operationId: 'getModelRegistryEngine',
        responses: {
          '200': {
            description:
              'Cards/versions/deploy capabilities + live summary (not MLflow/mesh OS)',
          },
        },
      },
    },
    '/v1/model-registry/capabilities': {
      get: {
        summary: 'Model Registry capabilities',
        operationId: 'listModelRegistryCapabilities',
        responses: {
          '200': { description: 'Registry governance capabilities + honesty' },
        },
      },
    },
    '/v1/model-registry/cards': {
      get: {
        summary: 'Model cards from registry entries',
        operationId: 'listModelRegistryCards',
        responses: {
          '200': { description: 'Lightweight cards derived from registry metadata' },
        },
      },
    },
    '/v1/model-registry/overview': {
      get: {
        summary: 'Model Registry org overview',
        operationId: 'getModelRegistryOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, versions, deployments' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-registry/versions': {
      get: {
        summary: 'List sandbox model versions',
        operationId: 'listModelRegistryVersions',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Org-scoped sandbox versions' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create sandbox model version',
        operationId: 'createModelRegistryVersion',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Version created' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-registry/deployments': {
      get: {
        summary: 'List sandbox deployment plans',
        operationId: 'listModelRegistryDeployments',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Org-scoped deploy plans' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create sandbox deployment plan',
        operationId: 'createModelRegistryDeployment',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Deploy plan + Model Serving handoff' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-registry/monitoring': {
      get: {
        summary: 'Model Registry monitoring',
        operationId: 'getModelRegistryMonitoring',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Version/deploy status snapshot + honesty' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/atlas/engine': {
      get: {
        summary: 'Atlas family scaffold engine',
        operationId: 'getAtlasEngine',
        responses: {
          '200': {
            description:
              'Atlas capability map + honesty (scaffold only — no trained weights)',
          },
        },
      },
    },
    '/v1/atlas/capabilities': {
      get: {
        summary: 'Atlas capabilities',
        operationId: 'listAtlasCapabilities',
        responses: {
          '200': { description: 'Reasoning/planning handoffs; specialists deferred' },
        },
      },
    },
    '/v1/atlas/overview': {
      get: {
        summary: 'Atlas org overview',
        operationId: 'getAtlasOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, deferred specialists, links' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/atlas/monitoring': {
      get: {
        summary: 'Atlas scaffold monitoring',
        operationId: 'getAtlasMonitoring',
        responses: {
          '200': { description: 'Capability status snapshot + honesty' },
        },
      },
    },
    '/v1/ai-fabric/products': {
      get: {
        summary: 'AI Fabric bus catalog',
        operationId: 'listAiFabricBuses',
        responses: {
          '200': {
            description:
              'Internal fabric buses, architecture, and policy hard-gate honesty',
          },
        },
      },
    },
    '/v1/ai-fabric/engine': {
      get: {
        summary: 'AI Fabric engine (alias of products)',
        operationId: 'getAiFabricEngine',
        responses: {
          '200': { description: 'Fabric catalog + honesty' },
        },
      },
    },
    '/v1/ai-fabric/routing': {
      get: {
        summary: 'AI Fabric service-discovery routing table',
        operationId: 'getAiFabricRouting',
        responses: {
          '200': { description: 'Static cloud/runtime route catalog' },
        },
      },
    },
    '/v1/ai-fabric/overview': {
      get: {
        summary: 'AI Fabric org overview',
        operationId: 'getAiFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, deferred buses, safety notes' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ai-fabric/monitoring': {
      get: {
        summary: 'AI Fabric foundation monitoring',
        operationId: 'getAiFabricMonitoring',
        responses: {
          '200': { description: 'Bus status snapshot + honesty' },
        },
      },
    },
    '/v1/ecosystem-cloud/products': {
      get: {
        summary: 'Ecosystem Cloud product catalog',
        operationId: 'listEcosystemCloudProducts',
        responses: {
          '200': {
            description:
              'Marketplace/monetization hub catalog, honesty, Stripe safety, deferred marketplaces',
          },
        },
      },
    },
    '/v1/ecosystem-cloud/engine': {
      get: {
        summary: 'Ecosystem Cloud engine (alias of products)',
        operationId: 'getEcosystemCloudEngine',
        responses: {
          '200': { description: 'Ecosystem catalog + honesty' },
        },
      },
    },
    '/v1/ecosystem-cloud/routing': {
      get: {
        summary: 'Ecosystem Cloud marketplace routing table',
        operationId: 'getEcosystemCloudRouting',
        responses: {
          '200': { description: 'Static marketplace/monetization route catalog' },
        },
      },
    },
    '/v1/ecosystem-cloud/overview': {
      get: {
        summary: 'Ecosystem Cloud org overview',
        operationId: 'getEcosystemCloudOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, deferred marketplaces, real-money safety notes' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ecosystem-cloud/monitoring': {
      get: {
        summary: 'Ecosystem Cloud foundation monitoring',
        operationId: 'getEcosystemCloudMonitoring',
        responses: {
          '200': { description: 'Product status snapshot + honesty' },
        },
      },
    },
    '/v1/plugin-marketplace/engine': {
      get: {
        summary: 'Plugin Marketplace engine catalog',
        operationId: 'getPluginMarketplaceEngine',
        responses: {
          '200': {
            description:
              'Plugin marketplace capabilities, sandbox/Policy honesty, deferred monetization depth',
          },
        },
      },
    },
    '/v1/plugin-marketplace/products': {
      get: {
        summary: 'Plugin Marketplace products (alias of engine)',
        operationId: 'listPluginMarketplaceProducts',
        responses: {
          '200': { description: 'Plugin marketplace catalog + honesty' },
        },
      },
    },
    '/v1/plugin-marketplace/listings': {
      get: {
        summary: 'List plugin marketplace listings',
        operationId: 'listPluginMarketplaceListings',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Published or mine plugin listings' },
        },
      },
      post: {
        summary: 'Publish a Plugin Runtime plugin as a marketplace listing',
        operationId: 'publishPluginMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Listing created' },
        },
      },
    },
    '/v1/plugin-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a plugin listing into Plugin Runtime (sandboxed)',
        operationId: 'installPluginMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Installed sandboxed plugin' },
          '403': { description: 'Policy/sandbox deny' },
        },
      },
    },
    '/v1/plugin-marketplace/listings/{id}/run': {
      post: {
        summary: 'Run an installed marketplace plugin (Policy-gated sandbox invoke)',
        operationId: 'runPluginMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sandbox invoke result' },
          '403': { description: 'Policy deny or not installed' },
        },
      },
    },
    '/v1/plugin-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List plugin listing reviews',
        operationId: 'listPluginMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Upsert a plugin listing review',
        operationId: 'reviewPluginMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Review saved' } },
      },
    },
    '/v1/plugin-marketplace/analytics': {
      get: {
        summary: 'Plugin marketplace analytics',
        operationId: 'getPluginMarketplaceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/plugin-marketplace/monitoring': {
      get: {
        summary: 'Plugin marketplace monitoring',
        operationId: 'getPluginMarketplaceMonitoring',
        responses: { '200': { description: 'Capability status snapshot' } },
      },
    },
    '/v1/model-marketplace/engine': {
      get: {
        summary: 'Model Marketplace engine catalog',
        operationId: 'getModelMarketplaceEngine',
        responses: {
          '200': {
            description:
              'Model marketplace capabilities, Stripe honesty, public model-hub / weight-hosting denials',
          },
        },
      },
    },
    '/v1/model-marketplace/products': {
      get: {
        summary: 'Model Marketplace products (alias of engine)',
        operationId: 'listModelMarketplaceProducts',
        responses: { '200': { description: 'Model marketplace catalog + honesty' } },
      },
    },
    '/v1/model-marketplace/listings': {
      get: {
        summary: 'List model marketplace listings',
        operationId: 'listModelMarketplaceListings',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Published or mine model listings' } },
      },
      post: {
        summary: 'Publish a Model Registry card as a marketplace listing',
        operationId: 'publishModelMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '201': { description: 'Listing created' } },
      },
    },
    '/v1/model-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a model listing license entitlement',
        operationId: 'installModelMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'License entitlement installed' },
          '403': { description: 'Policy deny' },
        },
      },
    },
    '/v1/model-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List model listing reviews',
        operationId: 'listModelMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Upsert a model listing review',
        operationId: 'reviewModelMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Review saved' } },
      },
    },
    '/v1/model-marketplace/sales': {
      get: {
        summary: 'Model marketplace publisher sales',
        operationId: 'listModelMarketplaceSales',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Sale receipts + fee honesty' } },
      },
    },
    '/v1/model-marketplace/analytics': {
      get: {
        summary: 'Model marketplace analytics',
        operationId: 'getModelMarketplaceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/model-marketplace/monitoring': {
      get: {
        summary: 'Model marketplace monitoring',
        operationId: 'getModelMarketplaceMonitoring',
        responses: { '200': { description: 'Capability status snapshot' } },
      },
    },
    '/v1/dataset-marketplace/engine': {
      get: {
        summary: 'Dataset Marketplace engine catalog',
        operationId: 'getDatasetMarketplaceEngine',
        responses: {
          '200': {
            description:
              'Dataset marketplace capabilities, Stripe honesty, Label Studio / Dataset Cloud denials',
          },
        },
      },
    },
    '/v1/dataset-marketplace/products': {
      get: {
        summary: 'Dataset Marketplace products (alias of engine)',
        operationId: 'listDatasetMarketplaceProducts',
        responses: { '200': { description: 'Dataset marketplace catalog + honesty' } },
      },
    },
    '/v1/dataset-marketplace/listings': {
      get: {
        summary: 'List dataset marketplace listings',
        operationId: 'listDatasetMarketplaceListings',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Published or mine dataset listings' } },
      },
      post: {
        summary: 'Publish a TM corpus or DatasetAsset as a marketplace listing',
        operationId: 'publishDatasetMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '201': { description: 'Listing created' } },
      },
    },
    '/v1/dataset-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a dataset listing (TM copy or asset entitlement)',
        operationId: 'installDatasetMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Dataset installed / entitlement granted' },
          '403': { description: 'Policy deny' },
        },
      },
    },
    '/v1/dataset-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List dataset listing reviews',
        operationId: 'listDatasetMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Upsert a dataset listing review',
        operationId: 'reviewDatasetMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Review saved' } },
      },
    },
    '/v1/dataset-marketplace/sales': {
      get: {
        summary: 'Dataset marketplace publisher sales',
        operationId: 'listDatasetMarketplaceSales',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Sale receipts + fee honesty' } },
      },
    },
    '/v1/dataset-marketplace/analytics': {
      get: {
        summary: 'Dataset marketplace analytics',
        operationId: 'getDatasetMarketplaceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/dataset-marketplace/monitoring': {
      get: {
        summary: 'Dataset marketplace monitoring',
        operationId: 'getDatasetMarketplaceMonitoring',
        responses: { '200': { description: 'Capability status snapshot' } },
      },
    },
    '/v1/prompt-marketplace/engine': {
      get: {
        summary: 'Prompt Marketplace engine catalog',
        operationId: 'getPromptMarketplaceEngine',
        responses: {
          '200': {
            description:
              'Prompt marketplace capabilities, Stripe honesty, prompt-mesh / auto-prompt research denials',
          },
        },
      },
    },
    '/v1/prompt-marketplace/products': {
      get: {
        summary: 'Prompt Marketplace products (alias of engine)',
        operationId: 'listPromptMarketplaceProducts',
        responses: { '200': { description: 'Prompt marketplace catalog + honesty' } },
      },
    },
    '/v1/prompt-marketplace/listings': {
      get: {
        summary: 'List prompt marketplace listings',
        operationId: 'listPromptMarketplaceListings',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Published or mine prompt listings' } },
      },
      post: {
        summary: 'Publish managed prompts as a marketplace listing',
        operationId: 'publishPromptMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '201': { description: 'Listing created' } },
      },
    },
    '/v1/prompt-marketplace/listings/{id}/test': {
      post: {
        summary: 'Dry-run validate a prompt listing snapshot',
        operationId: 'testPromptMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Dry-run test results' } },
      },
    },
    '/v1/prompt-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a prompt listing into the buyer workspace',
        operationId: 'installPromptMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Prompt versions installed' },
          '403': { description: 'Policy deny' },
        },
      },
    },
    '/v1/prompt-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List prompt listing reviews',
        operationId: 'listPromptMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Upsert a prompt listing review',
        operationId: 'reviewPromptMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Review saved' } },
      },
    },
    '/v1/prompt-marketplace/sales': {
      get: {
        summary: 'Prompt marketplace publisher sales',
        operationId: 'listPromptMarketplaceSales',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Sale receipts + fee honesty' } },
      },
    },
    '/v1/prompt-marketplace/analytics': {
      get: {
        summary: 'Prompt marketplace analytics',
        operationId: 'getPromptMarketplaceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/prompt-marketplace/monitoring': {
      get: {
        summary: 'Prompt marketplace monitoring',
        operationId: 'getPromptMarketplaceMonitoring',
        responses: { '200': { description: 'Capability status snapshot' } },
      },
    },
    '/v1/agent-marketplace/engine': {
      get: {
        summary: 'Agent Marketplace engine catalog',
        operationId: 'getAgentMarketplaceEngine',
        responses: {
          '200': {
            description:
              'Agent marketplace capabilities, Stripe honesty, sandbox + Policy hard-gate denials',
          },
        },
      },
    },
    '/v1/agent-marketplace/products': {
      get: {
        summary: 'Agent Marketplace products (alias of engine)',
        operationId: 'listAgentMarketplaceProducts',
        responses: { '200': { description: 'Agent marketplace catalog + honesty' } },
      },
    },
    '/v1/agent-marketplace/listings': {
      get: {
        summary: 'List agent marketplace listings',
        operationId: 'listAgentMarketplaceListings',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Published or mine agent listings' } },
      },
      post: {
        summary: 'Publish an Agent Runtime agent as a marketplace listing',
        operationId: 'publishAgentMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '201': { description: 'Listing created' } },
      },
    },
    '/v1/agent-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install an agent listing into Agent Runtime (sandboxed)',
        operationId: 'installAgentMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sandboxed agent installed' },
          '403': { description: 'Policy deny' },
        },
      },
    },
    '/v1/agent-marketplace/listings/{id}/run': {
      post: {
        summary: 'Run an installed marketplace agent (Policy-gated sandbox)',
        operationId: 'runAgentMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sandbox run result (may be denied)' },
          '403': { description: 'Not installed or policy deny' },
        },
      },
    },
    '/v1/agent-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List agent listing reviews',
        operationId: 'listAgentMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Upsert an agent listing review',
        operationId: 'reviewAgentMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Review saved' } },
      },
    },
    '/v1/agent-marketplace/sales': {
      get: {
        summary: 'Agent marketplace publisher sales',
        operationId: 'listAgentMarketplaceSales',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Sale receipts + fee honesty' } },
      },
    },
    '/v1/agent-marketplace/analytics': {
      get: {
        summary: 'Agent marketplace analytics',
        operationId: 'getAgentMarketplaceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/agent-marketplace/monitoring': {
      get: {
        summary: 'Agent marketplace monitoring',
        operationId: 'getAgentMarketplaceMonitoring',
        responses: { '200': { description: 'Capability status snapshot' } },
      },
    },
    '/v1/workflow-marketplace/engine': {
      get: {
        summary: 'Workflow Marketplace engine catalog',
        operationId: 'getWorkflowMarketplaceEngine',
        responses: {
          '200': {
            description:
              'Workflow marketplace capabilities, Stripe honesty, sandbox + Policy hard-gate denials',
          },
        },
      },
    },
    '/v1/workflow-marketplace/products': {
      get: {
        summary: 'Workflow Marketplace products (alias of engine)',
        operationId: 'listWorkflowMarketplaceProducts',
        responses: { '200': { description: 'Workflow marketplace catalog + honesty' } },
      },
    },
    '/v1/workflow-marketplace/listings': {
      get: {
        summary: 'List workflow marketplace listings',
        operationId: 'listWorkflowMarketplaceListings',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Published or mine workflow listings' } },
      },
      post: {
        summary: 'Publish a Workflow Runtime definition as a marketplace listing',
        operationId: 'publishWorkflowMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '201': { description: 'Listing created' } },
      },
    },
    '/v1/workflow-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a workflow listing into Workflow Runtime (sandboxed)',
        operationId: 'installWorkflowMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sandboxed workflow installed' },
          '403': { description: 'Policy deny' },
        },
      },
    },
    '/v1/workflow-marketplace/listings/{id}/run': {
      post: {
        summary: 'Run an installed marketplace workflow (Policy-gated sandbox)',
        operationId: 'runWorkflowMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sandbox run result (may be denied)' },
          '403': { description: 'Not installed or policy deny' },
        },
      },
    },
    '/v1/workflow-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List workflow listing reviews',
        operationId: 'listWorkflowMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Upsert a workflow listing review',
        operationId: 'reviewWorkflowMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Review saved' } },
      },
    },
    '/v1/workflow-marketplace/sales': {
      get: {
        summary: 'Workflow marketplace publisher sales',
        operationId: 'listWorkflowMarketplaceSales',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Sale receipts + fee honesty' } },
      },
    },
    '/v1/workflow-marketplace/analytics': {
      get: {
        summary: 'Workflow marketplace analytics',
        operationId: 'getWorkflowMarketplaceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/workflow-marketplace/monitoring': {
      get: {
        summary: 'Workflow marketplace monitoring',
        operationId: 'getWorkflowMarketplaceMonitoring',
        responses: { '200': { description: 'Capability status snapshot' } },
      },
    },
    '/v1/connector-marketplace/engine': {
      get: {
        summary: 'Connector Marketplace engine catalog',
        operationId: 'getConnectorMarketplaceEngine',
        responses: {
          '200': {
            description:
              'Connector marketplace capabilities, Stripe honesty, iPaaS / live-outbound denials',
          },
        },
      },
    },
    '/v1/connector-marketplace/products': {
      get: {
        summary: 'Connector Marketplace products (alias of engine)',
        operationId: 'listConnectorMarketplaceProducts',
        responses: { '200': { description: 'Connector marketplace catalog + honesty' } },
      },
    },
    '/v1/connector-marketplace/listings': {
      get: {
        summary: 'List connector marketplace listings',
        operationId: 'listConnectorMarketplaceListings',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Published or mine connector listings' } },
      },
      post: {
        summary: 'Publish a connector catalog key as a marketplace listing',
        operationId: 'publishConnectorMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '201': { description: 'Listing created' } },
      },
    },
    '/v1/connector-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a connector listing entitlement',
        operationId: 'installConnectorMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Connector entitlement installed' },
          '403': { description: 'Policy deny' },
        },
      },
    },
    '/v1/connector-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List connector listing reviews',
        operationId: 'listConnectorMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Upsert a connector listing review',
        operationId: 'reviewConnectorMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Review saved' } },
      },
    },
    '/v1/connector-marketplace/sales': {
      get: {
        summary: 'Connector marketplace publisher sales',
        operationId: 'listConnectorMarketplaceSales',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Sale receipts + fee honesty' } },
      },
    },
    '/v1/connector-marketplace/analytics': {
      get: {
        summary: 'Connector marketplace analytics',
        operationId: 'getConnectorMarketplaceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/connector-marketplace/monitoring': {
      get: {
        summary: 'Connector marketplace monitoring',
        operationId: 'getConnectorMarketplaceMonitoring',
        responses: { '200': { description: 'Capability status snapshot' } },
      },
    },
    '/v1/voice-language-marketplace/engine': {
      get: {
        summary: 'Voice & Language Marketplace engine catalog',
        operationId: 'getVoiceLanguageMarketplaceEngine',
        responses: {
          '200': {
            description:
              'Voice/language pack capabilities, Stripe honesty, third-party TTS / celebrity / CDN denials',
          },
        },
      },
    },
    '/v1/voice-language-marketplace/products': {
      get: {
        summary: 'Voice & Language Marketplace products (alias of engine)',
        operationId: 'listVoiceLanguageMarketplaceProducts',
        responses: { '200': { description: 'Voice/language marketplace catalog + honesty' } },
      },
    },
    '/v1/voice-language-marketplace/listings': {
      get: {
        summary: 'List voice/language marketplace listings',
        operationId: 'listVoiceLanguageMarketplaceListings',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Published or mine pack listings' } },
      },
      post: {
        summary: 'Publish a voice/language pack catalog key as a marketplace listing',
        operationId: 'publishVoiceLanguageMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '201': { description: 'Listing created' } },
      },
    },
    '/v1/voice-language-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a voice/language pack listing entitlement',
        operationId: 'installVoiceLanguageMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Pack entitlement installed' },
          '403': { description: 'Policy deny' },
        },
      },
    },
    '/v1/voice-language-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List voice/language listing reviews',
        operationId: 'listVoiceLanguageMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Upsert a voice/language listing review',
        operationId: 'reviewVoiceLanguageMarketplaceListing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Review saved' } },
      },
    },
    '/v1/voice-language-marketplace/sales': {
      get: {
        summary: 'Voice/language marketplace publisher sales',
        operationId: 'listVoiceLanguageMarketplaceSales',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Sale receipts + fee honesty' } },
      },
    },
    '/v1/voice-language-marketplace/analytics': {
      get: {
        summary: 'Voice/language marketplace analytics',
        operationId: 'getVoiceLanguageMarketplaceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/voice-language-marketplace/monitoring': {
      get: {
        summary: 'Voice/language marketplace monitoring',
        operationId: 'getVoiceLanguageMarketplaceMonitoring',
        responses: { '200': { description: 'Capability status snapshot' } },
      },
    },
    '/v1/creator-economy/engine': {
      get: {
        summary: 'Creator Economy engine catalog',
        operationId: 'getCreatorEconomyEngine',
        responses: {
          '200': {
            description:
              'Creator Economy capabilities, royalty hand-checks, Stripe honesty, tax/dispute gaps',
          },
        },
      },
    },
    '/v1/creator-economy/products': {
      get: {
        summary: 'Creator Economy products (alias of engine)',
        operationId: 'listCreatorEconomyProducts',
        responses: { '200': { description: 'Creator Economy catalog + honesty' } },
      },
    },
    '/v1/creator-economy/royalty/scenarios': {
      get: {
        summary: 'Hand-checkable royalty split scenarios',
        operationId: 'getCreatorEconomyRoyaltyScenarios',
        responses: { '200': { description: 'Scenario table with computed pass/fail' } },
      },
    },
    '/v1/creator-economy/royalty/preview': {
      post: {
        summary: 'Preview royalty split for an amount',
        operationId: 'previewCreatorEconomyRoyalty',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Fee + publisher net preview' } },
      },
    },
    '/v1/creator-economy/sales': {
      get: {
        summary: 'Aggregated marketplace sales for the org',
        operationId: 'listCreatorEconomySales',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Sale receipts' } },
      },
    },
    '/v1/creator-economy/invoices': {
      get: {
        summary: 'Invoice-style views over MarketplaceSale',
        operationId: 'listCreatorEconomyInvoices',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Invoice-style receipts' } },
      },
    },
    '/v1/creator-economy/profiles/creator': {
      get: {
        summary: 'Creator/publisher profile',
        operationId: 'getCreatorEconomyCreatorProfile',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Creator profile + Connect readiness' } },
      },
    },
    '/v1/creator-economy/profiles/organization': {
      get: {
        summary: 'Organization economy profile',
        operationId: 'getCreatorEconomyOrganizationProfile',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Org buyer/publisher summary' } },
      },
    },
    '/v1/creator-economy/profiles/partner': {
      get: {
        summary: 'Partner / Connect readiness',
        operationId: 'getCreatorEconomyPartnerProfile',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Stripe Connect Express partner status' } },
      },
    },
    '/v1/creator-economy/licensing': {
      get: {
        summary: 'Workspace marketplace entitlements',
        operationId: 'listCreatorEconomyLicensing',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Installed entitlements' } },
      },
    },
    '/v1/creator-economy/tax': {
      get: {
        summary: 'Tax reporting honesty (gaps)',
        operationId: 'getCreatorEconomyTax',
        responses: { '200': { description: 'Explicit tax coverage gaps' } },
      },
    },
    '/v1/creator-economy/disputes': {
      get: {
        summary: 'Dispute/chargeback honesty (gaps)',
        operationId: 'getCreatorEconomyDisputes',
        responses: { '200': { description: 'Explicit dispute coverage gaps' } },
      },
    },
    '/v1/creator-economy/analytics': {
      get: {
        summary: 'Creator Economy analytics',
        operationId: 'getCreatorEconomyAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/creator-economy/monitoring': {
      get: {
        summary: 'Creator Economy monitoring',
        operationId: 'getCreatorEconomyMonitoring',
        responses: { '200': { description: 'Capability + hand-check snapshot' } },
      },
    },
    '/v1/african-intelligence-cloud/engine': {
      get: {
        summary: 'African Intelligence Cloud engine catalog',
        operationId: 'getAfricanIntelligenceCloudEngine',
        responses: { '200': { description: 'African Intelligence Cloud catalog + honesty' } },
      },
    },
    '/v1/african-intelligence-cloud/products': {
      get: {
        summary: 'African Intelligence Cloud products',
        operationId: 'listAfricanIntelligenceCloudProducts',
        responses: { '200': { description: 'African Intelligence Cloud products' } },
      },
    },
    '/v1/african-intelligence-cloud/monitoring': {
      get: {
        summary: 'African Intelligence Cloud monitoring',
        operationId: 'getAfricanIntelligenceCloudMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/african-intelligence-cloud/routing': {
      get: {
        summary: 'African Intelligence routing table',
        operationId: 'getAfricanIntelligenceCloudRouting',
        responses: { '200': { description: 'Static routing catalog' } },
      },
    },
    '/v1/african-intelligence-cloud/overview': {
      get: {
        summary: 'African Intelligence Cloud org overview',
        operationId: 'getAfricanIntelligenceCloudOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage + product catalog' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/african-language-registry/engine': {
      get: {
        summary: 'African Language Registry engine catalog',
        operationId: 'getAfricanLanguageRegistryEngine',
        responses: { '200': { description: 'African Language Registry catalog + honesty' } },
      },
    },
    '/v1/african-language-registry/products': {
      get: {
        summary: 'African Language Registry products',
        operationId: 'listAfricanLanguageRegistryProducts',
        responses: { '200': { description: 'African Language Registry products' } },
      },
    },
    '/v1/african-language-registry/monitoring': {
      get: {
        summary: 'African Language Registry monitoring',
        operationId: 'getAfricanLanguageRegistryMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/african-language-registry/languages': {
      get: {
        summary: 'List African language registry entries',
        operationId: 'listAfricanLanguageRegistryLanguages',
        responses: { '200': { description: 'Language seed entries' } },
      },
    },
    '/v1/african-language-registry/families': {
      get: {
        summary: 'List language families',
        operationId: 'listAfricanLanguageRegistryFamilies',
        responses: { '200': { description: 'Family metadata' } },
      },
    },
    '/v1/cultural-intelligence/engine': {
      get: {
        summary: 'Cultural Intelligence engine catalog',
        operationId: 'getCulturalIntelligenceEngine',
        responses: { '200': { description: 'Cultural Intelligence catalog + honesty' } },
      },
    },
    '/v1/cultural-intelligence/products': {
      get: {
        summary: 'Cultural Intelligence products',
        operationId: 'listCulturalIntelligenceProducts',
        responses: { '200': { description: 'Cultural Intelligence products' } },
      },
    },
    '/v1/cultural-intelligence/monitoring': {
      get: {
        summary: 'Cultural Intelligence monitoring',
        operationId: 'getCulturalIntelligenceMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/cultural-intelligence/entries': {
      get: {
        summary: 'List cultural intelligence entries',
        operationId: 'listCulturalIntelligenceEntries',
        responses: { '200': { description: 'Cultural entries with consent fields' } },
      },
    },
    '/v1/african-knowledge-graph/engine': {
      get: {
        summary: 'African Knowledge Graph engine catalog',
        operationId: 'getAfricanKnowledgeGraphEngine',
        responses: { '200': { description: 'African Knowledge Graph catalog + honesty' } },
      },
    },
    '/v1/african-knowledge-graph/products': {
      get: {
        summary: 'African Knowledge Graph products',
        operationId: 'listAfricanKnowledgeGraphProducts',
        responses: { '200': { description: 'African Knowledge Graph products' } },
      },
    },
    '/v1/african-knowledge-graph/monitoring': {
      get: {
        summary: 'African Knowledge Graph monitoring',
        operationId: 'getAfricanKnowledgeGraphMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/african-knowledge-graph/nodes': {
      get: {
        summary: 'List African knowledge graph nodes',
        operationId: 'listAfricanKnowledgeGraphNodes',
        responses: { '200': { description: 'Graph nodes' } },
      },
    },
    '/v1/african-knowledge-graph/edges': {
      get: {
        summary: 'List African knowledge graph edges',
        operationId: 'listAfricanKnowledgeGraphEdges',
        responses: { '200': { description: 'Graph edges' } },
      },
    },
    '/v1/african-knowledge-graph/query': {
      get: {
        summary: 'Query African knowledge graph',
        operationId: 'queryAfricanKnowledgeGraph',
        responses: { '200': { description: 'Filtered nodes/edges' } },
      },
    },
    '/v1/government-intelligence/engine': {
      get: {
        summary: 'Government Intelligence engine catalog',
        operationId: 'getGovernmentIntelligenceEngine',
        responses: { '200': { description: 'Government Intelligence catalog + honesty' } },
      },
    },
    '/v1/government-intelligence/products': {
      get: {
        summary: 'Government Intelligence products',
        operationId: 'listGovernmentIntelligenceProducts',
        responses: { '200': { description: 'Government Intelligence products' } },
      },
    },
    '/v1/government-intelligence/monitoring': {
      get: {
        summary: 'Government Intelligence monitoring',
        operationId: 'getGovernmentIntelligenceMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/government-intelligence/terms': {
      get: {
        summary: 'List Government Intelligence terms',
        operationId: 'listGovernmentIntelligenceTerms',
        responses: { '200': { description: 'Domain terms' } },
      },
    },
    '/v1/government-intelligence/query': {
      get: {
        summary: 'Query Government Intelligence terms',
        operationId: 'queryGovernmentIntelligenceTerms',
        responses: { '200': { description: 'Filtered domain terms' } },
      },
    },
    '/v1/language-integrity/engine': {
      get: {
        summary: 'Language Integrity engine catalog',
        operationId: 'getLanguageIntegrityEngine',
        responses: {
          '200': {
            description:
              'Provenance, watermark, consent, audit, translation review catalog — not deepfake certification',
          },
        },
      },
    },
    '/v1/language-integrity/protocol': {
      get: {
        summary: 'Government Language Integrity adoption protocol',
        operationId: 'getLanguageIntegrityProtocol',
        responses: {
          '200': {
            description:
              'Requirements for attested synthetic media and human-reviewed official translations',
          },
        },
      },
    },
    '/v1/language-integrity/verify': {
      post: {
        summary: 'Verify Lugemi provenance claim (metadata)',
        operationId: 'verifyLanguageIntegrityClaim',
        responses: {
          '200': {
            description:
              'Verdict + findings for watermark/consent claims. Not universal deepfake detection.',
          },
        },
      },
    },
    '/v1/language-integrity/verify/workspace': {
      post: {
        summary: 'Verify claim against workspace clone library',
        operationId: 'verifyLanguageIntegrityWorkspace',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Workspace-bound provenance verify including clone lookup' },
        },
      },
    },
    '/v1/healthcare-intelligence/engine': {
      get: {
        summary: 'Healthcare Intelligence engine catalog',
        operationId: 'getHealthcareIntelligenceEngine',
        responses: { '200': { description: 'Healthcare Intelligence catalog + honesty' } },
      },
    },
    '/v1/healthcare-intelligence/products': {
      get: {
        summary: 'Healthcare Intelligence products',
        operationId: 'listHealthcareIntelligenceProducts',
        responses: { '200': { description: 'Healthcare Intelligence products' } },
      },
    },
    '/v1/healthcare-intelligence/monitoring': {
      get: {
        summary: 'Healthcare Intelligence monitoring',
        operationId: 'getHealthcareIntelligenceMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/healthcare-intelligence/terms': {
      get: {
        summary: 'List Healthcare Intelligence terms',
        operationId: 'listHealthcareIntelligenceTerms',
        responses: { '200': { description: 'Domain terms' } },
      },
    },
    '/v1/healthcare-intelligence/query': {
      get: {
        summary: 'Query Healthcare Intelligence terms',
        operationId: 'queryHealthcareIntelligenceTerms',
        responses: { '200': { description: 'Filtered domain terms' } },
      },
    },
    '/v1/financial-intelligence/engine': {
      get: {
        summary: 'Financial Intelligence engine catalog',
        operationId: 'getFinancialIntelligenceEngine',
        responses: { '200': { description: 'Financial Intelligence catalog + honesty' } },
      },
    },
    '/v1/financial-intelligence/products': {
      get: {
        summary: 'Financial Intelligence products',
        operationId: 'listFinancialIntelligenceProducts',
        responses: { '200': { description: 'Financial Intelligence products' } },
      },
    },
    '/v1/financial-intelligence/monitoring': {
      get: {
        summary: 'Financial Intelligence monitoring',
        operationId: 'getFinancialIntelligenceMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/financial-intelligence/terms': {
      get: {
        summary: 'List Financial Intelligence terms',
        operationId: 'listFinancialIntelligenceTerms',
        responses: { '200': { description: 'Domain terms' } },
      },
    },
    '/v1/financial-intelligence/query': {
      get: {
        summary: 'Query Financial Intelligence terms',
        operationId: 'queryFinancialIntelligenceTerms',
        responses: { '200': { description: 'Filtered domain terms' } },
      },
    },
    '/v1/education-intelligence/engine': {
      get: {
        summary: 'Education Intelligence engine catalog',
        operationId: 'getEducationIntelligenceEngine',
        responses: { '200': { description: 'Education Intelligence catalog + honesty' } },
      },
    },
    '/v1/education-intelligence/products': {
      get: {
        summary: 'Education Intelligence products',
        operationId: 'listEducationIntelligenceProducts',
        responses: { '200': { description: 'Education Intelligence products' } },
      },
    },
    '/v1/education-intelligence/monitoring': {
      get: {
        summary: 'Education Intelligence monitoring',
        operationId: 'getEducationIntelligenceMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/education-intelligence/terms': {
      get: {
        summary: 'List Education Intelligence terms',
        operationId: 'listEducationIntelligenceTerms',
        responses: { '200': { description: 'Domain terms' } },
      },
    },
    '/v1/education-intelligence/query': {
      get: {
        summary: 'Query Education Intelligence terms',
        operationId: 'queryEducationIntelligenceTerms',
        responses: { '200': { description: 'Filtered domain terms' } },
      },
    },
    '/v1/agricultural-intelligence/engine': {
      get: {
        summary: 'Agricultural Intelligence engine catalog',
        operationId: 'getAgriculturalIntelligenceEngine',
        responses: { '200': { description: 'Agricultural Intelligence catalog + honesty' } },
      },
    },
    '/v1/agricultural-intelligence/products': {
      get: {
        summary: 'Agricultural Intelligence products',
        operationId: 'listAgriculturalIntelligenceProducts',
        responses: { '200': { description: 'Agricultural Intelligence products' } },
      },
    },
    '/v1/agricultural-intelligence/monitoring': {
      get: {
        summary: 'Agricultural Intelligence monitoring',
        operationId: 'getAgriculturalIntelligenceMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/agricultural-intelligence/terms': {
      get: {
        summary: 'List Agricultural Intelligence terms',
        operationId: 'listAgriculturalIntelligenceTerms',
        responses: { '200': { description: 'Domain terms' } },
      },
    },
    '/v1/agricultural-intelligence/query': {
      get: {
        summary: 'Query Agricultural Intelligence terms',
        operationId: 'queryAgriculturalIntelligenceTerms',
        responses: { '200': { description: 'Filtered domain terms' } },
      },
    },
    '/v1/tourism-heritage-intelligence/engine': {
      get: {
        summary: 'Tourism & Heritage Intelligence engine catalog',
        operationId: 'getTourismHeritageIntelligenceEngine',
        responses: { '200': { description: 'Tourism & Heritage Intelligence catalog + honesty' } },
      },
    },
    '/v1/tourism-heritage-intelligence/products': {
      get: {
        summary: 'Tourism & Heritage Intelligence products',
        operationId: 'listTourismHeritageIntelligenceProducts',
        responses: { '200': { description: 'Tourism & Heritage Intelligence products' } },
      },
    },
    '/v1/tourism-heritage-intelligence/monitoring': {
      get: {
        summary: 'Tourism & Heritage Intelligence monitoring',
        operationId: 'getTourismHeritageIntelligenceMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/tourism-heritage-intelligence/terms': {
      get: {
        summary: 'List Tourism & Heritage Intelligence terms',
        operationId: 'listTourismHeritageIntelligenceTerms',
        responses: { '200': { description: 'Domain terms' } },
      },
    },
    '/v1/tourism-heritage-intelligence/query': {
      get: {
        summary: 'Query Tourism & Heritage Intelligence terms',
        operationId: 'queryTourismHeritageIntelligenceTerms',
        responses: { '200': { description: 'Filtered domain terms' } },
      },
    },
    '/v1/research-cloud/engine': {
      get: {
        summary: 'Research Cloud engine catalog',
        operationId: 'getResearchCloudEngine',
        responses: { '200': { description: 'Research Cloud catalog + honesty' } },
      },
    },
    '/v1/research-cloud/products': {
      get: {
        summary: 'Research Cloud products',
        operationId: 'listResearchCloudProducts',
        responses: { '200': { description: 'Research Cloud products' } },
      },
    },
    '/v1/research-cloud/monitoring': {
      get: {
        summary: 'Research Cloud monitoring',
        operationId: 'getResearchCloudMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/research-cloud/routing': {
      get: {
        summary: 'Research Cloud routing table',
        operationId: 'getResearchCloudRouting',
        responses: { '200': { description: 'Static routing catalog' } },
      },
    },
    '/v1/research-cloud/overview': {
      get: {
        summary: 'Research Cloud org overview',
        operationId: 'getResearchCloudOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage + product catalog' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/experiment-platform/engine': {
      get: {
        summary: 'Experiment Platform engine catalog',
        operationId: 'getExperimentPlatformEngine',
        responses: { '200': { description: 'Experiment Platform catalog + honesty' } },
      },
    },
    '/v1/experiment-platform/products': {
      get: {
        summary: 'Experiment Platform products',
        operationId: 'listExperimentPlatformProducts',
        responses: { '200': { description: 'Experiment Platform products' } },
      },
    },
    '/v1/experiment-platform/monitoring': {
      get: {
        summary: 'Experiment Platform monitoring',
        operationId: 'getExperimentPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/experiment-platform/runs': {
      get: {
        summary: 'List experiment runs',
        operationId: 'listExperimentPlatformRuns',
        responses: { '200': { description: 'List experiment runs' } },
      },
    },
    '/v1/experiment-platform/query': {
      get: {
        summary: 'Query Experiment Platform',
        operationId: 'queryExperimentPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/synthetic-data-platform/engine': {
      get: {
        summary: 'Synthetic Data Platform engine catalog',
        operationId: 'getSyntheticDataPlatformEngine',
        responses: { '200': { description: 'Synthetic Data Platform catalog + honesty' } },
      },
    },
    '/v1/synthetic-data-platform/products': {
      get: {
        summary: 'Synthetic Data Platform products',
        operationId: 'listSyntheticDataPlatformProducts',
        responses: { '200': { description: 'Synthetic Data Platform products' } },
      },
    },
    '/v1/synthetic-data-platform/monitoring': {
      get: {
        summary: 'Synthetic Data Platform monitoring',
        operationId: 'getSyntheticDataPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/synthetic-data-platform/artifacts': {
      get: {
        summary: 'List synthetic artifacts',
        operationId: 'listSyntheticDataPlatformArtifacts',
        responses: { '200': { description: 'List synthetic artifacts' } },
      },
    },
    '/v1/synthetic-data-platform/query': {
      get: {
        summary: 'Query Synthetic Data Platform',
        operationId: 'querySyntheticDataPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/benchmark-platform/engine': {
      get: {
        summary: 'Benchmark Platform engine catalog',
        operationId: 'getBenchmarkPlatformEngine',
        responses: { '200': { description: 'Benchmark Platform catalog + honesty' } },
      },
    },
    '/v1/benchmark-platform/products': {
      get: {
        summary: 'Benchmark Platform products',
        operationId: 'listBenchmarkPlatformProducts',
        responses: { '200': { description: 'Benchmark Platform products' } },
      },
    },
    '/v1/benchmark-platform/monitoring': {
      get: {
        summary: 'Benchmark Platform monitoring',
        operationId: 'getBenchmarkPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/benchmark-platform/leaderboard': {
      get: {
        summary: 'List benchmark leaderboard rows',
        operationId: 'listBenchmarkPlatformLeaderboard',
        responses: { '200': { description: 'List benchmark leaderboard rows' } },
      },
    },
    '/v1/benchmark-platform/query': {
      get: {
        summary: 'Query Benchmark Platform',
        operationId: 'queryBenchmarkPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/evaluation-platform/engine': {
      get: {
        summary: 'Evaluation Platform engine catalog',
        operationId: 'getEvaluationPlatformEngine',
        responses: { '200': { description: 'Evaluation Platform catalog + honesty' } },
      },
    },
    '/v1/evaluation-platform/products': {
      get: {
        summary: 'Evaluation Platform products',
        operationId: 'listEvaluationPlatformProducts',
        responses: { '200': { description: 'Evaluation Platform products' } },
      },
    },
    '/v1/evaluation-platform/monitoring': {
      get: {
        summary: 'Evaluation Platform monitoring',
        operationId: 'getEvaluationPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/evaluation-platform/capabilities': {
      get: {
        summary: 'List evaluation capabilities',
        operationId: 'listEvaluationPlatformCapabilities',
        responses: { '200': { description: 'List evaluation capabilities' } },
      },
    },
    '/v1/evaluation-platform/query': {
      get: {
        summary: 'Query Evaluation Platform',
        operationId: 'queryEvaluationPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/ai-publication-platform/engine': {
      get: {
        summary: 'AI Publication Platform engine catalog',
        operationId: 'getAiPublicationPlatformEngine',
        responses: { '200': { description: 'AI Publication Platform catalog + honesty' } },
      },
    },
    '/v1/ai-publication-platform/products': {
      get: {
        summary: 'AI Publication Platform products',
        operationId: 'listAiPublicationPlatformProducts',
        responses: { '200': { description: 'AI Publication Platform products' } },
      },
    },
    '/v1/ai-publication-platform/monitoring': {
      get: {
        summary: 'AI Publication Platform monitoring',
        operationId: 'getAiPublicationPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/ai-publication-platform/publications': {
      get: {
        summary: 'List publications',
        operationId: 'listAiPublicationPlatformPublications',
        responses: { '200': { description: 'List publications' } },
      },
    },
    '/v1/ai-publication-platform/query': {
      get: {
        summary: 'Query AI Publication Platform',
        operationId: 'queryAiPublicationPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/patent-innovation-platform/engine': {
      get: {
        summary: 'Patent & Innovation Platform engine catalog',
        operationId: 'getPatentInnovationPlatformEngine',
        responses: { '200': { description: 'Patent & Innovation Platform catalog + honesty' } },
      },
    },
    '/v1/patent-innovation-platform/products': {
      get: {
        summary: 'Patent & Innovation Platform products',
        operationId: 'listPatentInnovationPlatformProducts',
        responses: { '200': { description: 'Patent & Innovation Platform products' } },
      },
    },
    '/v1/patent-innovation-platform/monitoring': {
      get: {
        summary: 'Patent & Innovation Platform monitoring',
        operationId: 'getPatentInnovationPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/patent-innovation-platform/portfolio': {
      get: {
        summary: 'List IP portfolio items',
        operationId: 'listPatentInnovationPlatformPortfolio',
        responses: { '200': { description: 'List IP portfolio items' } },
      },
    },
    '/v1/patent-innovation-platform/query': {
      get: {
        summary: 'Query Patent & Innovation Platform',
        operationId: 'queryPatentInnovationPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/open-science-platform/engine': {
      get: {
        summary: 'Open Science Platform engine catalog',
        operationId: 'getOpenSciencePlatformEngine',
        responses: { '200': { description: 'Open Science Platform catalog + honesty' } },
      },
    },
    '/v1/open-science-platform/products': {
      get: {
        summary: 'Open Science Platform products',
        operationId: 'listOpenSciencePlatformProducts',
        responses: { '200': { description: 'Open Science Platform products' } },
      },
    },
    '/v1/open-science-platform/monitoring': {
      get: {
        summary: 'Open Science Platform monitoring',
        operationId: 'getOpenSciencePlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/open-science-platform/releases': {
      get: {
        summary: 'List open-science release candidates',
        operationId: 'listOpenSciencePlatformReleases',
        responses: { '200': { description: 'List open-science release candidates' } },
      },
    },
    '/v1/open-science-platform/query': {
      get: {
        summary: 'Query Open Science Platform',
        operationId: 'queryOpenSciencePlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/open-science-platform/check': {
      get: {
        summary: 'Check open-science release consent gate',
        operationId: 'checkOpenScienceRelease',
        responses: { '200': { description: 'allowed + reason' } },
      },
    },
    '/v1/open-science-platform/release': {
      get: {
        summary: 'Attempt open-science release (consent gated)',
        operationId: 'releaseOpenScienceCandidate',
        responses: {
          '200': { description: 'Released' },
          '400': { description: 'Blocked by consent gate' },
        },
      },
    },
    '/v1/research-analytics/engine': {
      get: {
        summary: 'Research Analytics engine catalog',
        operationId: 'getResearchAnalyticsEngine',
        responses: { '200': { description: 'Research Analytics catalog + honesty' } },
      },
    },
    '/v1/research-analytics/products': {
      get: {
        summary: 'Research Analytics products',
        operationId: 'listResearchAnalyticsProducts',
        responses: { '200': { description: 'Research Analytics products' } },
      },
    },
    '/v1/research-analytics/monitoring': {
      get: {
        summary: 'Research Analytics monitoring',
        operationId: 'getResearchAnalyticsMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/research-analytics/snapshot': {
      get: {
        summary: 'Research analytics snapshot',
        operationId: 'listResearchAnalyticsSnapshot',
        responses: { '200': { description: 'Research analytics snapshot' } },
      },
    },
    '/v1/research-analytics/query': {
      get: {
        summary: 'Query Research Analytics',
        operationId: 'queryResearchAnalytics',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/mlops-llmops-cloud/products': {
      get: {
        summary: 'MLOps & LLMOps Cloud product catalog',
        operationId: 'listMlopsLlmopsCloudProducts',
        responses: { '200': { description: 'Product catalog' } },
      },
    },
    '/v1/mlops-llmops-cloud/engine': {
      get: {
        summary: 'MLOps & LLMOps Cloud engine (alias of products)',
        operationId: 'getMlopsLlmopsCloudEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/mlops-llmops-cloud/routing': {
      get: {
        summary: 'MLOps & LLMOps Cloud routing table',
        operationId: 'getMlopsLlmopsCloudRouting',
        responses: { '200': { description: 'Routing table' } },
      },
    },
    '/v1/mlops-llmops-cloud/overview': {
      get: {
        summary: 'MLOps & LLMOps Cloud authenticated overview',
        operationId: 'getMlopsLlmopsCloudOverview',
        responses: {
          '200': { description: 'Overview' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/v1/mlops-llmops-cloud/monitoring': {
      get: {
        summary: 'MLOps & LLMOps Cloud monitoring snapshot',
        operationId: 'getMlopsLlmopsCloudMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },

    '/v1/dataset-pipeline/engine': {
      get: {
        summary: 'Dataset Pipeline engine catalog',
        operationId: 'getDatasetPipelineEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/dataset-pipeline/products': {
      get: {
        summary: 'Dataset Pipeline products alias',
        operationId: 'listDatasetPipelineProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/dataset-pipeline/monitoring': {
      get: {
        summary: 'Dataset Pipeline monitoring',
        operationId: 'getDatasetPipelineMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/dataset-pipeline/runs': {
      get: {
        summary: 'List Dataset Pipeline runs',
        operationId: 'listDatasetPipelineRuns',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/dataset-pipeline/query': {
      get: {
        summary: 'Query Dataset Pipeline',
        operationId: 'queryDatasetPipeline',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },

    '/v1/training-pipeline/engine': {
      get: {
        summary: 'Training Pipeline engine catalog',
        operationId: 'getTrainingPipelineEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/training-pipeline/products': {
      get: {
        summary: 'Training Pipeline products alias',
        operationId: 'listTrainingPipelineProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/training-pipeline/monitoring': {
      get: {
        summary: 'Training Pipeline monitoring',
        operationId: 'getTrainingPipelineMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/training-pipeline/jobs': {
      get: {
        summary: 'List Training Pipeline jobs',
        operationId: 'listTrainingPipelineJobs',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/training-pipeline/query': {
      get: {
        summary: 'Query Training Pipeline',
        operationId: 'queryTrainingPipeline',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },

    '/v1/continuous-evaluation/engine': {
      get: {
        summary: 'Continuous Evaluation engine catalog',
        operationId: 'getContinuousEvaluationEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/continuous-evaluation/products': {
      get: {
        summary: 'Continuous Evaluation products alias',
        operationId: 'listContinuousEvaluationProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/continuous-evaluation/monitoring': {
      get: {
        summary: 'Continuous Evaluation monitoring',
        operationId: 'getContinuousEvaluationMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/continuous-evaluation/gates': {
      get: {
        summary: 'List Continuous Evaluation gates',
        operationId: 'listContinuousEvaluationGates',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/continuous-evaluation/query': {
      get: {
        summary: 'Query Continuous Evaluation',
        operationId: 'queryContinuousEvaluation',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/continuous-evaluation/gate-status': {
      get: {
        summary: 'Continuous Evaluation gate status for promote',
        operationId: 'getContinuousEvaluationGateStatus',
        responses: { '200': { description: 'Gate status' } },
      },
    },

    '/v1/promptops-platform/engine': {
      get: {
        summary: 'PromptOps Platform engine catalog',
        operationId: 'getPromptopsPlatformEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/promptops-platform/products': {
      get: {
        summary: 'PromptOps Platform products alias',
        operationId: 'listPromptopsPlatformProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/promptops-platform/monitoring': {
      get: {
        summary: 'PromptOps Platform monitoring',
        operationId: 'getPromptopsPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/promptops-platform/prompts': {
      get: {
        summary: 'List PromptOps Platform prompts',
        operationId: 'listPromptopsPlatformPrompts',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/promptops-platform/query': {
      get: {
        summary: 'Query PromptOps Platform',
        operationId: 'queryPromptopsPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },

    '/v1/ragops-platform/engine': {
      get: {
        summary: 'RAGOps Platform engine catalog',
        operationId: 'getRagopsPlatformEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/ragops-platform/products': {
      get: {
        summary: 'RAGOps Platform products alias',
        operationId: 'listRagopsPlatformProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/ragops-platform/monitoring': {
      get: {
        summary: 'RAGOps Platform monitoring',
        operationId: 'getRagopsPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/ragops-platform/pipelines': {
      get: {
        summary: 'List RAGOps Platform pipelines',
        operationId: 'listRagopsPlatformPipelines',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/ragops-platform/query': {
      get: {
        summary: 'Query RAGOps Platform',
        operationId: 'queryRagopsPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },

    '/v1/agentops-platform/engine': {
      get: {
        summary: 'AgentOps Platform engine catalog',
        operationId: 'getAgentopsPlatformEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/agentops-platform/products': {
      get: {
        summary: 'AgentOps Platform products alias',
        operationId: 'listAgentopsPlatformProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/agentops-platform/monitoring': {
      get: {
        summary: 'AgentOps Platform monitoring',
        operationId: 'getAgentopsPlatformMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/agentops-platform/agents': {
      get: {
        summary: 'List AgentOps Platform agents',
        operationId: 'listAgentopsPlatformAgents',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/agentops-platform/query': {
      get: {
        summary: 'Query AgentOps Platform',
        operationId: 'queryAgentopsPlatform',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },

    '/v1/ai-drift-detection/engine': {
      get: {
        summary: 'AI Drift Detection engine catalog',
        operationId: 'getAiDriftDetectionEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/ai-drift-detection/products': {
      get: {
        summary: 'AI Drift Detection products alias',
        operationId: 'listAiDriftDetectionProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/ai-drift-detection/monitoring': {
      get: {
        summary: 'AI Drift Detection monitoring',
        operationId: 'getAiDriftDetectionMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/ai-drift-detection/signals': {
      get: {
        summary: 'List AI Drift Detection signals',
        operationId: 'listAiDriftDetectionSignals',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/ai-drift-detection/query': {
      get: {
        summary: 'Query AI Drift Detection',
        operationId: 'queryAiDriftDetection',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/ai-drift-detection/check': {
      get: {
        summary: 'Drift clear check for Continuous Learning promote',
        operationId: 'checkAiDriftDetection',
        responses: { '200': { description: 'Drift clear status' } },
      },
    },

    '/v1/continuous-learning/engine': {
      get: {
        summary: 'Continuous Learning engine catalog',
        operationId: 'getContinuousLearningEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/continuous-learning/products': {
      get: {
        summary: 'Continuous Learning products alias',
        operationId: 'listContinuousLearningProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/continuous-learning/monitoring': {
      get: {
        summary: 'Continuous Learning monitoring',
        operationId: 'getContinuousLearningMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/continuous-learning/feedback': {
      get: {
        summary: 'List Continuous Learning feedback',
        operationId: 'listContinuousLearningFeedback',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/continuous-learning/query': {
      get: {
        summary: 'Query Continuous Learning',
        operationId: 'queryContinuousLearning',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/continuous-learning/promote-check': {
      get: {
        summary: 'Continuous Learning promote gate check',
        operationId: 'checkContinuousLearningPromote',
        responses: { '200': { description: 'Promote check result' } },
      },
    },
    '/v1/continuous-learning/promote': {
      get: {
        summary: 'Attempt Continuous Learning promote (gated)',
        operationId: 'promoteContinuousLearning',
        responses: {
          '200': { description: 'Promoted' },
          '400': { description: 'Gate failed' },
        },
      },
    },

    '/v1/ai-operations-dashboard/engine': {
      get: {
        summary: 'AI Operations Dashboard engine catalog',
        operationId: 'getAiOperationsDashboardEngine',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/ai-operations-dashboard/products': {
      get: {
        summary: 'AI Operations Dashboard products alias',
        operationId: 'listAiOperationsDashboardProducts',
        responses: { '200': { description: 'Engine catalog' } },
      },
    },
    '/v1/ai-operations-dashboard/monitoring': {
      get: {
        summary: 'AI Operations Dashboard monitoring',
        operationId: 'getAiOperationsDashboardMonitoring',
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/ai-operations-dashboard/snapshot': {
      get: {
        summary: 'List AI Operations Dashboard snapshot',
        operationId: 'listAiOperationsDashboardSnapshot',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },
    '/v1/ai-operations-dashboard/query': {
      get: {
        summary: 'Query AI Operations Dashboard',
        operationId: 'queryAiOperationsDashboard',
        responses: { '200': { description: 'Filtered catalog rows' } },
      },
    },

    '/v1/event-fabric/products': {
      get: {
        summary: 'Event Fabric capability catalog',
        operationId: 'listEventFabricProducts',
        responses: {
          '200': {
            description:
              'Event bus capabilities, brokers, Redis Streams honesty, deferred Kafka/NATS/Rabbit',
          },
        },
      },
    },
    '/v1/event-fabric/engine': {
      get: {
        summary: 'Event Fabric engine (alias of products)',
        operationId: 'getEventFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/event-fabric/brokers': {
      get: {
        summary: 'Event Fabric broker catalog',
        operationId: 'listEventFabricBrokers',
        responses: { '200': { description: 'Active Redis Streams + deferred adapters' } },
      },
    },
    '/v1/event-fabric/events': {
      get: {
        summary: 'Poll / consume CloudEvents from a topic',
        operationId: 'pollEventFabricEvents',
        parameters: [
          { name: 'topic', in: 'query', schema: { type: 'string' } },
          { name: 'count', in: 'query', schema: { type: 'integer' } },
          { name: 'eventVersion', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'CloudEvents batch' } },
      },
      post: {
        summary: 'Publish a CloudEvent',
        operationId: 'publishEventFabricEvent',
        responses: { '201': { description: 'Published CloudEvent' } },
      },
    },
    '/v1/event-fabric/events/{streamId}/fail': {
      post: {
        summary: 'Mark event failed (retry or DLQ)',
        operationId: 'failEventFabricEvent',
        parameters: [
          { name: 'streamId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'retry or dlq action' } },
      },
    },
    '/v1/event-fabric/dlq': {
      get: {
        summary: 'List dead-letter events',
        operationId: 'listEventFabricDlq',
        parameters: [{ name: 'topic', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'DLQ events' } },
      },
    },
    '/v1/event-fabric/dlq/retry': {
      post: {
        summary: 'Requeue an event from DLQ',
        operationId: 'retryEventFabricDlq',
        responses: { '200': { description: 'Republished event' } },
      },
    },
    '/v1/event-fabric/replay': {
      post: {
        summary: 'Replay events from a stream offset',
        operationId: 'replayEventFabric',
        responses: { '200': { description: 'Replayed CloudEvents' } },
      },
    },
    '/v1/event-fabric/snapshots': {
      get: {
        summary: 'Consumer-group cursor snapshots',
        operationId: 'listEventFabricSnapshots',
        responses: { '200': { description: 'Snapshots' } },
      },
    },
    '/v1/event-fabric/analytics': {
      get: {
        summary: 'Event Fabric analytics',
        operationId: 'getEventFabricAnalytics',
        responses: { '200': { description: 'Per-topic publish/consume/DLQ counts' } },
      },
    },
    '/v1/event-fabric/overview': {
      get: {
        summary: 'Event Fabric org overview',
        operationId: 'getEventFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + brokers + analytics' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/event-fabric/monitoring': {
      get: {
        summary: 'Event Fabric monitoring',
        operationId: 'getEventFabricMonitoring',
        responses: { '200': { description: 'Backend + counters + honesty' } },
      },
    },
    '/v1/context-fabric/products': {
      get: {
        summary: 'Context Fabric capability catalog',
        operationId: 'listContextFabricProducts',
        responses: {
          '200': {
            description:
              'Context kinds, router routes, honesty (extends Context Runtime)',
          },
        },
      },
    },
    '/v1/context-fabric/engine': {
      get: {
        summary: 'Context Fabric engine (alias of products)',
        operationId: 'getContextFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/context-fabric/routes': {
      get: {
        summary: 'Context Fabric routing table',
        operationId: 'listContextFabricRoutes',
        responses: { '200': { description: 'kind → cloud/runtime handoffs' } },
      },
    },
    '/v1/context-fabric/route': {
      post: {
        summary: 'Plan context routing for selected kinds',
        operationId: 'planContextFabricRoute',
        responses: { '200': { description: 'Router plan + include map' } },
      },
    },
    '/v1/context-fabric/propagate': {
      post: {
        summary: 'Propagate context via Context Runtime assemble',
        operationId: 'propagateContextFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Assembled context + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/context-fabric/stream': {
      get: {
        summary: 'Context Fabric SSE realtime ticks',
        operationId: 'streamContextFabric',
        responses: { '200': { description: 'text/event-stream ticks (not WebSocket OS)' } },
      },
    },
    '/v1/context-fabric/overview': {
      get: {
        summary: 'Context Fabric org overview',
        operationId: 'getContextFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + routes + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/context-fabric/monitoring': {
      get: {
        summary: 'Context Fabric monitoring',
        operationId: 'getContextFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/knowledge-fabric/products': {
      get: {
        summary: 'Knowledge Fabric capability catalog',
        operationId: 'listKnowledgeFabricProducts',
        responses: {
          '200': {
            description:
              'Knowledge router capabilities, routes, Knowledge Cloud handoff honesty',
          },
        },
      },
    },
    '/v1/knowledge-fabric/engine': {
      get: {
        summary: 'Knowledge Fabric engine (alias of products)',
        operationId: 'getKnowledgeFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/knowledge-fabric/routes': {
      get: {
        summary: 'Knowledge Fabric routing table',
        operationId: 'listKnowledgeFabricRoutes',
        responses: { '200': { description: 'kind → Knowledge Cloud/Search/RAG handoffs' } },
      },
    },
    '/v1/knowledge-fabric/route': {
      post: {
        summary: 'Plan knowledge routing for selected kinds',
        operationId: 'planKnowledgeFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/knowledge-fabric/distribute': {
      post: {
        summary: 'Plan knowledge distribution to same-org workspaces',
        operationId: 'distributeKnowledgeFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-fabric/sync': {
      post: {
        summary: 'Plan knowledge sync between same-org workspaces',
        operationId: 'syncKnowledgeFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sync cursor/plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-fabric/federate': {
      post: {
        summary: 'List knowledge federation handoff targets',
        operationId: 'federateKnowledgeFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/knowledge-fabric/overview': {
      get: {
        summary: 'Knowledge Fabric org overview',
        operationId: 'getKnowledgeFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + routes + peer workspaces' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-fabric/monitoring': {
      get: {
        summary: 'Knowledge Fabric monitoring',
        operationId: 'getKnowledgeFabricMonitoring',
        responses: { '200': { description: 'Counters + recent plans + honesty' } },
      },
    },
    '/v1/prompt-fabric/products': {
      get: {
        summary: 'Prompt Fabric capability catalog',
        operationId: 'listPromptFabricProducts',
        responses: {
          '200': {
            description:
              'Prompt router capabilities, Prompt Runtime handoff, policy honesty',
          },
        },
      },
    },
    '/v1/prompt-fabric/engine': {
      get: {
        summary: 'Prompt Fabric engine (alias of products)',
        operationId: 'getPromptFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/prompt-fabric/routes': {
      get: {
        summary: 'Prompt Fabric routing table',
        operationId: 'listPromptFabricRoutes',
        responses: { '200': { description: 'kind → Prompt Runtime / cloud handoffs' } },
      },
    },
    '/v1/prompt-fabric/route': {
      post: {
        summary: 'Plan prompt routing for kinds/features',
        operationId: 'planPromptFabricRoute',
        responses: { '200': { description: 'Router plan + optional runtime route' } },
      },
    },
    '/v1/prompt-fabric/versions': {
      get: {
        summary: 'List prompt versions via Prompt Runtime',
        operationId: 'listPromptFabricVersions',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [{ name: 'key', in: 'query', schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Version list' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/validate': {
      post: {
        summary: 'Validate a prompt via Prompt Runtime',
        operationId: 'validatePromptFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Validation findings' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/policies': {
      get: {
        summary: 'Prompt policy handoff (Policy Runtime)',
        operationId: 'getPromptFabricPolicies',
        responses: { '200': { description: 'Policy Runtime discovery + Policy Fabric deferral' } },
      },
    },
    '/v1/prompt-fabric/distribute': {
      post: {
        summary: 'Plan prompt distribution to same-org workspaces',
        operationId: 'distributePromptFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/sync': {
      post: {
        summary: 'Plan prompt sync between same-org workspaces',
        operationId: 'syncPromptFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sync cursor/plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/overview': {
      get: {
        summary: 'Prompt Fabric org overview',
        operationId: 'getPromptFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + routes + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/monitoring': {
      get: {
        summary: 'Prompt Fabric monitoring',
        operationId: 'getPromptFabricMonitoring',
        responses: { '200': { description: 'Counters + recent plans + honesty' } },
      },
    },
    '/v1/reasoning-fabric/products': {
      get: {
        summary: 'Reasoning Fabric capability catalog',
        operationId: 'listReasoningFabricProducts',
        responses: {
          '200': {
            description:
              'Reasoning router capabilities, pipelines, Runtime handoff honesty',
          },
        },
      },
    },
    '/v1/reasoning-fabric/engine': {
      get: {
        summary: 'Reasoning Fabric engine (alias of products)',
        operationId: 'getReasoningFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/reasoning-fabric/routes': {
      get: {
        summary: 'Reasoning Fabric routing table',
        operationId: 'listReasoningFabricRoutes',
        responses: { '200': { description: 'kind → Runtime/Cloud handoffs' } },
      },
    },
    '/v1/reasoning-fabric/route': {
      post: {
        summary: 'Plan reasoning routing for selected kinds',
        operationId: 'planReasoningFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/reasoning-fabric/pipeline': {
      post: {
        summary: 'Plan a reasoning pipeline (ordered Runtime handoffs)',
        operationId: 'planReasoningFabricPipeline',
        responses: { '200': { description: 'Pipeline + routed steps' } },
      },
    },
    '/v1/reasoning-fabric/versions': {
      get: {
        summary: 'Reasoning Fabric version catalog',
        operationId: 'listReasoningFabricVersions',
        responses: { '200': { description: 'Pipeline/router/strategy versions' } },
      },
    },
    '/v1/reasoning-fabric/cache': {
      get: {
        summary: 'Reasoning cache handoff (Intelligent Cache)',
        operationId: 'getReasoningFabricCache',
        responses: { '200': { description: 'Intelligent Cache discovery' } },
      },
    },
    '/v1/reasoning-fabric/federate': {
      post: {
        summary: 'List reasoning federation handoff targets',
        operationId: 'federateReasoningFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/reasoning-fabric/history': {
      get: {
        summary: 'Reasoning history via Reasoning Runtime',
        operationId: 'listReasoningFabricHistory',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'History runs' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reasoning-fabric/replay/{id}': {
      get: {
        summary: 'Replay a reasoning run via Reasoning Runtime',
        operationId: 'replayReasoningFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Replayed run' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reasoning-fabric/distribute': {
      post: {
        summary: 'Plan reasoning distribution to same-org workspaces',
        operationId: 'distributeReasoningFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reasoning-fabric/overview': {
      get: {
        summary: 'Reasoning Fabric org overview',
        operationId: 'getReasoningFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + pipelines + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reasoning-fabric/monitoring': {
      get: {
        summary: 'Reasoning Fabric monitoring',
        operationId: 'getReasoningFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/policy-fabric/products': {
      get: {
        summary: 'Policy Fabric capability catalog',
        operationId: 'listPolicyFabricProducts',
        responses: {
          '200': {
            description:
              'Policy router capabilities, hard-gate honesty, fabric bus list',
          },
        },
      },
    },
    '/v1/policy-fabric/engine': {
      get: {
        summary: 'Policy Fabric engine (alias of products)',
        operationId: 'getPolicyFabricEngine',
        responses: { '200': { description: 'Catalog + hard-gate honesty' } },
      },
    },
    '/v1/policy-fabric/routes': {
      get: {
        summary: 'Policy Fabric routing table',
        operationId: 'listPolicyFabricRoutes',
        responses: { '200': { description: 'kind → Runtime/Fabric handoffs' } },
      },
    },
    '/v1/policy-fabric/route': {
      post: {
        summary: 'Plan policy routing for selected kinds',
        operationId: 'planPolicyFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/policy-fabric/pipeline': {
      post: {
        summary: 'Plan a policy pipeline (ordered handoffs)',
        operationId: 'planPolicyFabricPipeline',
        responses: { '200': { description: 'Pipeline + routed steps' } },
      },
    },
    '/v1/policy-fabric/versions': {
      get: {
        summary: 'Policy Fabric version catalog',
        operationId: 'listPolicyFabricVersions',
        responses: { '200': { description: 'Hard-gate/router/pipeline versions' } },
      },
    },
    '/v1/policy-fabric/federate': {
      post: {
        summary: 'List policy federation handoff targets',
        operationId: 'federatePolicyFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/policy-fabric/evaluate': {
      post: {
        summary: 'Evaluate a policy decision (no throw)',
        operationId: 'evaluatePolicyFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Decision with hardGate:true' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/policy-fabric/assert': {
      post: {
        summary: 'Hard-gate assert (403 on deny)',
        operationId: 'assertPolicyFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Allowed' },
          '403': {
            description: 'Denied by Policy Fabric hard gate',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/policy-fabric/policies': {
      get: {
        summary: 'List policies via Policy Runtime',
        operationId: 'listPolicyFabricPolicies',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Policy list' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/policy-fabric/sync': {
      post: {
        summary: 'Same-org policy catalog sync plan (hard-gated)',
        operationId: 'syncPolicyFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sync plan' },
          '403': {
            description: 'Denied by Policy Fabric hard gate',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/policy-fabric/distribute': {
      post: {
        summary: 'Plan policy distribution to same-org workspaces (hard-gated)',
        operationId: 'distributePolicyFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '403': {
            description: 'Denied by Policy Fabric hard gate',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/policy-fabric/overview': {
      get: {
        summary: 'Policy Fabric org overview',
        operationId: 'getPolicyFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + pipelines + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/policy-fabric/monitoring': {
      get: {
        summary: 'Policy Fabric monitoring',
        operationId: 'getPolicyFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/agent-fabric/products': {
      get: {
        summary: 'Agent Fabric capability catalog',
        operationId: 'listAgentFabricProducts',
        responses: {
          '200': {
            description:
              'Agent router capabilities, pipelines, Runtime handoff honesty',
          },
        },
      },
    },
    '/v1/agent-fabric/engine': {
      get: {
        summary: 'Agent Fabric engine (alias of products)',
        operationId: 'getAgentFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/agent-fabric/routes': {
      get: {
        summary: 'Agent Fabric routing table',
        operationId: 'listAgentFabricRoutes',
        responses: { '200': { description: 'kind → Runtime/Policy handoffs' } },
      },
    },
    '/v1/agent-fabric/route': {
      post: {
        summary: 'Plan agent routing for selected kinds',
        operationId: 'planAgentFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/agent-fabric/pipeline': {
      post: {
        summary: 'Plan an agent pipeline (ordered Runtime handoffs)',
        operationId: 'planAgentFabricPipeline',
        responses: { '200': { description: 'Pipeline + routed steps' } },
      },
    },
    '/v1/agent-fabric/versions': {
      get: {
        summary: 'Agent Fabric version catalog',
        operationId: 'listAgentFabricVersions',
        responses: { '200': { description: 'Router/pipeline/sandbox versions' } },
      },
    },
    '/v1/agent-fabric/federate': {
      post: {
        summary: 'List agent federation handoff targets',
        operationId: 'federateAgentFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/agent-fabric/discover': {
      get: {
        summary: 'Discover workspace agents via Agent Runtime',
        operationId: 'discoverAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Agent list' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/collaborate': {
      post: {
        summary: 'Sandbox agent collaboration via Agent Runtime',
        operationId: 'collaborateAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Collaboration session' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/schedule': {
      post: {
        summary: 'Schedule stub via Agent Runtime',
        operationId: 'scheduleAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Schedule record' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/marketplace': {
      get: {
        summary: 'Agent marketplace listing counts',
        operationId: 'marketplaceAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Listing counts' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/distribute': {
      post: {
        summary: 'Plan agent distribution to same-org workspaces',
        operationId: 'distributeAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/stream': {
      get: {
        summary: 'Agent Fabric SSE realtime ticks',
        operationId: 'streamAgentFabric',
        responses: { '200': { description: 'text/event-stream ticks' } },
      },
    },
    '/v1/agent-fabric/overview': {
      get: {
        summary: 'Agent Fabric org overview',
        operationId: 'getAgentFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + pipelines + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/monitoring': {
      get: {
        summary: 'Agent Fabric monitoring',
        operationId: 'getAgentFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/memory-fabric/products': {
      get: {
        summary: 'Memory Fabric capability catalog',
        operationId: 'listMemoryFabricProducts',
        responses: {
          '200': {
            description:
              'Memory router capabilities, pipelines, Runtime handoff honesty',
          },
        },
      },
    },
    '/v1/memory-fabric/engine': {
      get: {
        summary: 'Memory Fabric engine (alias of products)',
        operationId: 'getMemoryFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/memory-fabric/routes': {
      get: {
        summary: 'Memory Fabric routing table',
        operationId: 'listMemoryFabricRoutes',
        responses: { '200': { description: 'kind → Runtime/Cloud handoffs' } },
      },
    },
    '/v1/memory-fabric/route': {
      post: {
        summary: 'Plan memory routing for selected kinds',
        operationId: 'planMemoryFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/memory-fabric/pipeline': {
      post: {
        summary: 'Plan a memory pipeline (ordered Runtime handoffs)',
        operationId: 'planMemoryFabricPipeline',
        responses: { '200': { description: 'Pipeline + routed steps' } },
      },
    },
    '/v1/memory-fabric/versions': {
      get: {
        summary: 'Memory Fabric version catalog',
        operationId: 'listMemoryFabricVersions',
        responses: { '200': { description: 'Router/pipeline/sync versions' } },
      },
    },
    '/v1/memory-fabric/cache': {
      get: {
        summary: 'Memory cache handoff (Intelligent Cache)',
        operationId: 'getMemoryFabricCache',
        responses: { '200': { description: 'Intelligent Cache discovery' } },
      },
    },
    '/v1/memory-fabric/federate': {
      post: {
        summary: 'List memory federation handoff targets',
        operationId: 'federateMemoryFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/memory-fabric/sync': {
      post: {
        summary: 'Sandbox memory sync via Memory Runtime',
        operationId: 'syncMemoryFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sync stamp result' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/memories': {
      get: {
        summary: 'List memories via Memory Runtime',
        operationId: 'listMemoryFabricMemories',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Memory list' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/search': {
      post: {
        summary: 'Search memories via Memory Runtime',
        operationId: 'searchMemoryFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Search hits' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/replicate': {
      post: {
        summary: 'Plan same-org memory replication',
        operationId: 'replicateMemoryFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Replication plan' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/distribute': {
      post: {
        summary: 'Plan memory distribution to same-org workspaces',
        operationId: 'distributeMemoryFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/overview': {
      get: {
        summary: 'Memory Fabric org overview',
        operationId: 'getMemoryFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + pipelines + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/monitoring': {
      get: {
        summary: 'Memory Fabric monitoring',
        operationId: 'getMemoryFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/memory-runtime/engine': {
      get: {
        summary: 'Memory Runtime catalog',
        operationId: 'getMemoryRuntimeEngine',
        responses: {
          '200': { description: 'Kernel memory capabilities and honesty' },
        },
      },
    },
    '/v1/memory-runtime/scopes': {
      get: {
        summary: 'Memory Runtime scopes/kinds',
        operationId: 'listMemoryRuntimeScopes',
        responses: { '200': { description: 'Kernel scopes and kinds' } },
      },
    },
    '/v1/memory-runtime/ceilings': {
      get: {
        summary: 'Memory Runtime entry ceilings',
        operationId: 'getMemoryRuntimeCeilings',
        responses: { '200': { description: 'maxEntriesPerWorkspace' } },
      },
    },
    '/v1/memory-runtime/memories': {
      get: {
        summary: 'List kernel memories',
        operationId: 'listMemoryRuntimeMemories',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Kernel-layer MemoryRecords' } },
      },
    },
    '/v1/memory-runtime/put': {
      post: {
        summary: 'Put kernel memory',
        operationId: 'putMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Memory stored' },
          '402': { description: 'Hard entry ceiling exceeded' },
        },
      },
    },
    '/v1/memory-runtime/search': {
      post: {
        summary: 'Search kernel memories',
        operationId: 'searchMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Text search results' } },
      },
    },
    '/v1/memory-runtime/revise': {
      post: {
        summary: 'Revise kernel memory (version bump)',
        operationId: 'reviseMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Revised memory' } },
      },
    },
    '/v1/memory-runtime/compress': {
      post: {
        summary: 'Heuristic compress kernel memory',
        operationId: 'compressMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Compressed memory' } },
      },
    },
    '/v1/memory-runtime/evict': {
      post: {
        summary: 'Evict kernel memories (TTL + ceiling)',
        operationId: 'evictMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Eviction counts' } },
      },
    },
    '/v1/memory-runtime/sync': {
      post: {
        summary: 'Sandbox sync stamp',
        operationId: 'syncMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sync stamp applied' } },
      },
    },
    '/v1/memory-runtime/snapshots': {
      get: {
        summary: 'List kernel memory snapshots',
        operationId: 'listMemoryRuntimeSnapshots',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Snapshots' } },
      },
      post: {
        summary: 'Create kernel memory snapshot',
        operationId: 'createMemoryRuntimeSnapshot',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Snapshot created' } },
      },
    },
    '/v1/memory-runtime/analytics': {
      get: {
        summary: 'Memory Runtime analytics',
        operationId: 'getMemoryRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/memory-runtime/monitoring': {
      get: {
        summary: 'Memory Runtime monitoring',
        operationId: 'getMemoryRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty' } },
      },
    },
    '/v1/prompt-runtime/engine': {
      get: {
        summary: 'Prompt Runtime catalog',
        operationId: 'getPromptRuntimeEngine',
        responses: {
          '200': { description: 'Kernel prompt capabilities and honesty' },
        },
      },
    },
    '/v1/prompt-runtime/keys': {
      get: {
        summary: 'Prompt Runtime keys',
        operationId: 'listPromptRuntimeKeys',
        responses: { '200': { description: 'Managed prompt keys' } },
      },
    },
    '/v1/prompt-runtime/routes': {
      get: {
        summary: 'Prompt Runtime feature routes',
        operationId: 'listPromptRuntimeRoutes',
        responses: { '200': { description: 'Sandbox feature→key map' } },
      },
    },
    '/v1/prompt-runtime/registry': {
      get: {
        summary: 'Prompt Runtime registry façade',
        operationId: 'getPromptRuntimeRegistry',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Language registry rows' } },
      },
    },
    '/v1/prompt-runtime/templates': {
      get: {
        summary: 'Prompt Runtime templates',
        operationId: 'listPromptRuntimeTemplates',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Templates + variables' } },
      },
    },
    '/v1/prompt-runtime/versions': {
      get: {
        summary: 'Prompt Runtime versions',
        operationId: 'listPromptRuntimeVersions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Version list for key' } },
      },
    },
    '/v1/prompt-runtime/route': {
      post: {
        summary: 'Route feature to prompt key',
        operationId: 'routePromptRuntime',
        responses: { '200': { description: 'Sandbox route result' } },
      },
    },
    '/v1/prompt-runtime/render': {
      post: {
        summary: 'Render prompt variables',
        operationId: 'renderPromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Rendered body' } },
      },
    },
    '/v1/prompt-runtime/validate': {
      post: {
        summary: 'Validate rendered prompt',
        operationId: 'validatePromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic validation' } },
      },
    },
    '/v1/prompt-runtime/security-scan': {
      post: {
        summary: 'Security-scan prompt',
        operationId: 'securityScanPromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Pattern scan via Prompt Intelligence' } },
      },
    },
    '/v1/prompt-runtime/optimize': {
      post: {
        summary: 'Heuristic optimize prompt',
        operationId: 'optimizePromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Trim/tips stub' } },
      },
    },
    '/v1/prompt-runtime/execute': {
      post: {
        summary: 'Execute prompt (resolve/render/validate)',
        operationId: 'executePromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Rendered prompt (no LLM call)' },
          '400': { description: 'Validation or security failure' },
        },
      },
    },
    '/v1/prompt-runtime/analytics': {
      get: {
        summary: 'Prompt Runtime analytics',
        operationId: 'getPromptRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/prompt-runtime/monitoring': {
      get: {
        summary: 'Prompt Runtime monitoring',
        operationId: 'getPromptRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty' } },
      },
    },
    '/v1/context-runtime/engine': {
      get: {
        summary: 'Context Runtime catalog',
        operationId: 'getContextRuntimeEngine',
        responses: {
          '200': { description: 'Kernel context capabilities and honesty' },
        },
      },
    },
    '/v1/context-runtime/scopes': {
      get: {
        summary: 'Context Runtime scopes/priorities',
        operationId: 'listContextRuntimeScopes',
        responses: { '200': { description: 'Context kinds and priorities' } },
      },
    },
    '/v1/context-runtime/assemble': {
      post: {
        summary: 'Assemble kernel context',
        operationId: 'assembleContextRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Assembled promptContext + blocks' } },
      },
    },
    '/v1/context-runtime/retrieve': {
      post: {
        summary: 'Retrieve kernel context',
        operationId: 'retrieveContextRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Retrieve façade over assemble' } },
      },
    },
    '/v1/context-runtime/prioritize': {
      post: {
        summary: 'Prioritize context blocks',
        operationId: 'prioritizeContextRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Reordered blocks' } },
      },
    },
    '/v1/context-runtime/compress': {
      post: {
        summary: 'Compress context blocks',
        operationId: 'compressContextRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Char-budget truncation' } },
      },
    },
    '/v1/context-runtime/analytics': {
      get: {
        summary: 'Context Runtime analytics',
        operationId: 'getContextRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/context-runtime/monitoring': {
      get: {
        summary: 'Context Runtime monitoring',
        operationId: 'getContextRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty' } },
      },
    },
    '/v1/reasoning-runtime/engine': {
      get: {
        summary: 'Reasoning Runtime catalog',
        operationId: 'getReasoningRuntimeEngine',
        responses: {
          '200': { description: 'Kernel reasoning capabilities and honesty' },
        },
      },
    },
    '/v1/reasoning-runtime/reason': {
      post: {
        summary: 'Run kernel reasoning',
        operationId: 'reasonReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Reasoned answer + eval/confidence' } },
      },
    },
    '/v1/reasoning-runtime/plan': {
      post: {
        summary: 'Plan via Reasoning Runtime',
        operationId: 'planReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Plan steps' } },
      },
    },
    '/v1/reasoning-runtime/reflect': {
      post: {
        summary: 'Reflect on an answer',
        operationId: 'reflectReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic critiques' } },
      },
    },
    '/v1/reasoning-runtime/select-tools': {
      post: {
        summary: 'Select tools (no execution)',
        operationId: 'selectToolsReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Suggested tool ids' } },
      },
    },
    '/v1/reasoning-runtime/select-model': {
      post: {
        summary: 'Select model via AI Router',
        operationId: 'selectModelReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Model selection' } },
      },
    },
    '/v1/reasoning-runtime/decision-tree': {
      post: {
        summary: 'Sandbox decision tree',
        operationId: 'decisionTreeReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision tree façade' } },
      },
    },
    '/v1/reasoning-runtime/evaluate': {
      post: {
        summary: 'Self-evaluate answer',
        operationId: 'evaluateReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic evaluation' } },
      },
    },
    '/v1/reasoning-runtime/confidence': {
      post: {
        summary: 'Confidence score',
        operationId: 'confidenceReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Blended confidence' } },
      },
    },
    '/v1/reasoning-runtime/history': {
      get: {
        summary: 'Reasoning history',
        operationId: 'listReasoningRuntimeHistory',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Stored runs' } },
      },
    },
    '/v1/reasoning-runtime/history/{id}': {
      get: {
        summary: 'Replay reasoning run',
        operationId: 'replayReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'Stored run payload' } },
      },
    },
    '/v1/reasoning-runtime/analytics': {
      get: {
        summary: 'Reasoning Runtime analytics',
        operationId: 'getReasoningRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/reasoning-runtime/monitoring': {
      get: {
        summary: 'Reasoning Runtime monitoring',
        operationId: 'getReasoningRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty' } },
      },
    },
    '/v1/agent-runtime/engine': {
      get: {
        summary: 'Agent Runtime catalog',
        operationId: 'getAgentRuntimeEngine',
        responses: {
          '200': { description: 'Agent sandbox capabilities, permissions, honesty' },
        },
      },
    },
    '/v1/agent-runtime/permissions': {
      get: {
        summary: 'Agent Runtime grantable permissions',
        operationId: 'listAgentRuntimePermissions',
        responses: { '200': { description: 'Allowlist + denied actions' } },
      },
    },
    '/v1/agent-runtime/agents': {
      get: {
        summary: 'List agents',
        operationId: 'listAgentRuntimeAgents',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace agents' } },
      },
      post: {
        summary: 'Create agent',
        operationId: 'createAgentRuntimeAgent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Agent created (draft)' } },
      },
    },
    '/v1/agent-runtime/agents/{id}': {
      get: {
        summary: 'Get agent',
        operationId: 'getAgentRuntimeAgent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Agent' } },
      },
    },
    '/v1/agent-runtime/agents/{id}/lifecycle': {
      post: {
        summary: 'Update agent lifecycle',
        operationId: 'lifecycleAgentRuntimeAgent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Lifecycle updated' } },
      },
    },
    '/v1/agent-runtime/run': {
      post: {
        summary: 'Run agent (sandbox + hard permissions)',
        operationId: 'runAgentRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Sandbox run result' },
          '403': { description: 'Permission/policy hard deny' },
        },
      },
    },
    '/v1/agent-runtime/collaborate': {
      post: {
        summary: 'Sandbox multi-agent collaboration',
        operationId: 'collaborateAgentRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Collaboration session' } },
      },
    },
    '/v1/agent-runtime/schedule': {
      post: {
        summary: 'Schedule agent run (record only)',
        operationId: 'scheduleAgentRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Schedule recorded' } },
      },
    },
    '/v1/agent-runtime/memory': {
      post: {
        summary: 'Put agent memory',
        operationId: 'putAgentRuntimeMemory',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Memory stored via Memory Runtime' } },
      },
    },
    '/v1/agent-runtime/marketplace': {
      get: {
        summary: 'Agent marketplace counts',
        operationId: 'getAgentRuntimeMarketplace',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Listing counts' } },
      },
    },
    '/v1/agent-runtime/analytics': {
      get: {
        summary: 'Agent Runtime analytics',
        operationId: 'getAgentRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/agent-runtime/monitoring': {
      get: {
        summary: 'Agent Runtime monitoring',
        operationId: 'getAgentRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + safety' } },
      },
    },
    '/v1/workflow-runtime/engine': {
      get: {
        summary: 'Workflow Runtime catalog',
        operationId: 'getWorkflowRuntimeEngine',
        responses: { '200': { description: 'Catalog + honesty + ceilings' } },
      },
    },
    '/v1/workflow-runtime/permissions': {
      get: {
        summary: 'Workflow Runtime grantable/denied permissions',
        operationId: 'listWorkflowRuntimePermissions',
        responses: { '200': { description: 'Permission lists' } },
      },
    },
    '/v1/workflow-runtime/workflows': {
      get: {
        summary: 'List kernel workflows',
        operationId: 'listWorkflowRuntimeWorkflows',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workflows' } },
      },
      post: {
        summary: 'Create kernel workflow',
        operationId: 'createWorkflowRuntimeWorkflow',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/v1/workflow-runtime/workflows/{id}': {
      get: {
        summary: 'Get kernel workflow',
        operationId: 'getWorkflowRuntimeWorkflow',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Workflow' } },
      },
    },
    '/v1/workflow-runtime/workflows/{id}/lifecycle': {
      post: {
        summary: 'Update workflow lifecycle',
        operationId: 'lifecycleWorkflowRuntimeWorkflow',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/v1/workflow-runtime/workflows/{id}/version': {
      post: {
        summary: 'Bump workflow version',
        operationId: 'versionWorkflowRuntimeWorkflow',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Versioned' } },
      },
    },
    '/v1/workflow-runtime/run': {
      post: {
        summary: 'Run sandbox workflow',
        operationId: 'runWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox run result' } },
      },
    },
    '/v1/workflow-runtime/approve': {
      post: {
        summary: 'Record sandbox human approval',
        operationId: 'approveWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Approval' } },
      },
    },
    '/v1/workflow-runtime/schedule': {
      post: {
        summary: 'Schedule sandbox workflow',
        operationId: 'scheduleWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Schedule' } },
      },
    },
    '/v1/workflow-runtime/rollback': {
      post: {
        summary: 'Rollback sandbox workflow run',
        operationId: 'rollbackWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Rolled back' } },
      },
    },
    '/v1/workflow-runtime/replay': {
      post: {
        summary: 'Replay sandbox workflow run',
        operationId: 'replayWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Replay' } },
      },
    },
    '/v1/workflow-runtime/analytics': {
      get: {
        summary: 'Workflow Runtime analytics',
        operationId: 'getWorkflowRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/workflow-runtime/monitoring': {
      get: {
        summary: 'Workflow Runtime monitoring',
        operationId: 'getWorkflowRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + safety' } },
      },
    },
    '/v1/plugin-runtime/engine': {
      get: {
        summary: 'Plugin Runtime catalog',
        operationId: 'getPluginRuntimeEngine',
        responses: { '200': { description: 'Catalog + honesty + ceilings' } },
      },
    },
    '/v1/plugin-runtime/permissions': {
      get: {
        summary: 'Plugin Runtime grantable/denied permissions',
        operationId: 'listPluginRuntimePermissions',
        responses: { '200': { description: 'Permission lists' } },
      },
    },
    '/v1/plugin-runtime/plugins': {
      get: {
        summary: 'List registered plugins',
        operationId: 'listPluginRuntimePlugins',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Plugins' } },
      },
      post: {
        summary: 'Register a sandbox plugin',
        operationId: 'registerPluginRuntimePlugin',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Registered' } },
      },
    },
    '/v1/plugin-runtime/plugins/{id}': {
      get: {
        summary: 'Get plugin',
        operationId: 'getPluginRuntimePlugin',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Plugin' } },
      },
    },
    '/v1/plugin-runtime/plugins/{id}/lifecycle': {
      post: {
        summary: 'Update plugin lifecycle',
        operationId: 'lifecyclePluginRuntimePlugin',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/v1/plugin-runtime/plugins/{id}/version': {
      post: {
        summary: 'Bump plugin version',
        operationId: 'versionPluginRuntimePlugin',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Versioned' } },
      },
    },
    '/v1/plugin-runtime/invoke': {
      post: {
        summary: 'Invoke sandbox plugin',
        operationId: 'invokePluginRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox invoke result' } },
      },
    },
    '/v1/plugin-runtime/marketplace': {
      get: {
        summary: 'Plugin marketplace counts',
        operationId: 'getPluginRuntimeMarketplace',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Listing counts' } },
      },
    },
    '/v1/plugin-runtime/analytics': {
      get: {
        summary: 'Plugin Runtime analytics',
        operationId: 'getPluginRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/plugin-runtime/monitoring': {
      get: {
        summary: 'Plugin Runtime monitoring',
        operationId: 'getPluginRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + safety' } },
      },
    },
    '/v1/policy-runtime/engine': {
      get: {
        summary: 'Policy Runtime catalog',
        operationId: 'getPolicyRuntimeEngine',
        responses: { '200': { description: 'Catalog + honesty + ceilings' } },
      },
    },
    '/v1/policy-runtime/kinds': {
      get: {
        summary: 'Policy kinds and global denies',
        operationId: 'listPolicyRuntimeKinds',
        responses: { '200': { description: 'Kinds' } },
      },
    },
    '/v1/policy-runtime/policies': {
      get: {
        summary: 'List workspace policies',
        operationId: 'listPolicyRuntimePolicies',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Policies' } },
      },
      post: {
        summary: 'Create workspace policy',
        operationId: 'createPolicyRuntimePolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/v1/policy-runtime/policies/{id}': {
      get: {
        summary: 'Get policy',
        operationId: 'getPolicyRuntimePolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Policy' } },
      },
    },
    '/v1/policy-runtime/policies/{id}/enabled': {
      post: {
        summary: 'Enable or disable policy',
        operationId: 'enablePolicyRuntimePolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/v1/policy-runtime/evaluate': {
      post: {
        summary: 'Evaluate policy hard-gate decision',
        operationId: 'evaluatePolicyRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Allow/deny decision (hardGate)' } },
      },
    },
    '/v1/policy-runtime/analytics': {
      get: {
        summary: 'Policy Runtime analytics',
        operationId: 'getPolicyRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/policy-runtime/monitoring': {
      get: {
        summary: 'Policy Runtime monitoring',
        operationId: 'getPolicyRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + wiring' } },
      },
    },
    '/v1/inference-cloud/overview': {
      get: {
        summary: 'Inference Cloud org overview',
        operationId: 'getInferenceOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session chat/embeddings usage, products, deferred flags, spend-safety notes',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/gpu-platform/engine': {
      get: {
        summary: 'GPU Platform catalog',
        operationId: 'getGpuPlatformEngine',
        responses: {
          '200': {
            description: 'Capabilities, ceilings, and spend-safety honesty',
          },
        },
      },
    },
    '/v1/gpu-platform/vendors': {
      get: {
        summary: 'GPU vendors',
        operationId: 'listGpuVendors',
        responses: { '200': { description: 'NVIDIA/AMD/Intel sandbox vendor tags' } },
      },
    },
    '/v1/gpu-platform/pools': {
      get: {
        summary: 'Sandbox GPU pools',
        operationId: 'listGpuPools',
        responses: { '200': { description: 'Logical sandbox pool catalog' } },
      },
    },
    '/v1/gpu-platform/ceilings': {
      get: {
        summary: 'Hard GPU instance/spend ceilings',
        operationId: 'getGpuCeilings',
        responses: { '200': { description: 'maxInstances + maxSpendUsd + provisionMode' } },
      },
    },
    '/v1/gpu-platform/allocations': {
      get: {
        summary: 'List sandbox GPU allocations',
        operationId: 'listGpuAllocations',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace allocations' } },
      },
      post: {
        summary: 'Create sandbox GPU allocation (ceiling-enforced)',
        operationId: 'createGpuAllocation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Logical allocation created' },
          '402': { description: 'Hard instance or spend ceiling exceeded' },
          '403': { description: 'Provision mode disabled' },
        },
      },
    },
    '/v1/gpu-platform/allocations/{id}/scale': {
      post: {
        summary: 'Scale allocation toward target (hard-clamped)',
        operationId: 'scaleGpuAllocation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Scaled or clamped to ceiling' },
          '402': { description: 'Hard ceiling prevents scale' },
        },
      },
    },
    '/v1/gpu-platform/allocations/{id}/release': {
      post: {
        summary: 'Release sandbox GPU allocation',
        operationId: 'releaseGpuAllocation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Released' } },
      },
    },
    '/v1/gpu-platform/health': {
      get: {
        summary: 'GPU Platform health',
        operationId: 'getGpuPlatformHealth',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox health snapshot' } },
      },
    },
    '/v1/gpu-platform/costs': {
      get: {
        summary: 'Estimated GPU costs',
        operationId: 'getGpuPlatformCosts',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Estimated USD from sandbox rates' } },
      },
    },
    '/v1/gpu-platform/analytics': {
      get: {
        summary: 'GPU Platform analytics',
        operationId: 'getGpuPlatformAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Allocation aggregates' } },
      },
    },
    '/v1/gpu-platform/monitoring': {
      get: {
        summary: 'GPU Platform monitoring',
        operationId: 'getGpuPlatformMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + spend-safety snapshot' } },
      },
    },
    '/v1/model-serving/engine': {
      get: {
        summary: 'Model Serving catalog',
        operationId: 'getModelServingEngine',
        responses: {
          '200': {
            description: 'Capabilities, honesty, and sandbox deployment ceilings',
          },
        },
      },
    },
    '/v1/model-serving/kinds': {
      get: {
        summary: 'Serving model kinds',
        operationId: 'listModelServingKinds',
        responses: {
          '200': {
            description: 'LLM/speech/voice/OCR/embedding/vision/reasoning map',
          },
        },
      },
    },
    '/v1/model-serving/modes': {
      get: {
        summary: 'Serving modes',
        operationId: 'listModelServingModes',
        responses: {
          '200': {
            description: 'Streaming/batch/realtime/canary/blue-green/rollback/versioning',
          },
        },
      },
    },
    '/v1/model-serving/ceilings': {
      get: {
        summary: 'Model Serving active-deployment ceilings',
        operationId: 'getModelServingCeilings',
        responses: { '200': { description: 'maxActiveDeployments + mode' } },
      },
    },
    '/v1/model-serving/endpoints': {
      get: {
        summary: 'Discoverable Gateway serving endpoints',
        operationId: 'listModelServingEndpoints',
        responses: { '200': { description: 'Gateway API + registry model map' } },
      },
    },
    '/v1/model-serving/deployments': {
      get: {
        summary: 'List sandbox model deployments',
        operationId: 'listModelServingDeployments',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace deployments' } },
      },
      post: {
        summary: 'Create sandbox model deployment',
        operationId: 'createModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Logical deployment created' },
          '402': { description: 'Hard active-deployment ceiling exceeded' },
          '403': { description: 'Serving mode disabled' },
        },
      },
    },
    '/v1/model-serving/deployments/{id}/traffic': {
      post: {
        summary: 'Update sandbox canary traffic percent',
        operationId: 'setModelServingTraffic',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Traffic percent updated' } },
      },
    },
    '/v1/model-serving/deployments/{id}/promote': {
      post: {
        summary: 'Promote canary/blue-green deployment to active',
        operationId: 'promoteModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Promoted to active@100%' } },
      },
    },
    '/v1/model-serving/deployments/{id}/rollback': {
      post: {
        summary: 'Rollback to previous sandbox version',
        operationId: 'rollbackModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Prior version activated' } },
      },
    },
    '/v1/model-serving/deployments/{id}/release': {
      post: {
        summary: 'Release sandbox model deployment',
        operationId: 'releaseModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Released' } },
      },
    },
    '/v1/model-serving/deployments/{id}/redeploy': {
      post: {
        summary: 'Deploy a new version with previousVersion pointer',
        operationId: 'redeployModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '201': { description: 'New version created' } },
      },
    },
    '/v1/model-serving/health': {
      get: {
        summary: 'Model Serving health',
        operationId: 'getModelServingHealth',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox health snapshot' } },
      },
    },
    '/v1/model-serving/analytics': {
      get: {
        summary: 'Model Serving analytics',
        operationId: 'getModelServingAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Deployment aggregates' } },
      },
    },
    '/v1/model-serving/monitoring': {
      get: {
        summary: 'Model Serving monitoring',
        operationId: 'getModelServingMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/ai-router/engine': {
      get: {
        summary: 'AI Router catalog',
        operationId: 'getAiRouterEngine',
        responses: {
          '200': {
            description: 'Capabilities, honesty, and spend-safety notes',
          },
        },
      },
    },
    '/v1/ai-router/features': {
      get: {
        summary: 'Routable inference features',
        operationId: 'listAiRouterFeatures',
        responses: { '200': { description: 'Feature → gateway API map' } },
      },
    },
    '/v1/ai-router/providers': {
      get: {
        summary: 'Router provider IDs',
        operationId: 'listAiRouterProviders',
        responses: { '200': { description: 'Gateway provider IDs used by router' } },
      },
    },
    '/v1/ai-router/policies': {
      get: {
        summary: 'Workspace AI Router policy',
        operationId: 'getAiRouterPolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace policy or defaults' } },
      },
      put: {
        summary: 'Upsert workspace AI Router policy',
        operationId: 'upsertAiRouterPolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Policy saved' },
          '403': { description: 'Router mode disabled' },
        },
      },
    },
    '/v1/ai-router/resolve': {
      post: {
        summary: 'Dry-run resolve model/provider route',
        operationId: 'resolveAiRouter',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Selected candidate + ordered fallback chain' },
          '503': { description: 'No candidates available' },
        },
      },
    },
    '/v1/ai-router/decisions': {
      get: {
        summary: 'Recent dry-run route decisions',
        operationId: 'listAiRouterDecisions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision log' } },
      },
    },
    '/v1/ai-router/analytics': {
      get: {
        summary: 'AI Router analytics',
        operationId: 'getAiRouterAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision aggregates' } },
      },
    },
    '/v1/ai-router/monitoring': {
      get: {
        summary: 'AI Router monitoring',
        operationId: 'getAiRouterMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/streaming-runtime/engine': {
      get: {
        summary: 'Streaming Runtime catalog',
        operationId: 'getStreamingRuntimeEngine',
        responses: {
          '200': {
            description: 'Capabilities, transports, and honesty flags',
          },
        },
      },
    },
    '/v1/streaming-runtime/surfaces': {
      get: {
        summary: 'Streaming surfaces',
        operationId: 'listStreamingRuntimeSurfaces',
        responses: {
          '200': {
            description: 'Speech/voice/translation/LLM/video/realtime surface map',
          },
        },
      },
    },
    '/v1/streaming-runtime/transports': {
      get: {
        summary: 'Streaming transports',
        operationId: 'listStreamingRuntimeTransports',
        responses: { '200': { description: 'SSE shipped; WebSocket/gRPC deferred' } },
      },
    },
    '/v1/streaming-runtime/sessions': {
      get: {
        summary: 'List sandbox streaming sessions',
        operationId: 'listStreamingSessions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace sessions' } },
      },
      post: {
        summary: 'Create sandbox streaming session',
        operationId: 'createStreamingSession',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Session created' } },
      },
    },
    '/v1/streaming-runtime/sessions/{id}/close': {
      post: {
        summary: 'Close sandbox streaming session',
        operationId: 'closeStreamingSession',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Session closed' } },
      },
    },
    '/v1/streaming-runtime/stream': {
      post: {
        summary: 'Sandbox SSE chunk stream (or redirect to existing product SSE)',
        operationId: 'streamStreamingRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'text/event-stream chunk/redirect/done events' },
        },
      },
    },
    '/v1/streaming-runtime/analytics': {
      get: {
        summary: 'Streaming Runtime analytics',
        operationId: 'getStreamingRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Session aggregates' } },
      },
    },
    '/v1/streaming-runtime/monitoring': {
      get: {
        summary: 'Streaming Runtime monitoring',
        operationId: 'getStreamingRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/batch-runtime/engine': {
      get: {
        summary: 'Batch Runtime catalog',
        operationId: 'getBatchRuntimeEngine',
        responses: {
          '200': {
            description: 'Capabilities, ceilings, and honesty flags',
          },
        },
      },
    },
    '/v1/batch-runtime/kinds': {
      get: {
        summary: 'Batch job kinds',
        operationId: 'listBatchRuntimeKinds',
        responses: {
          '200': {
            description: 'Translation/speech/OCR/embedding/training/video map',
          },
        },
      },
    },
    '/v1/batch-runtime/runs': {
      get: {
        summary: 'List batch runs',
        operationId: 'listBatchRuns',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace runs (priority-ordered)' } },
      },
      post: {
        summary: 'Create batch run',
        operationId: 'createBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Run created (translation may delegate to BullMQ)' },
          '402': { description: 'Hard item ceiling exceeded' },
        },
      },
    },
    '/v1/batch-runtime/runs/{id}': {
      get: {
        summary: 'Get batch run',
        operationId: 'getBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Run detail' } },
      },
    },
    '/v1/batch-runtime/runs/{id}/start': {
      post: {
        summary: 'Start a scheduled batch run',
        operationId: 'startBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Scheduled run started' } },
      },
    },
    '/v1/batch-runtime/runs/{id}/checkpoint': {
      post: {
        summary: 'Update sandbox checkpoint cursor',
        operationId: 'checkpointBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Checkpoint updated' } },
      },
    },
    '/v1/batch-runtime/runs/{id}/retry': {
      post: {
        summary: 'Retry batch run within hard budget',
        operationId: 'retryBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Retried' },
          '402': { description: 'Retry budget exhausted' },
        },
      },
    },
    '/v1/batch-runtime/analytics': {
      get: {
        summary: 'Batch Runtime analytics',
        operationId: 'getBatchRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Run aggregates' } },
      },
    },
    '/v1/batch-runtime/monitoring': {
      get: {
        summary: 'Batch Runtime monitoring',
        operationId: 'getBatchRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/intelligent-cache/engine': {
      get: {
        summary: 'Intelligent Cache catalog',
        operationId: 'getIntelligentCacheEngine',
        responses: {
          '200': {
            description: 'Namespaces, ceilings, and honesty flags',
          },
        },
      },
    },
    '/v1/intelligent-cache/namespaces': {
      get: {
        summary: 'Cache namespaces',
        operationId: 'listIntelligentCacheNamespaces',
        responses: {
          '200': {
            description: 'Semantic/translation/embedding/speech/voice/document/prompt/context',
          },
        },
      },
    },
    '/v1/intelligent-cache/ceilings': {
      get: {
        summary: 'Cache entry/TTL ceilings',
        operationId: 'getIntelligentCacheCeilings',
        responses: { '200': { description: 'maxEntriesPerWorkspace + defaultTtlSec' } },
      },
    },
    '/v1/intelligent-cache/entries': {
      get: {
        summary: 'List active cache entries',
        operationId: 'listIntelligentCacheEntries',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace entries (values omitted)' } },
      },
    },
    '/v1/intelligent-cache/put': {
      post: {
        summary: 'Put cache entry',
        operationId: 'putIntelligentCacheEntry',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Entry stored' },
          '402': { description: 'Hard entry ceiling exceeded' },
        },
      },
    },
    '/v1/intelligent-cache/lookup': {
      post: {
        summary: 'Lookup cache entry (exact key / normalized hash)',
        operationId: 'lookupIntelligentCacheEntry',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Hit or miss' } },
      },
    },
    '/v1/intelligent-cache/invalidate': {
      post: {
        summary: 'Invalidate cache entries',
        operationId: 'invalidateIntelligentCache',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Deleted count' } },
      },
    },
    '/v1/intelligent-cache/analytics': {
      get: {
        summary: 'Intelligent Cache analytics',
        operationId: 'getIntelligentCacheAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Hit/entry aggregates' } },
      },
    },
    '/v1/intelligent-cache/monitoring': {
      get: {
        summary: 'Intelligent Cache monitoring',
        operationId: 'getIntelligentCacheMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/cost-optimization/engine': {
      get: {
        summary: 'Cost Optimization Engine catalog',
        operationId: 'getCostOptimizationEngine',
        responses: {
          '200': {
            description: 'Ceilings, honesty, and spend-enforcement flags',
          },
        },
      },
    },
    '/v1/cost-optimization/ceilings': {
      get: {
        summary: 'Default hard spend ceilings',
        operationId: 'getCostOptimizationCeilings',
        responses: { '200': { description: 'Daily/monthly default caps' } },
      },
    },
    '/v1/cost-optimization/budgets': {
      get: {
        summary: 'Get workspace cost budget',
        operationId: 'getCostOptimizationBudget',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace budget' } },
      },
      put: {
        summary: 'Upsert workspace cost budget',
        operationId: 'upsertCostOptimizationBudget',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Budget persisted' } },
      },
    },
    '/v1/cost-optimization/check': {
      post: {
        summary: 'Check spend against hard caps',
        operationId: 'checkCostOptimizationSpend',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Gate result' },
          '402': { description: 'Hard spend ceiling exceeded' },
        },
      },
    },
    '/v1/cost-optimization/record': {
      post: {
        summary: 'Record spend (enforces caps)',
        operationId: 'recordCostOptimizationSpend',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Spend recorded' },
          '402': { description: 'Hard spend ceiling exceeded' },
        },
      },
    },
    '/v1/cost-optimization/optimize': {
      post: {
        summary: 'Cost-preferring route plan',
        operationId: 'optimizeCostOptimizationRoute',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Cheapest candidates + spend gate' } },
      },
    },
    '/v1/cost-optimization/gpu': {
      get: {
        summary: 'GPU cost view + scale advice',
        operationId: 'getCostOptimizationGpu',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'GPU ceilings + workspace spend' } },
      },
    },
    '/v1/cost-optimization/predictions': {
      get: {
        summary: 'Spend predictions + spot/reserved plans',
        operationId: 'getCostOptimizationPredictions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Linear projection + sandbox plans' } },
      },
    },
    '/v1/cost-optimization/reports': {
      get: {
        summary: 'Spend reports',
        operationId: 'getCostOptimizationReports',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Ledger-backed reports' } },
      },
    },
    '/v1/cost-optimization/analytics': {
      get: {
        summary: 'Cost analytics',
        operationId: 'getCostOptimizationAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Utilization aggregates' } },
      },
    },
    '/v1/cost-optimization/monitoring': {
      get: {
        summary: 'Cost Optimization monitoring',
        operationId: 'getCostOptimizationMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/ai-runtime-analytics/engine': {
      get: {
        summary: 'AI Runtime Analytics catalog',
        operationId: 'getAiRuntimeAnalyticsEngine',
        responses: {
          '200': { description: 'Capabilities and honesty flags' },
        },
      },
    },
    '/v1/ai-runtime-analytics/overview': {
      get: {
        summary: 'Runtime analytics overview',
        operationId: 'getAiRuntimeAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Bundled Inference Cloud aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/latency': {
      get: {
        summary: 'Runtime latency proxies',
        operationId: 'getAiRuntimeAnalyticsLatency',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'p50/p95 latency proxies' } },
      },
    },
    '/v1/ai-runtime-analytics/throughput': {
      get: {
        summary: 'Runtime throughput',
        operationId: 'getAiRuntimeAnalyticsThroughput',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decisions/usage/batch/streaming rates' } },
      },
    },
    '/v1/ai-runtime-analytics/gpu': {
      get: {
        summary: 'GPU usage aggregates',
        operationId: 'getAiRuntimeAnalyticsGpu',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox GPU allocation aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/cpu': {
      get: {
        summary: 'CPU host/process snapshot',
        operationId: 'getAiRuntimeAnalyticsCpu',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Nest host/process CPU snapshot' } },
      },
    },
    '/v1/ai-runtime-analytics/cache': {
      get: {
        summary: 'Cache hit/miss aggregates',
        operationId: 'getAiRuntimeAnalyticsCache',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Intelligent Cache hit rates' } },
      },
    },
    '/v1/ai-runtime-analytics/requests': {
      get: {
        summary: 'Request counts',
        operationId: 'getAiRuntimeAnalyticsRequests',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Request aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/errors': {
      get: {
        summary: 'Error proxies',
        operationId: 'getAiRuntimeAnalyticsErrors',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Failed batch/streaming + audit proxies' } },
      },
    },
    '/v1/ai-runtime-analytics/cost': {
      get: {
        summary: 'Runtime cost aggregates',
        operationId: 'getAiRuntimeAnalyticsCost',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Ledger + GPU hourly (report-only)' } },
      },
    },
    '/v1/ai-runtime-analytics/customers': {
      get: {
        summary: 'Customer/workspace activity',
        operationId: 'getAiRuntimeAnalyticsCustomers',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace activity counts' } },
      },
    },
    '/v1/ai-runtime-analytics/models': {
      get: {
        summary: 'Model selection aggregates',
        operationId: 'getAiRuntimeAnalyticsModels',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Router + serving model aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/streaming': {
      get: {
        summary: 'Streaming session aggregates',
        operationId: 'getAiRuntimeAnalyticsStreaming',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Streaming Runtime aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/report': {
      get: {
        summary: 'Bundled runtime analytics report',
        operationId: 'getAiRuntimeAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Full JSON report' } },
      },
    },
    '/v1/ai-runtime-analytics/monitoring': {
      get: {
        summary: 'Runtime analytics monitoring',
        operationId: 'getAiRuntimeAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/knowledge-base/engine': {
      get: {
        summary: 'Enterprise Knowledge Base engine catalog',
        operationId: 'getKnowledgeBaseEngine',
        responses: { '200': { description: 'EKB capabilities and honesty flags' } },
      },
    },
    '/v1/knowledge-base/content-kinds': {
      get: {
        summary: 'Knowledge Base content kinds',
        operationId: 'listKnowledgeBaseContentKinds',
        responses: { '200': { description: 'Shipped and deferred content kinds' } },
      },
    },
    '/v1/knowledge-base/collections': {
      get: {
        summary: 'Workspace knowledge collections',
        operationId: 'listKnowledgeBaseCollections',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Collections for the authenticated workspace' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-base/documents': {
      get: {
        summary: 'List Knowledge Base documents (workspace-scoped)',
        operationId: 'listKnowledgeBaseDocuments',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Documents filtered by collection/tag/contentKind' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-base/analytics': {
      get: {
        summary: 'Knowledge Base analytics',
        operationId: 'getKnowledgeBaseAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace document/chunk counts' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-base/monitoring': {
      get: {
        summary: 'Knowledge Base monitoring',
        operationId: 'getKnowledgeBaseMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Analytics + honesty + deferred capability ids' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-search/engine': {
      get: {
        summary: 'Enterprise Search engine catalog',
        operationId: 'getEnterpriseSearchEngine',
        responses: { '200': { description: 'Search capabilities and honesty flags' } },
      },
    },
    '/v1/enterprise-search/modes': {
      get: {
        summary: 'Enterprise Search modes',
        operationId: 'listEnterpriseSearchModes',
        responses: { '200': { description: 'keyword / semantic / hybrid' } },
      },
    },
    '/v1/enterprise-search/search': {
      post: {
        summary: 'Search knowledge chunks',
        operationId: 'enterpriseSearch',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Ranked hits for the authenticated workspace' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-search/suggest': {
      get: {
        summary: 'Search suggestions',
        operationId: 'enterpriseSearchSuggest',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Filename/tag/collection suggestions' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-search/analytics': {
      get: {
        summary: 'Enterprise Search analytics',
        operationId: 'getEnterpriseSearchAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace search counts' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-search/monitoring': {
      get: {
        summary: 'Enterprise Search monitoring',
        operationId: 'getEnterpriseSearchMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Analytics + honesty + deferred ids' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ontology/engine': {
      get: {
        summary: 'Ontology Platform engine catalog',
        operationId: 'getOntologyEngine',
        responses: { '200': { description: 'Ontology capabilities and honesty flags' } },
      },
    },
    '/v1/ontology/domains': {
      get: {
        summary: 'Ontology domains',
        operationId: 'listOntologyDomains',
        responses: { '200': { description: 'General + deferred vertical domain tags' } },
      },
    },
    '/v1/ontology/concepts': {
      get: {
        summary: 'List ontology concepts',
        operationId: 'listOntologyConcepts',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace-scoped concepts' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create ontology concept',
        operationId: 'createOntologyConcept',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Created concept' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ontology/hierarchies': {
      post: {
        summary: 'Create is_a hierarchy edge',
        operationId: 'createOntologyHierarchy',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Created hierarchy edge' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ontology/synonyms': {
      post: {
        summary: 'Add synonym alias or synonym_of edge',
        operationId: 'createOntologySynonym',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Updated concept / edge' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/taxonomy/engine': {
      get: {
        summary: 'Taxonomy Platform engine catalog',
        operationId: 'getTaxonomyEngine',
        responses: { '200': { description: 'Taxonomy capabilities and honesty flags' } },
      },
    },
    '/v1/taxonomy/content-types': {
      get: {
        summary: 'Taxonomy content types',
        operationId: 'listTaxonomyContentTypes',
        responses: { '200': { description: 'EKB-aligned content kinds' } },
      },
    },
    '/v1/taxonomy/terms': {
      get: {
        summary: 'List taxonomy terms',
        operationId: 'listTaxonomyTerms',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace-scoped terms' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create taxonomy term',
        operationId: 'createTaxonomyTerm',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Created term' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/taxonomy/trees': {
      get: {
        summary: 'Taxonomy trees (roots + one child level)',
        operationId: 'listTaxonomyTrees',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Knowledge trees for workspace' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/taxonomy/assign': {
      post: {
        summary: 'Assign taxonomy term to knowledge document',
        operationId: 'assignTaxonomyTerm',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Assignment created' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/taxonomy/classify': {
      post: {
        summary: 'Heuristic classify document against taxonomy terms',
        operationId: 'classifyTaxonomyDocument',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Matched terms (optional apply)' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-rag/engine': {
      get: {
        summary: 'Enterprise RAG Platform engine catalog',
        operationId: 'getEnterpriseRagEngine',
        responses: { '200': { description: 'RAG capabilities and honesty flags' } },
      },
    },
    '/v1/enterprise-rag/chunk': {
      post: {
        summary: 'Preview RAG chunking windows',
        operationId: 'previewEnterpriseRagChunk',
        responses: { '200': { description: 'Chunk preview (not persisted)' } },
      },
    },
    '/v1/enterprise-rag/retrieve': {
      post: {
        summary: 'Enterprise RAG retrieve with citations',
        operationId: 'retrieveEnterpriseRag',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Ranked passages + citations + context optimization' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-rag/query': {
      post: {
        summary: 'Grounded Enterprise RAG query',
        operationId: 'queryEnterpriseRag',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Grounded answer with citations' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-rag/analytics': {
      get: {
        summary: 'Enterprise RAG analytics',
        operationId: 'getEnterpriseRagAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace RAG analytics' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-rag/monitoring': {
      get: {
        summary: 'Enterprise RAG monitoring',
        operationId: 'getEnterpriseRagMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Honesty + deferred flags' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-memory/engine': {
      get: {
        summary: 'Knowledge Memory engine catalog',
        operationId: 'getKnowledgeMemoryEngine',
        responses: { '200': { description: 'Knowledge Memory capabilities and honesty flags' } },
      },
    },
    '/v1/knowledge-memory/scopes': {
      get: {
        summary: 'Knowledge Memory scopes',
        operationId: 'listKnowledgeMemoryScopes',
        responses: { '200': { description: 'Scope map onto Memory Cloud' } },
      },
    },
    '/v1/knowledge-memory/memories': {
      get: {
        summary: 'List knowledge-layer memories',
        operationId: 'listKnowledgeMemories',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace knowledge memories' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create knowledge-layer memory',
        operationId: 'createKnowledgeMemory',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Created knowledge memory' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-memory/search': {
      post: {
        summary: 'Search knowledge-layer memories',
        operationId: 'searchKnowledgeMemory',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Matching knowledge memories' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-memory/analytics': {
      get: {
        summary: 'Knowledge Memory analytics',
        operationId: 'getKnowledgeMemoryAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace analytics' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-memory/monitoring': {
      get: {
        summary: 'Knowledge Memory monitoring',
        operationId: 'getKnowledgeMemoryMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Honesty + deferred flags' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/engine': {
      get: {
        summary: 'Knowledge Intelligence engine catalog',
        operationId: 'getKnowledgeIntelligenceEngine',
        responses: { '200': { description: 'Capabilities and honesty flags' } },
      },
    },
    '/v1/knowledge-intelligence/insight': {
      get: {
        summary: 'Knowledge Intelligence insight snapshot',
        operationId: 'getKnowledgeIntelligenceInsight',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace knowledge insight' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/discover': {
      post: {
        summary: 'Discover docs/terms/concepts',
        operationId: 'discoverKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Discovery hits' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/link': {
      post: {
        summary: 'Suggest related knowledge documents',
        operationId: 'linkKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Related document links' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/recommend': {
      post: {
        summary: 'Recommend knowledge documents',
        operationId: 'recommendKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Ranked recommendations' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/validate': {
      post: {
        summary: 'Validate knowledge documents',
        operationId: 'validateKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Validation results' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/duplicates': {
      post: {
        summary: 'Detect duplicate knowledge documents',
        operationId: 'duplicatesKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Duplicate pairs' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/confidence': {
      post: {
        summary: 'Heuristic knowledge confidence scores',
        operationId: 'confidenceKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Confidence scores' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/analytics': {
      get: {
        summary: 'Knowledge Intelligence analytics',
        operationId: 'getKnowledgeIntelligenceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Analytics snapshot' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/monitoring': {
      get: {
        summary: 'Knowledge Intelligence monitoring',
        operationId: 'getKnowledgeIntelligenceMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Honesty + deferred flags' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-apis/engine': {
      get: {
        summary: 'Enterprise Knowledge APIs pack catalog',
        operationId: 'getKnowledgeApisEngine',
        responses: { '200': { description: 'API pack capabilities and honesty flags' } },
      },
    },
    '/v1/knowledge-apis/surfaces': {
      get: {
        summary: 'Knowledge Cloud REST/GraphQL surfaces',
        operationId: 'listKnowledgeApisSurfaces',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Surface catalog' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-apis/graphql': {
      get: {
        summary: 'Knowledge Cloud GraphQL query catalog',
        operationId: 'listKnowledgeApisGraphql',
        responses: { '200': { description: 'GraphQL engine queries' } },
      },
    },
    '/v1/knowledge-apis/openapi': {
      get: {
        summary: 'Knowledge OpenAPI path index',
        operationId: 'getKnowledgeApisOpenapi',
        responses: { '200': { description: 'OpenAPI pointer + knowledge paths' } },
      },
    },
    '/v1/knowledge-apis/sdk': {
      get: {
        summary: 'Knowledge SDK method catalog',
        operationId: 'getKnowledgeApisSdk',
        responses: { '200': { description: 'SDK install + methods' } },
      },
    },
    '/v1/knowledge-apis/cli': {
      get: {
        summary: 'Knowledge CLI command catalog',
        operationId: 'getKnowledgeApisCli',
        responses: { '200': { description: 'CLI commands' } },
      },
    },
    '/v1/knowledge-apis/webhooks': {
      get: {
        summary: 'Knowledge webhook event catalog',
        operationId: 'getKnowledgeApisWebhooks',
        responses: { '200': { description: 'Webhook events + signing' } },
      },
    },
    '/v1/knowledge-apis/events/stream': {
      get: {
        summary: 'SSE knowledge audit event tail',
        operationId: 'streamKnowledgeApisEvents',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'text/event-stream' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-apis/analytics': {
      get: {
        summary: 'Knowledge APIs pack analytics',
        operationId: 'getKnowledgeApisAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Pack analytics' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-apis/monitoring': {
      get: {
        summary: 'Knowledge APIs pack monitoring',
        operationId: 'getKnowledgeApisMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Honesty + deferred flags' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-analytics/engine': {
      get: {
        summary: 'Knowledge Analytics catalog',
        operationId: 'getKnowledgeAnalyticsEngine',
        responses: {
          '200': {
            description: 'Capabilities and Language/Speech/Voice/Intelligence separation honesty',
          },
        },
      },
    },
    '/v1/knowledge-analytics/overview': {
      get: {
        summary: 'Knowledge Analytics overview',
        operationId: 'getKnowledgeAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Growth/usage/quality/search/gaps snapshot' } },
      },
    },
    '/v1/knowledge-analytics/growth': {
      get: {
        summary: 'Knowledge growth metrics',
        operationId: 'getKnowledgeAnalyticsGrowth',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Document/chunk growth' } },
      },
    },
    '/v1/knowledge-analytics/usage': {
      get: {
        summary: 'Knowledge Cloud surface usage',
        operationId: 'getKnowledgeAnalyticsUsage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Per-surface audit counts' } },
      },
    },
    '/v1/knowledge-analytics/quality': {
      get: {
        summary: 'Knowledge quality proxies',
        operationId: 'getKnowledgeAnalyticsQuality',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Ready/failed/chunk coverage' } },
      },
    },
    '/v1/knowledge-analytics/search': {
      get: {
        summary: 'Search success metrics',
        operationId: 'getKnowledgeAnalyticsSearch',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Enterprise search hit rates' } },
      },
    },
    '/v1/knowledge-analytics/gaps': {
      get: {
        summary: 'Knowledge gap heuristics',
        operationId: 'getKnowledgeAnalyticsGaps',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Unchunked/failed/unassigned gaps' } },
      },
    },
    '/v1/knowledge-analytics/confidence': {
      get: {
        summary: 'Knowledge confidence averages',
        operationId: 'getKnowledgeAnalyticsConfidence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic confidence bands' } },
      },
    },
    '/v1/knowledge-analytics/relationships': {
      get: {
        summary: 'Knowledge relationship counts',
        operationId: 'getKnowledgeAnalyticsRelationships',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'KG/taxonomy/ontology counts' } },
      },
    },
    '/v1/knowledge-analytics/report': {
      get: {
        summary: 'Bundled Knowledge Analytics report',
        operationId: 'getKnowledgeAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Full JSON report' } },
      },
    },
    '/v1/knowledge-analytics/monitoring': {
      get: {
        summary: 'Knowledge Analytics monitoring snapshot',
        operationId: 'getKnowledgeAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/embedding-cloud/engine': {
      get: {
        summary: 'Embedding Cloud engine catalog',
        operationId: 'getEmbeddingCloudEngine',
        responses: { '200': { description: 'Embedding modalities and capabilities' } },
      },
    },
    '/v1/embedding-cloud/models': {
      get: {
        summary: 'Embedding models catalog',
        operationId: 'listEmbeddingCloudModels',
        responses: { '200': { description: 'Available embedding models' } },
      },
    },
    '/v1/embedding-cloud/modalities': {
      get: {
        summary: 'Embedding modalities',
        operationId: 'listEmbeddingCloudModalities',
        responses: { '200': { description: 'Modality statuses' } },
      },
    },
    '/v1/embedding-cloud/embed': {
      post: {
        summary: 'Create embeddings (Embedding Cloud)',
        operationId: 'createEmbeddingCloudEmbed',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'OpenAI-shaped embedding list + modality' } },
      },
    },
    '/v1/embedding-cloud/analytics': {
      get: {
        summary: 'Embedding Cloud analytics',
        operationId: 'getEmbeddingCloudAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Token/request aggregates' } },
      },
    },
    '/v1/embedding-cloud/monitoring': {
      get: {
        summary: 'Embedding Cloud monitoring snapshot',
        operationId: 'getEmbeddingCloudMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/vector-cloud/engine': {
      get: {
        summary: 'Vector Cloud engine catalog',
        operationId: 'getVectorCloudEngine',
        responses: { '200': { description: 'Vector capabilities and honesty notes' } },
      },
    },
    '/v1/vector-cloud/collections': {
      get: {
        summary: 'Vector collections inventory',
        operationId: 'listVectorCloudCollections',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace knowledge collection' } },
      },
    },
    '/v1/vector-cloud/namespaces': {
      get: {
        summary: 'Vector namespaces',
        operationId: 'listVectorCloudNamespaces',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace as vector namespace' } },
      },
    },
    '/v1/vector-cloud/indexes': {
      get: {
        summary: 'Vector indexes',
        operationId: 'listVectorCloudIndexes',
        responses: { '200': { description: 'pgvector HNSW index catalog' } },
      },
    },
    '/v1/vector-cloud/stats': {
      get: {
        summary: 'Vector inventory stats',
        operationId: 'getVectorCloudStats',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Document/vector counts' } },
      },
    },
    '/v1/vector-cloud/search': {
      post: {
        summary: 'Nearest-neighbor vector search',
        operationId: 'searchVectorCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Ranked cosine hits over knowledge_chunks' } },
      },
    },
    '/v1/vector-cloud/analytics': {
      get: {
        summary: 'Vector Cloud analytics',
        operationId: 'getVectorCloudAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Search audit + inventory aggregates' } },
      },
    },
    '/v1/vector-cloud/monitoring': {
      get: {
        summary: 'Vector Cloud monitoring snapshot',
        operationId: 'getVectorCloudMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/memory-cloud/engine': {
      get: {
        summary: 'Memory Cloud engine catalog',
        operationId: 'getMemoryCloudEngine',
        responses: { '200': { description: 'Memory capabilities and GDPR honesty notes' } },
      },
    },
    '/v1/memory-cloud/scopes': {
      get: {
        summary: 'Memory scopes and kinds',
        operationId: 'listMemoryCloudScopes',
        responses: { '200': { description: 'Supported scopes/kinds' } },
      },
    },
    '/v1/memory-cloud/memories': {
      get: {
        summary: 'List memory records',
        operationId: 'listMemoryCloudMemories',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Active memories' } },
      },
      post: {
        summary: 'Create memory record',
        operationId: 'createMemoryCloudMemory',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created memory' } },
      },
    },
    '/v1/memory-cloud/search': {
      post: {
        summary: 'Search memories',
        operationId: 'searchMemoryCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Text search hits' } },
      },
    },
    '/v1/memory-cloud/export': {
      post: {
        summary: 'GDPR export memories',
        operationId: 'exportMemoryCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Subject/workspace memory export' } },
      },
    },
    '/v1/memory-cloud/erase': {
      post: {
        summary: 'GDPR erase memories',
        operationId: 'eraseMemoryCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Erased memory count' } },
      },
    },
    '/v1/memory-cloud/analytics': {
      get: {
        summary: 'Memory Cloud analytics',
        operationId: 'getMemoryCloudAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Counts and audit aggregates' } },
      },
    },
    '/v1/memory-cloud/monitoring': {
      get: {
        summary: 'Memory Cloud monitoring snapshot',
        operationId: 'getMemoryCloudMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/knowledge-graph/engine': {
      get: {
        summary: 'Knowledge Graph engine catalog',
        operationId: 'getKnowledgeGraphEngine',
        responses: { '200': { description: 'Capabilities and Neo4j/ontology honesty notes' } },
      },
    },
    '/v1/knowledge-graph/domains': {
      get: {
        summary: 'Knowledge Graph domains',
        operationId: 'listKnowledgeGraphDomains',
        responses: { '200': { description: 'General shipped; vertical packs deferred' } },
      },
    },
    '/v1/knowledge-graph/entities': {
      get: {
        summary: 'List graph entities',
        operationId: 'listKnowledgeGraphEntities',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Entity list' } },
      },
      post: {
        summary: 'Create graph entity',
        operationId: 'createKnowledgeGraphEntity',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created entity' } },
      },
    },
    '/v1/knowledge-graph/relationships': {
      get: {
        summary: 'List graph relationships',
        operationId: 'listKnowledgeGraphRelationships',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Edge list' } },
      },
      post: {
        summary: 'Create graph relationship',
        operationId: 'createKnowledgeGraphRelationship',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created edge' } },
      },
    },
    '/v1/knowledge-graph/analytics': {
      get: {
        summary: 'Knowledge Graph analytics',
        operationId: 'getKnowledgeGraphAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Entity/edge counts' } },
      },
    },
    '/v1/knowledge-graph/monitoring': {
      get: {
        summary: 'Knowledge Graph monitoring snapshot',
        operationId: 'getKnowledgeGraphMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/context-engine/engine': {
      get: {
        summary: 'Context Engine catalog',
        operationId: 'getContextEngine',
        responses: { '200': { description: 'Capabilities and infinite-context honesty notes' } },
      },
    },
    '/v1/context-engine/sources': {
      get: {
        summary: 'Context sources catalog',
        operationId: 'listContextEngineSources',
        responses: { '200': { description: 'Assemblable context sources' } },
      },
    },
    '/v1/context-engine/assemble': {
      post: {
        summary: 'Assemble AI request context',
        operationId: 'assembleContextEngine',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Compressed multi-source promptContext' } },
      },
    },
    '/v1/context-engine/analytics': {
      get: {
        summary: 'Context Engine analytics',
        operationId: 'getContextEngineAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Assemble audit aggregates' } },
      },
    },
    '/v1/context-engine/monitoring': {
      get: {
        summary: 'Context Engine monitoring snapshot',
        operationId: 'getContextEngineMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/reasoning-cloud/engine': {
      get: {
        summary: 'Reasoning Cloud engine catalog',
        operationId: 'getReasoningCloudEngine',
        responses: { '200': { description: 'Strategies and reasoner-kernel honesty notes' } },
      },
    },
    '/v1/reasoning-cloud/strategies': {
      get: {
        summary: 'Reasoning strategies catalog',
        operationId: 'listReasoningCloudStrategies',
        responses: { '200': { description: 'Prompt strategies + tool catalog' } },
      },
    },
    '/v1/reasoning-cloud/reason': {
      post: {
        summary: 'Run multi-step reasoning',
        operationId: 'reasonReasoningCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Steps, answer, optional branches/tools' } },
      },
    },
    '/v1/reasoning-cloud/analytics': {
      get: {
        summary: 'Reasoning Cloud analytics',
        operationId: 'getReasoningCloudAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Reason audits + chat token proxy' } },
      },
    },
    '/v1/reasoning-cloud/monitoring': {
      get: {
        summary: 'Reasoning Cloud monitoring snapshot',
        operationId: 'getReasoningCloudMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/recommendation-engine/engine': {
      get: {
        summary: 'Recommendation Engine catalog',
        operationId: 'getRecommendationEngine',
        responses: { '200': { description: 'Kinds and retail-recommender honesty notes' } },
      },
    },
    '/v1/recommendation-engine/kinds': {
      get: {
        summary: 'Recommendable kinds',
        operationId: 'listRecommendationEngineKinds',
        responses: { '200': { description: 'Supported recommendation kinds' } },
      },
    },
    '/v1/recommendation-engine/recommend': {
      post: {
        summary: 'Rank recommendations',
        operationId: 'recommendRecommendationEngine',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Scored items from light rankers' } },
      },
    },
    '/v1/recommendation-engine/analytics': {
      get: {
        summary: 'Recommendation Engine analytics',
        operationId: 'getRecommendationEngineAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Recommend audit aggregates' } },
      },
    },
    '/v1/recommendation-engine/monitoring': {
      get: {
        summary: 'Recommendation Engine monitoring snapshot',
        operationId: 'getRecommendationEngineMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/prompt-intelligence/engine': {
      get: {
        summary: 'Prompt Intelligence catalog',
        operationId: 'getPromptIntelligenceEngine',
        responses: { '200': { description: 'Capabilities and auto-prompt-lab honesty notes' } },
      },
    },
    '/v1/prompt-intelligence/keys': {
      get: {
        summary: 'Managed prompt keys',
        operationId: 'listPromptIntelligenceKeys',
        responses: { '200': { description: 'chat/rag/voice_faq keys' } },
      },
    },
    '/v1/prompt-intelligence/registry': {
      get: {
        summary: 'Workspace prompt registry',
        operationId: 'getPromptIntelligenceRegistry',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Active/fallback status per key' } },
      },
    },
    '/v1/prompt-intelligence/preview': {
      post: {
        summary: 'Preview/resolve a prompt body',
        operationId: 'previewPromptIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Resolved body without LLM call' } },
      },
    },
    '/v1/prompt-intelligence/evaluate': {
      post: {
        summary: 'Heuristic prompt evaluation',
        operationId: 'evaluatePromptIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Score + findings (not LLM-as-judge)' } },
      },
    },
    '/v1/prompt-intelligence/security-scan': {
      post: {
        summary: 'Prompt security pattern scan',
        operationId: 'securityScanPromptIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Injection/secret pattern findings' } },
      },
    },
    '/v1/prompt-intelligence/marketplace': {
      get: {
        summary: 'Prompt marketplace listing counts',
        operationId: 'getPromptIntelligenceMarketplace',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Publisher prompt listing counts' } },
      },
    },
    '/v1/prompt-intelligence/analytics': {
      get: {
        summary: 'Prompt Intelligence analytics',
        operationId: 'getPromptIntelligenceAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Prompt audit aggregates' } },
      },
    },
    '/v1/prompt-intelligence/monitoring': {
      get: {
        summary: 'Prompt Intelligence monitoring snapshot',
        operationId: 'getPromptIntelligenceMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/decision-engine/engine': {
      get: {
        summary: 'AI Decision Engine catalog',
        operationId: 'getDecisionEngine',
        responses: { '200': { description: 'Kinds and BRMS honesty notes' } },
      },
    },
    '/v1/decision-engine/kinds': {
      get: {
        summary: 'Decision kinds',
        operationId: 'listDecisionEngineKinds',
        responses: { '200': { description: 'Supported decision kinds' } },
      },
    },
    '/v1/decision-engine/decide': {
      post: {
        summary: 'Make a bounded decision',
        operationId: 'decideDecisionEngine',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision + confidence from light rules' } },
      },
    },
    '/v1/decision-engine/analytics': {
      get: {
        summary: 'Decision Engine analytics',
        operationId: 'getDecisionEngineAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decide audit aggregates' } },
      },
    },
    '/v1/decision-engine/monitoring': {
      get: {
        summary: 'Decision Engine monitoring snapshot',
        operationId: 'getDecisionEngineMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/ai-orchestration/engine': {
      get: {
        summary: 'AI Orchestration catalog',
        operationId: 'getAiOrchestrationEngine',
        responses: { '200': { description: 'Pipelines and multi-cloud-agent honesty notes' } },
      },
    },
    '/v1/ai-orchestration/pipelines': {
      get: {
        summary: 'Orchestration pipelines',
        operationId: 'listAiOrchestrationPipelines',
        responses: { '200': { description: 'Named e2e pipelines' } },
      },
    },
    '/v1/ai-orchestration/run': {
      post: {
        summary: 'Run an orchestration pipeline',
        operationId: 'runAiOrchestration',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Step results from real gateway/engine calls' } },
      },
    },
    '/v1/ai-orchestration/analytics': {
      get: {
        summary: 'AI Orchestration analytics',
        operationId: 'getAiOrchestrationAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Run audit aggregates' } },
      },
    },
    '/v1/ai-orchestration/monitoring': {
      get: {
        summary: 'AI Orchestration monitoring snapshot',
        operationId: 'getAiOrchestrationMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/intelligence-analytics/engine': {
      get: {
        summary: 'Intelligence Analytics catalog',
        operationId: 'getIntelligenceAnalyticsEngine',
        responses: {
          '200': { description: 'Capabilities and Language/Speech/Voice separation honesty' },
        },
      },
    },
    '/v1/intelligence-analytics/overview': {
      get: {
        summary: 'Intelligence Analytics overview',
        operationId: 'getIntelligenceAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Usage/surfaces/cost/quality snapshot' } },
      },
    },
    '/v1/intelligence-analytics/usage': {
      get: {
        summary: 'Intelligence chat/embeddings usage',
        operationId: 'getIntelligenceAnalyticsUsage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Chat and embeddings usage_events aggregates' } },
      },
    },
    '/v1/intelligence-analytics/surfaces': {
      get: {
        summary: 'Intelligence Cloud surface activity',
        operationId: 'getIntelligenceAnalyticsSurfaces',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Per-surface audit counts' } },
      },
    },
    '/v1/intelligence-analytics/latency': {
      get: {
        summary: 'Intelligence latency proxies',
        operationId: 'getIntelligenceAnalyticsLatency',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'latencyMs from audits when present' } },
      },
    },
    '/v1/intelligence-analytics/quality': {
      get: {
        summary: 'Intelligence quality/confidence proxies',
        operationId: 'getIntelligenceAnalyticsQuality',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Prompt eval scores and decision confidence' } },
      },
    },
    '/v1/intelligence-analytics/routing': {
      get: {
        summary: 'Model/routing decision aggregates',
        operationId: 'getIntelligenceAnalyticsRouting',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision Engine kind/decision counts' } },
      },
    },
    '/v1/intelligence-analytics/costs': {
      get: {
        summary: 'Estimated Intelligence Cloud costs',
        operationId: 'getIntelligenceAnalyticsCosts',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Estimated chat/embeddings USD' } },
      },
    },
    '/v1/intelligence-analytics/report': {
      get: {
        summary: 'Bundled Intelligence Analytics report',
        operationId: 'getIntelligenceAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Full JSON report' } },
      },
    },
    '/v1/intelligence-analytics/monitoring': {
      get: {
        summary: 'Intelligence Analytics monitoring snapshot',
        operationId: 'getIntelligenceAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/tts/engine': {
      get: {
        summary: 'Neural TTS engine catalog',
        operationId: 'getNeuralTtsEngine',
        responses: {
          '200': {
            description: 'Capabilities, engines, and architecture honesty notes',
          },
        },
      },
    },
    '/v1/tts/engine/analytics': {
      get: {
        summary: 'Neural TTS usage analytics',
        operationId: 'getNeuralTtsAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'TTS character usage for the billing period' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/tts/voices': {
      get: {
        summary: 'Enriched Neural TTS voice catalog',
        operationId: 'listNeuralTtsVoices',
        parameters: [
          { name: 'gender', in: 'query', schema: { type: 'string' } },
          { name: 'language', in: 'query', schema: { type: 'string' } },
          { name: 'personality', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Voices with gender, personality, dialect/accent tags',
          },
        },
      },
    },
    '/v1/tts/voices/workspace': {
      get: {
        summary: 'Neural TTS voices including approved workspace clones',
        operationId: 'listNeuralTtsWorkspaceVoices',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Stock + own + approved clone voices' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/tts/synthesize': {
      post: {
        summary: 'Batch neural text-to-speech',
        operationId: 'synthesizeNeuralTts',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'voice'],
                properties: {
                  text: { type: 'string' },
                  voice: { type: 'string' },
                  language: { type: 'string' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Raw audio bytes',
            content: { 'audio/mpeg': { schema: { type: 'string', format: 'binary' } } },
          },
        },
      },
    },
    '/v1/tts/stream': {
      post: {
        summary: 'Streaming neural TTS (chunk SSE after synthesis)',
        operationId: 'streamNeuralTts',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'voice'],
                properties: {
                  text: { type: 'string' },
                  voice: { type: 'string' },
                  language: { type: 'string' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'text/event-stream with meta/audio/done events',
          },
        },
      },
    },
    '/v1/voice-cloning/engine': {
      get: {
        summary: 'Voice Cloning engine catalog',
        operationId: 'getVoiceCloningEngine',
        responses: { '200': { description: 'Capabilities, trust gates, architecture notes' } },
      },
    },
    '/v1/voice-cloning/consent/policy': {
      get: {
        summary: 'Voice cloning consent policy',
        operationId: 'getVoiceCloningConsentPolicy',
        responses: { '200': { description: 'Required consent/ownership/review rules' } },
      },
    },
    '/v1/voice-cloning/library': {
      get: {
        summary: 'Enterprise voice clone library',
        operationId: 'listVoiceCloningLibrary',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace clones with governance metadata' } },
      },
    },
    '/v1/voice-cloning/enroll': {
      post: {
        summary: 'Enroll a voice clone (instant or professional)',
        operationId: 'enrollVoiceClone',
        security: [{ ClerkAuth: [] }],
        responses: { '201': { description: 'Clone pending abuse review' } },
      },
    },
    '/v1/voice-cloning/enroll/stream': {
      post: {
        summary: 'Enroll with SSE progress events',
        operationId: 'enrollVoiceCloneStream',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'text/event-stream enrollment progress' } },
      },
    },
    '/v1/emotion-voice/engine': {
      get: {
        summary: 'Emotion Voice engine catalog',
        operationId: 'getEmotionVoiceEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/emotion-voice/profiles': {
      get: {
        summary: 'Emotion and domain voice profiles',
        operationId: 'listEmotionVoiceProfiles',
        responses: { '200': { description: 'Happy/sad/… and domain tones' } },
      },
    },
    '/v1/emotion-voice/synthesize': {
      post: {
        summary: 'Synthesize speech with an emotion/domain profile',
        operationId: 'synthesizeEmotionVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Raw audio bytes' } },
      },
    },
    '/v1/emotion-voice/stream': {
      post: {
        summary: 'Emotion voice chunk SSE stream',
        operationId: 'streamEmotionVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'text/event-stream' } },
      },
    },
    '/v1/voice-studio/engine': {
      get: {
        summary: 'Voice Studio engine catalog',
        operationId: 'getVoiceStudioEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/voice-studio/library': {
      get: {
        summary: 'Voice Studio library (TTS + clones)',
        operationId: 'getVoiceStudioLibrary',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Voice catalog' } },
      },
    },
    '/v1/voice-studio/ssml/compile': {
      post: {
        summary: 'Compile SSML lite to plain speak/pause plan',
        operationId: 'compileVoiceStudioSsml',
        responses: { '200': { description: 'Compiled plan' } },
      },
    },
    '/v1/voice-studio/pronunciation': {
      get: {
        summary: 'List Voice Studio pronunciation lexicon',
        operationId: 'listVoiceStudioPronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Lexemes' } },
      },
      post: {
        summary: 'Upsert pronunciation lexeme',
        operationId: 'upsertVoiceStudioPronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Lexeme' } },
      },
    },
    '/v1/voice-studio/profiles': {
      get: {
        summary: 'List Voice Studio voice profiles',
        operationId: 'listVoiceStudioProfiles',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Profiles' } },
      },
      post: {
        summary: 'Upsert Voice Studio profile',
        operationId: 'upsertVoiceStudioProfile',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Profile' } },
      },
    },
    '/v1/voice-studio/projects': {
      get: {
        summary: 'List Voice Studio projects',
        operationId: 'listVoiceStudioProjects',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Projects' } },
      },
      post: {
        summary: 'Upsert Voice Studio project',
        operationId: 'upsertVoiceStudioProject',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Project' } },
      },
    },
    '/v1/voice-studio/preview': {
      post: {
        summary: 'Preview studio speech (lexicon + SSML lite)',
        operationId: 'previewVoiceStudio',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Raw audio bytes' } },
      },
    },
    '/v1/voice-studio/generate': {
      post: {
        summary: 'Generate studio speech',
        operationId: 'generateVoiceStudio',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Raw audio bytes' } },
      },
    },
    '/v1/voice-studio/test': {
      post: {
        summary: 'Quick voice test clip',
        operationId: 'testVoiceStudioVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Raw audio bytes' } },
      },
    },
    '/v1/voice-studio/compare': {
      post: {
        summary: 'Compare the same text across voices',
        operationId: 'compareVoiceStudioVoices',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Multi-voice base64 clips' } },
      },
    },
    '/v1/voice-studio/timeline/render': {
      post: {
        summary: 'Render linear timeline clips',
        operationId: 'renderVoiceStudioTimeline',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Linear concat + per-clip audio' } },
      },
    },
    '/v1/voice-enhancement/engine': {
      get: {
        summary: 'Voice Enhancement engine catalog',
        operationId: 'getVoiceEnhancementEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/voice-enhancement/profiles': {
      get: {
        summary: 'Voice Enhancement cleanup profiles',
        operationId: 'listVoiceEnhancementProfiles',
        responses: { '200': { description: 'Mic/podcast/meeting/broadcast/restore profiles' } },
      },
    },
    '/v1/voice-enhancement/echo': {
      get: {
        summary: 'Echo cancellation status (deferred)',
        operationId: 'getVoiceEnhancementEcho',
        responses: { '200': { description: 'Deferred AEC status' } },
      },
    },
    '/v1/voice-enhancement/enhance': {
      post: {
        summary: 'Enhance audio with a cleanup profile',
        operationId: 'enhanceVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'WAV base64 + before/after metrics' } },
      },
    },
    '/v1/voice-enhancement/upscale': {
      post: {
        summary: 'Linear audio upsample',
        operationId: 'upscaleVoiceEnhancement',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Upsampled WAV base64' } },
      },
    },
    '/v1/voice-enhancement/enhance/stream': {
      post: {
        summary: 'Enhance with SSE progress',
        operationId: 'streamEnhanceVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'text/event-stream' } },
      },
    },
    '/v1/voice-biometrics/engine': {
      get: {
        summary: 'Voice Biometrics engine catalog',
        operationId: 'getVoiceBiometricsEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/voice-biometrics/encryption': {
      get: {
        summary: 'Fingerprint encryption-at-rest status',
        operationId: 'getVoiceBiometricsEncryption',
        responses: { '200': { description: 'AES-GCM key configuration status' } },
      },
    },
    '/v1/voice-biometrics/enroll': {
      post: {
        summary: 'Enroll encrypted voice biometric template',
        operationId: 'enrollVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Encrypted enrollment result' } },
      },
    },
    '/v1/voice-biometrics/verify': {
      post: {
        summary: '1:1 voice biometric verify',
        operationId: 'verifyVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Verify score' } },
      },
    },
    '/v1/voice-biometrics/identify': {
      post: {
        summary: '1:N voice biometric identify',
        operationId: 'identifyVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Identify candidates' } },
      },
    },
    '/v1/voice-biometrics/authenticate': {
      post: {
        summary: 'Composite voice authentication decision',
        operationId: 'authenticateVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'accept / step_up / reject' } },
      },
    },
    '/v1/voice-biometrics/anti-spoof': {
      post: {
        summary: 'Heuristic anti-spoof assessment',
        operationId: 'antiSpoofVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Spoof risk (not NIST PAD)' } },
      },
    },
    '/v1/voice-biometrics/liveness': {
      post: {
        summary: 'Heuristic liveness check',
        operationId: 'livenessVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Liveness result (not certified PAD)' } },
      },
    },
    '/v1/voice-biometrics/risk': {
      get: {
        summary: 'Workspace / profile fraud risk score',
        operationId: 'riskVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic risk' } },
      },
    },
    '/v1/voice-marketplace/engine': {
      get: {
        summary: 'Voice Marketplace engine catalog',
        operationId: 'getVoiceMarketplaceEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/voice-marketplace/language-packs': {
      get: {
        summary: 'Curated language voice packs',
        operationId: 'listVoiceMarketplaceLanguagePacks',
        responses: { '200': { description: 'own:* language packs' } },
      },
    },
    '/v1/voice-marketplace/listings': {
      get: {
        summary: 'List voice marketplace listings',
        operationId: 'listVoiceMarketplaceListings',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Published or mine listings' } },
      },
      post: {
        summary: 'Publish a voice SKU / pack',
        operationId: 'publishVoiceMarketplaceListing',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created listing' } },
      },
    },
    '/v1/voice-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install / license a voice listing',
        operationId: 'installVoiceMarketplaceListing',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'License entitlement' } },
      },
    },
    '/v1/voice-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List reviews for a voice listing',
        operationId: 'listVoiceMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Rate / review a voice listing',
        operationId: 'reviewVoiceMarketplaceListing',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Review' } },
      },
    },
    '/v1/voice-marketplace/analytics': {
      get: {
        summary: 'Publisher analytics for voice marketplace',
        operationId: 'voiceMarketplaceAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/voice-analytics/engine': {
      get: {
        summary: 'Voice Analytics engine catalog',
        operationId: 'getVoiceAnalyticsEngine',
        responses: { '200': { description: 'Voice analytics capabilities' } },
      },
    },
    '/v1/voice-analytics/overview': {
      get: {
        summary: 'Voice Analytics overview',
        operationId: 'getVoiceAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Usage + revenue snapshot' } },
      },
    },
    '/v1/voice-analytics/usage': {
      get: {
        summary: 'Voice TTS usage',
        operationId: 'getVoiceAnalyticsUsage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'TTS + voice audit aggregates' } },
      },
    },
    '/v1/voice-analytics/voices': {
      get: {
        summary: 'Voice id frequency + clones',
        operationId: 'getVoiceAnalyticsVoices',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Voice breakdown' } },
      },
    },
    '/v1/voice-analytics/revenue': {
      get: {
        summary: 'Voice Marketplace revenue',
        operationId: 'getVoiceAnalyticsRevenue',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Publisher sale aggregates' } },
      },
    },
    '/v1/voice-analytics/marketplace': {
      get: {
        summary: 'Voice Marketplace analytics slice',
        operationId: 'getVoiceAnalyticsMarketplace',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Marketplace aggregates' } },
      },
    },
    '/v1/voice-analytics/report': {
      get: {
        summary: 'Bundled Voice Analytics report',
        operationId: 'getVoiceAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Enterprise voice report JSON' } },
      },
    },
    '/v1/voice-analytics/monitoring': {
      get: {
        summary: 'Voice Analytics monitoring snapshot',
        operationId: 'getVoiceAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/audio/transcriptions': {
      post: {
        summary: 'Transcribe audio (speech-to-text)',
        operationId: 'createTranscription',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  language: {
                    type: 'string',
                    description: 'Optional ISO-639-1 language hint',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Transcript',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    language: { type: 'string', nullable: true },
                    durationSeconds: { type: 'number' },
                    durationMinutes: { type: 'number' },
                    provider: { type: 'string' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'OPENAI_API_KEY not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/audio/voices': {
      get: {
        summary: 'List TTS voices',
        operationId: 'listVoices',
        responses: {
          '200': {
            description: 'Vendor voice catalog',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          gender: { type: 'string' },
                          languages: { type: 'array', items: { type: 'string' } },
                          provider: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/audio/speech': {
      post: {
        summary: 'Synthesize speech (text-to-speech)',
        operationId: 'createSpeech',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'voice'],
                properties: {
                  text: { type: 'string', maxLength: 4096 },
                  voice: {
                    type: 'string',
                    example: 'alloy',
                    description:
                      'Stock OpenAI voice id, own:* rented African TTS, or clone:{voiceCloneId}',
                  },
                  language: { type: 'string' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Audio bytes',
            content: {
              'audio/mpeg': { schema: { type: 'string', format: 'binary' } },
            },
            headers: {
              'X-Lugemi-Provider': { schema: { type: 'string' } },
              'X-Lugemi-Voice': { schema: { type: 'string' } },
              'X-Lugemi-Characters': { schema: { type: 'string' } },
              'X-Lugemi-Watermark': {
                schema: { type: 'string' },
                description: 'required when synthesizing an approved voice clone',
              },
            },
          },
          '503': {
            description: 'OPENAI_API_KEY / VENDOR_VOICE_CLONE_API_KEY not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/voice-clones': {
      get: {
        summary: 'List voice clones for the workspace',
        operationId: 'listVoiceClones',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Clone profiles' } },
      },
      post: {
        summary: 'Create a voice clone (Pro) with consent + samples; starts pending_review',
        operationId: 'createVoiceClone',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Created pending_review' },
          '402': { description: 'Pro required' },
        },
      },
    },
    '/v1/voice-clones/{id}': {
      get: {
        summary: 'Get a voice clone by id',
        operationId: 'getVoiceClone',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Clone profile' },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/voice-clones/{id}/review': {
      post: {
        summary: 'Abuse-review approve/reject (Pro). Approve calls clone provider (or fixture).',
        operationId: 'reviewVoiceClone',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Updated' },
          '503': { description: 'Clone provider not configured' },
        },
      },
    },
    '/v1/voice-clones/{id}/disable': {
      post: {
        summary: 'Disable a voice clone (abuse / policy)',
        operationId: 'disableVoiceClone',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Disabled' } },
      },
    },
    '/v1/ocr': {
      post: {
        summary: 'Extract text from an image (OCR)',
        operationId: 'extractOcr',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  languageHint: { type: 'string' },
                  source: {
                    type: 'string',
                    description: 'Required with target to translate OCR text',
                  },
                  target: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OCR result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    pages: { type: 'integer' },
                    provider: { type: 'string' },
                    characters: { type: 'integer' },
                    translatedText: { type: 'string', nullable: true },
                    translateProvider: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Vision API key not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/glossary/terms': {
      get: {
        summary: 'List glossary terms',
        operationId: 'listGlossaryTerms',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'source', in: 'query', schema: { type: 'string' } },
          { name: 'target', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Terms for the workspace' } },
      },
      post: {
        summary: 'Create glossary term',
        operationId: 'createGlossaryTerm',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceLang', 'targetLang', 'sourceTerm', 'targetTerm'],
                properties: {
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  sourceTerm: { type: 'string' },
                  targetTerm: { type: 'string' },
                  caseSensitive: { type: 'boolean' },
                  wholeWord: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '409': { description: 'Duplicate' } },
      },
    },
    '/v1/vertical-glossaries': {
      get: {
        summary: 'List platform vertical glossary packs',
        operationId: 'listVerticalGlossaries',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Catalog with preview terms; full terms only after Pro install',
          },
        },
      },
    },
    '/v1/vertical-glossaries/installs': {
      get: {
        summary: 'List vertical glossary installs for the workspace',
        operationId: 'listVerticalGlossaryInstalls',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Install receipts' } },
      },
    },
    '/v1/vertical-glossaries/{id}': {
      get: {
        summary: 'Get a vertical glossary pack',
        operationId: 'getVerticalGlossary',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Pack detail (full terms if Pro or installed)' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/v1/vertical-glossaries/{id}/install': {
      post: {
        summary: 'Install a vertical glossary pack into the workspace (Pro)',
        operationId: 'installVerticalGlossary',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Terms copied into workspace glossary' },
          '402': { description: 'Pro plan required' },
          '403': { description: 'Owner/admin required' },
          '404': { description: 'Pack not found' },
        },
      },
    },
    '/v1/tm/entries': {
      get: {
        summary: 'List translation memory entries',
        operationId: 'listTmEntries',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Approved TM segments' } },
      },
      post: {
        summary: 'Upsert approved TM segment',
        operationId: 'upsertTmEntry',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceLang', 'targetLang', 'sourceText', 'targetText'],
                properties: {
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  sourceText: { type: 'string' },
                  targetText: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Upserted' } },
      },
    },
    '/v1/reviews': {
      get: {
        summary: 'List translation quality reviews',
        operationId: 'listReviews',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'accepted', 'rejected'] } },
          { name: 'needsReview', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { '200': { description: 'Reviews' } },
      },
    },
    '/v1/reviews/{id}/accept': {
      post: {
        summary: 'Accept a review (optionally add to TM)',
        operationId: 'acceptReview',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Accepted' } },
      },
    },
    '/v1/reviews/{id}/reject': {
      post: {
        summary: 'Reject a review',
        operationId: 'rejectReview',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Rejected' } },
      },
    },
    '/v1/localize': {
      post: {
        summary: 'Translate a JSON/YAML i18n document',
        operationId: 'localizeContent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['source', 'target', 'content'],
                properties: {
                  format: { type: 'string', enum: ['json', 'yaml'] },
                  source: { type: 'string' },
                  target: { type: 'string' },
                  content: {},
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Localized content + serialized file' } },
      },
    },
    '/v1/trust-cloud/products': {
      get: {
        summary: 'Trust Cloud products',
        operationId: 'listTrustCloudProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-cloud/engine': {
      get: {
        summary: 'Trust Cloud engine alias',
        operationId: 'getTrustCloudEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-cloud/routing': {
      get: {
        summary: 'Trust Cloud routing',
        operationId: 'getTrustCloudRouting',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-cloud/overview': {
      get: {
        summary: 'Trust Cloud overview',
        operationId: 'getTrustCloudOverview',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-cloud/monitoring': {
      get: {
        summary: 'Trust Cloud monitoring',
        operationId: 'getTrustCloudMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-safety-platform/engine': {
      get: {
        summary: 'AI Safety Platform engine',
        operationId: 'getAiSafetyPlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-safety-platform/products': {
      get: {
        summary: 'AI Safety Platform products',
        operationId: 'listAiSafetyPlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-safety-platform/monitoring': {
      get: {
        summary: 'AI Safety Platform monitoring',
        operationId: 'getAiSafetyPlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-safety-platform/detections': {
      get: {
        summary: 'AI Safety Platform detections',
        operationId: 'listAiSafetyPlatformDetections',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-safety-platform/query': {
      get: {
        summary: 'Query AI Safety Platform',
        operationId: 'queryAiSafetyPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-safety-platform/check': {
      get: {
        summary: 'Check AI Safety Platform',
        operationId: 'checkAiSafetyPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-safety-platform/evaluate': {
      get: {
        summary: 'Evaluate AI Safety Platform',
        operationId: 'evaluateAiSafetyPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-governance-platform/engine': {
      get: {
        summary: 'AI Governance Platform engine',
        operationId: 'getAiGovernancePlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-governance-platform/products': {
      get: {
        summary: 'AI Governance Platform products',
        operationId: 'listAiGovernancePlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-governance-platform/monitoring': {
      get: {
        summary: 'AI Governance Platform monitoring',
        operationId: 'getAiGovernancePlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-governance-platform/approvals': {
      get: {
        summary: 'AI Governance Platform approvals',
        operationId: 'listAiGovernancePlatformApprovals',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-governance-platform/query': {
      get: {
        summary: 'Query AI Governance Platform',
        operationId: 'queryAiGovernancePlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-governance-platform/check': {
      get: {
        summary: 'Check AI Governance Platform',
        operationId: 'checkAiGovernancePlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-governance-platform/approvals/{id}/approve': {
      post: {
        summary: 'Approve governance approval',
        operationId: 'approveAiGovernancePlatformApproval',
        responses: { '200': { description: 'Updated approval' }, '201': { description: 'Updated approval' } },
      },
    },
    '/v1/ai-governance-platform/approvals/{id}/reject': {
      post: {
        summary: 'Reject governance approval',
        operationId: 'rejectAiGovernancePlatformApproval',
        responses: { '200': { description: 'Updated approval' }, '201': { description: 'Updated approval' } },
      },
    },
    '/v1/ai-governance-platform/status/{id}': {
      get: {
        summary: 'Governance approval status',
        operationId: 'getAiGovernancePlatformStatus',
        responses: { '200': { description: 'Approval status' } },
      },
    },
    '/v1/explainability-platform/engine': {
      get: {
        summary: 'Explainability Platform engine',
        operationId: 'getExplainabilityPlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/explainability-platform/products': {
      get: {
        summary: 'Explainability Platform products',
        operationId: 'listExplainabilityPlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/explainability-platform/monitoring': {
      get: {
        summary: 'Explainability Platform monitoring',
        operationId: 'getExplainabilityPlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/explainability-platform/explanations': {
      get: {
        summary: 'List Explainability Platform rows',
        operationId: 'listExplainabilityPlatformRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/explainability-platform/query': {
      get: {
        summary: 'Query Explainability Platform',
        operationId: 'queryExplainabilityPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/privacy-platform/engine': {
      get: {
        summary: 'Privacy Platform engine',
        operationId: 'getPrivacyPlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/privacy-platform/products': {
      get: {
        summary: 'Privacy Platform products',
        operationId: 'listPrivacyPlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/privacy-platform/monitoring': {
      get: {
        summary: 'Privacy Platform monitoring',
        operationId: 'getPrivacyPlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/privacy-platform/assets': {
      get: {
        summary: 'Privacy Platform assets',
        operationId: 'listPrivacyPlatformAssets',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/privacy-platform/query': {
      get: {
        summary: 'Query Privacy Platform',
        operationId: 'queryPrivacyPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/privacy-platform/check': {
      get: {
        summary: 'Check Privacy Platform',
        operationId: 'checkPrivacyPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/privacy-platform/consent-check': {
      get: {
        summary: 'Consent check Privacy Platform',
        operationId: 'consentCheckPrivacyPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/privacy-platform/release': {
      get: {
        summary: 'Release Privacy Platform',
        operationId: 'releasePrivacyPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/compliance-platform/engine': {
      get: {
        summary: 'Compliance Platform engine',
        operationId: 'getCompliancePlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/compliance-platform/products': {
      get: {
        summary: 'Compliance Platform products',
        operationId: 'listCompliancePlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/compliance-platform/monitoring': {
      get: {
        summary: 'Compliance Platform monitoring',
        operationId: 'getCompliancePlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/compliance-platform/controls': {
      get: {
        summary: 'List Compliance Platform rows',
        operationId: 'listCompliancePlatformRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/compliance-platform/query': {
      get: {
        summary: 'Query Compliance Platform',
        operationId: 'queryCompliancePlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/risk-intelligence/engine': {
      get: {
        summary: 'Risk Intelligence engine',
        operationId: 'getRiskIntelligenceEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/risk-intelligence/products': {
      get: {
        summary: 'Risk Intelligence products',
        operationId: 'listRiskIntelligenceProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/risk-intelligence/monitoring': {
      get: {
        summary: 'Risk Intelligence monitoring',
        operationId: 'getRiskIntelligenceMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/risk-intelligence/scores': {
      get: {
        summary: 'List Risk Intelligence rows',
        operationId: 'listRiskIntelligenceRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/risk-intelligence/query': {
      get: {
        summary: 'Query Risk Intelligence',
        operationId: 'queryRiskIntelligence',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/identity-federation/engine': {
      get: {
        summary: 'Identity Federation engine',
        operationId: 'getIdentityFederationEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/identity-federation/products': {
      get: {
        summary: 'Identity Federation products',
        operationId: 'listIdentityFederationProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/identity-federation/monitoring': {
      get: {
        summary: 'Identity Federation monitoring',
        operationId: 'getIdentityFederationMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/identity-federation/federation': {
      get: {
        summary: 'List Identity Federation rows',
        operationId: 'listIdentityFederationRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/identity-federation/query': {
      get: {
        summary: 'Query Identity Federation',
        operationId: 'queryIdentityFederation',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-analytics/engine': {
      get: {
        summary: 'Trust Analytics engine',
        operationId: 'getTrustAnalyticsEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-analytics/products': {
      get: {
        summary: 'Trust Analytics products',
        operationId: 'listTrustAnalyticsProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-analytics/monitoring': {
      get: {
        summary: 'Trust Analytics monitoring',
        operationId: 'getTrustAnalyticsMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-analytics/snapshot': {
      get: {
        summary: 'List Trust Analytics rows',
        operationId: 'listTrustAnalyticsRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/trust-analytics/query': {
      get: {
        summary: 'Query Trust Analytics',
        operationId: 'queryTrustAnalytics',
        responses: { '200': { description: 'OK' } },
      },
    },

    '/v1/platform-engineering-cloud/products': {
      get: {
        summary: 'Platform Engineering products',
        operationId: 'listPlatformEngineeringCloudProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-cloud/engine': {
      get: {
        summary: 'Platform Engineering engine alias',
        operationId: 'getPlatformEngineeringCloudEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-cloud/routing': {
      get: {
        summary: 'Platform Engineering routing',
        operationId: 'getPlatformEngineeringCloudRouting',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-cloud/overview': {
      get: {
        summary: 'Platform Engineering overview',
        operationId: 'getPlatformEngineeringCloudOverview',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-cloud/monitoring': {
      get: {
        summary: 'Platform Engineering monitoring',
        operationId: 'getPlatformEngineeringCloudMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/internal-developer-portal/engine': {
      get: {
        summary: 'Internal Developer Portal engine',
        operationId: 'getInternalDeveloperPortalEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/internal-developer-portal/products': {
      get: {
        summary: 'Internal Developer Portal products',
        operationId: 'listInternalDeveloperPortalProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/internal-developer-portal/monitoring': {
      get: {
        summary: 'Internal Developer Portal monitoring',
        operationId: 'getInternalDeveloperPortalMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/internal-developer-portal/portal': {
      get: {
        summary: 'List Internal Developer Portal rows',
        operationId: 'listInternalDeveloperPortalRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/internal-developer-portal/query': {
      get: {
        summary: 'Query Internal Developer Portal',
        operationId: 'queryInternalDeveloperPortal',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/service-catalog/engine': {
      get: {
        summary: 'Service Catalog engine',
        operationId: 'getServiceCatalogEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/service-catalog/products': {
      get: {
        summary: 'Service Catalog products',
        operationId: 'listServiceCatalogProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/service-catalog/monitoring': {
      get: {
        summary: 'Service Catalog monitoring',
        operationId: 'getServiceCatalogMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/service-catalog/services': {
      get: {
        summary: 'List Service Catalog rows',
        operationId: 'listServiceCatalogRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/service-catalog/query': {
      get: {
        summary: 'Query Service Catalog',
        operationId: 'queryServiceCatalog',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/golden-path-platform/engine': {
      get: {
        summary: 'Golden Path Platform engine',
        operationId: 'getGoldenPathPlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/golden-path-platform/products': {
      get: {
        summary: 'Golden Path Platform products',
        operationId: 'listGoldenPathPlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/golden-path-platform/monitoring': {
      get: {
        summary: 'Golden Path Platform monitoring',
        operationId: 'getGoldenPathPlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/golden-path-platform/templates': {
      get: {
        summary: 'List Golden Path Platform rows',
        operationId: 'listGoldenPathPlatformRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/golden-path-platform/query': {
      get: {
        summary: 'Query Golden Path Platform',
        operationId: 'queryGoldenPathPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gitops-platform/engine': {
      get: {
        summary: 'GitOps Platform engine',
        operationId: 'getGitopsPlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gitops-platform/products': {
      get: {
        summary: 'GitOps Platform products',
        operationId: 'listGitopsPlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gitops-platform/monitoring': {
      get: {
        summary: 'GitOps Platform monitoring',
        operationId: 'getGitopsPlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gitops-platform/readiness': {
      get: {
        summary: 'List GitOps Platform rows',
        operationId: 'listGitopsPlatformRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gitops-platform/query': {
      get: {
        summary: 'Query GitOps Platform',
        operationId: 'queryGitopsPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/release-engineering/engine': {
      get: {
        summary: 'Release Engineering engine',
        operationId: 'getReleaseEngineeringEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/release-engineering/products': {
      get: {
        summary: 'Release Engineering products',
        operationId: 'listReleaseEngineeringProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/release-engineering/monitoring': {
      get: {
        summary: 'Release Engineering monitoring',
        operationId: 'getReleaseEngineeringMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/release-engineering/releases': {
      get: {
        summary: 'List Release Engineering rows',
        operationId: 'listReleaseEngineeringRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/release-engineering/query': {
      get: {
        summary: 'Query Release Engineering',
        operationId: 'queryReleaseEngineering',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/reliability-engineering/engine': {
      get: {
        summary: 'Reliability Engineering engine',
        operationId: 'getReliabilityEngineeringEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/reliability-engineering/products': {
      get: {
        summary: 'Reliability Engineering products',
        operationId: 'listReliabilityEngineeringProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/reliability-engineering/monitoring': {
      get: {
        summary: 'Reliability Engineering monitoring',
        operationId: 'getReliabilityEngineeringMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/reliability-engineering/reliability': {
      get: {
        summary: 'List Reliability Engineering rows',
        operationId: 'listReliabilityEngineeringRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/reliability-engineering/query': {
      get: {
        summary: 'Query Reliability Engineering',
        operationId: 'queryReliabilityEngineering',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/finops-platform/engine': {
      get: {
        summary: 'FinOps Platform engine',
        operationId: 'getFinopsPlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/finops-platform/products': {
      get: {
        summary: 'FinOps Platform products',
        operationId: 'listFinopsPlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/finops-platform/monitoring': {
      get: {
        summary: 'FinOps Platform monitoring',
        operationId: 'getFinopsPlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/finops-platform/costs': {
      get: {
        summary: 'FinOps Platform costs',
        operationId: 'listFinopsPlatformCosts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/finops-platform/budgets': {
      get: {
        summary: 'FinOps Platform budgets',
        operationId: 'listFinopsPlatformBudgets',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/finops-platform/alerts': {
      get: {
        summary: 'FinOps Platform alerts',
        operationId: 'listFinopsPlatformAlerts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/finops-platform/query': {
      get: {
        summary: 'Query FinOps Platform',
        operationId: 'queryFinopsPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/supply-chain-security/engine': {
      get: {
        summary: 'Supply Chain Security engine',
        operationId: 'getSupplyChainSecurityEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/supply-chain-security/products': {
      get: {
        summary: 'Supply Chain Security products',
        operationId: 'listSupplyChainSecurityProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/supply-chain-security/monitoring': {
      get: {
        summary: 'Supply Chain Security monitoring',
        operationId: 'getSupplyChainSecurityMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/supply-chain-security/findings': {
      get: {
        summary: 'Supply Chain Security findings',
        operationId: 'listSupplyChainSecurityFindings',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/supply-chain-security/scan': {
      get: {
        summary: 'Scan Supply Chain Security',
        operationId: 'scanSupplyChainSecurity',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/supply-chain-security/query': {
      get: {
        summary: 'Query Supply Chain Security',
        operationId: 'querySupplyChainSecurity',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/developer-experience-platform/engine': {
      get: {
        summary: 'Developer Experience Platform engine',
        operationId: 'getDeveloperExperiencePlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/developer-experience-platform/products': {
      get: {
        summary: 'Developer Experience Platform products',
        operationId: 'listDeveloperExperiencePlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/developer-experience-platform/monitoring': {
      get: {
        summary: 'Developer Experience Platform monitoring',
        operationId: 'getDeveloperExperiencePlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/developer-experience-platform/devex': {
      get: {
        summary: 'List Developer Experience Platform rows',
        operationId: 'listDeveloperExperiencePlatformRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/developer-experience-platform/query': {
      get: {
        summary: 'Query Developer Experience Platform',
        operationId: 'queryDeveloperExperiencePlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-analytics/engine': {
      get: {
        summary: 'Platform Engineering Analytics engine',
        operationId: 'getPlatformEngineeringAnalyticsEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-analytics/products': {
      get: {
        summary: 'Platform Engineering Analytics products',
        operationId: 'listPlatformEngineeringAnalyticsProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-analytics/monitoring': {
      get: {
        summary: 'Platform Engineering Analytics monitoring',
        operationId: 'getPlatformEngineeringAnalyticsMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-analytics/snapshot': {
      get: {
        summary: 'List Platform Engineering Analytics rows',
        operationId: 'listPlatformEngineeringAnalyticsRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/platform-engineering-analytics/query': {
      get: {
        summary: 'Query Platform Engineering Analytics',
        operationId: 'queryPlatformEngineeringAnalytics',
        responses: { '200': { description: 'OK' } },
      },
    },

    '/v1/control-plane-cloud/products': {
      get: {
        summary: 'Control Plane products',
        operationId: 'listControlPlaneCloudProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-cloud/engine': {
      get: {
        summary: 'Control Plane engine alias',
        operationId: 'getControlPlaneCloudEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-cloud/routing': {
      get: {
        summary: 'Control Plane routing',
        operationId: 'getControlPlaneCloudRouting',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-cloud/overview': {
      get: {
        summary: 'Control Plane overview',
        operationId: 'getControlPlaneCloudOverview',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-cloud/monitoring': {
      get: {
        summary: 'Control Plane monitoring',
        operationId: 'getControlPlaneCloudMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/organization-control/engine': {
      get: {
        summary: 'Organization Control engine',
        operationId: 'getOrganizationControlEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/organization-control/products': {
      get: {
        summary: 'Organization Control products',
        operationId: 'listOrganizationControlProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/organization-control/monitoring': {
      get: {
        summary: 'Organization Control monitoring',
        operationId: 'getOrganizationControlMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/organization-control/organizations': {
      get: {
        summary: 'Organization Control organizations',
        operationId: 'listOrganizationControlOrganizations',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/organization-control/roles': {
      get: {
        summary: 'Organization Control roles',
        operationId: 'listOrganizationControlRoles',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/organization-control/query': {
      get: {
        summary: 'Query Organization Control',
        operationId: 'queryOrganizationControl',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-configuration-platform/engine': {
      get: {
        summary: 'Global Configuration Platform engine',
        operationId: 'getGlobalConfigurationPlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-configuration-platform/products': {
      get: {
        summary: 'Global Configuration Platform products',
        operationId: 'listGlobalConfigurationPlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-configuration-platform/monitoring': {
      get: {
        summary: 'Global Configuration Platform monitoring',
        operationId: 'getGlobalConfigurationPlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-configuration-platform/configurations': {
      get: {
        summary: 'List Global Configuration Platform rows',
        operationId: 'listGlobalConfigurationPlatformRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-configuration-platform/query': {
      get: {
        summary: 'Query Global Configuration Platform',
        operationId: 'queryGlobalConfigurationPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-policy-engine/engine': {
      get: {
        summary: 'Global Policy Engine engine',
        operationId: 'getGlobalPolicyEngineEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-policy-engine/products': {
      get: {
        summary: 'Global Policy Engine products',
        operationId: 'listGlobalPolicyEngineProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-policy-engine/monitoring': {
      get: {
        summary: 'Global Policy Engine monitoring',
        operationId: 'getGlobalPolicyEngineMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-policy-engine/policies': {
      get: {
        summary: 'List Global Policy Engine rows',
        operationId: 'listGlobalPolicyEngineRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-policy-engine/query': {
      get: {
        summary: 'Query Global Policy Engine',
        operationId: 'queryGlobalPolicyEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-deployment-controller/engine': {
      get: {
        summary: 'Global Deployment Controller engine',
        operationId: 'getGlobalDeploymentControllerEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-deployment-controller/products': {
      get: {
        summary: 'Global Deployment Controller products',
        operationId: 'listGlobalDeploymentControllerProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-deployment-controller/monitoring': {
      get: {
        summary: 'Global Deployment Controller monitoring',
        operationId: 'getGlobalDeploymentControllerMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-deployment-controller/deployments': {
      get: {
        summary: 'Global Deployment Controller deployments',
        operationId: 'listGlobalDeploymentControllerDeployments',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-deployment-controller/rollback': {
      get: {
        summary: 'Global Deployment Controller rollback',
        operationId: 'listGlobalDeploymentControllerRollbacks',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-deployment-controller/query': {
      get: {
        summary: 'Query Global Deployment Controller',
        operationId: 'queryGlobalDeploymentController',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-deployment-controller/promote': {
      post: {
        summary: 'Promote deployment (production requires authorization)',
        operationId: 'promoteGlobalDeploymentController',
        responses: { '200': { description: 'OK' }, '201': { description: 'Created' } },
      },
    },
    '/v1/global-routing-controller/engine': {
      get: {
        summary: 'Global Routing Controller engine',
        operationId: 'getGlobalRoutingControllerEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-routing-controller/products': {
      get: {
        summary: 'Global Routing Controller products',
        operationId: 'listGlobalRoutingControllerProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-routing-controller/monitoring': {
      get: {
        summary: 'Global Routing Controller monitoring',
        operationId: 'getGlobalRoutingControllerMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-routing-controller/routes': {
      get: {
        summary: 'List Global Routing Controller rows',
        operationId: 'listGlobalRoutingControllerRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-routing-controller/query': {
      get: {
        summary: 'Query Global Routing Controller',
        operationId: 'queryGlobalRoutingController',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/secrets-certificate-platform/engine': {
      get: {
        summary: 'Secrets & Certificate Platform engine',
        operationId: 'getSecretsCertificatePlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/secrets-certificate-platform/products': {
      get: {
        summary: 'Secrets & Certificate Platform products',
        operationId: 'listSecretsCertificatePlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/secrets-certificate-platform/monitoring': {
      get: {
        summary: 'Secrets & Certificate Platform monitoring',
        operationId: 'getSecretsCertificatePlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/secrets-certificate-platform/secrets': {
      get: {
        summary: 'Secrets & Certificate Platform secrets metadata',
        operationId: 'listSecretsCertificatePlatformSecrets',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/secrets-certificate-platform/metadata': {
      get: {
        summary: 'Secrets & Certificate Platform metadata',
        operationId: 'listSecretsCertificatePlatformMetadata',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/secrets-certificate-platform/audit': {
      get: {
        summary: 'Secrets & Certificate Platform audit',
        operationId: 'listSecretsCertificatePlatformAudit',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/secrets-certificate-platform/query': {
      get: {
        summary: 'Query Secrets & Certificate Platform',
        operationId: 'querySecretsCertificatePlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-scheduler/engine': {
      get: {
        summary: 'Global Scheduler engine',
        operationId: 'getGlobalSchedulerEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-scheduler/products': {
      get: {
        summary: 'Global Scheduler products',
        operationId: 'listGlobalSchedulerProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-scheduler/monitoring': {
      get: {
        summary: 'Global Scheduler monitoring',
        operationId: 'getGlobalSchedulerMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-scheduler/schedules': {
      get: {
        summary: 'List Global Scheduler rows',
        operationId: 'listGlobalSchedulerRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/global-scheduler/query': {
      get: {
        summary: 'Query Global Scheduler',
        operationId: 'queryGlobalScheduler',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-analytics/engine': {
      get: {
        summary: 'Control Plane Analytics engine',
        operationId: 'getControlPlaneAnalyticsEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-analytics/products': {
      get: {
        summary: 'Control Plane Analytics products',
        operationId: 'listControlPlaneAnalyticsProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-analytics/monitoring': {
      get: {
        summary: 'Control Plane Analytics monitoring',
        operationId: 'getControlPlaneAnalyticsMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-analytics/snapshot': {
      get: {
        summary: 'List Control Plane Analytics rows',
        operationId: 'listControlPlaneAnalyticsRows',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/control-plane-analytics/query': {
      get: {
        summary: 'Query Control Plane Analytics',
        operationId: 'queryControlPlaneAnalytics',
        responses: { '200': { description: 'OK' } },
      },
    },

    '/v1/data-plane-cloud/products': {
      get: {
        summary: 'Data Plane products',
        operationId: 'listDataPlaneCloudProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-cloud/engine': {
      get: {
        summary: 'Data Plane engine alias',
        operationId: 'getDataPlaneCloudEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-cloud/routing': {
      get: {
        summary: 'Data Plane routing',
        operationId: 'getDataPlaneCloudRouting',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-cloud/overview': {
      get: {
        summary: 'Data Plane overview',
        operationId: 'getDataPlaneCloudOverview',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-cloud/monitoring': {
      get: {
        summary: 'Data Plane monitoring',
        operationId: 'getDataPlaneCloudMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/translation-runtime/engine': {
      get: {
        summary: 'Translation Runtime engine',
        operationId: 'getTranslationRuntimeEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/translation-runtime/products': {
      get: {
        summary: 'Translation Runtime products',
        operationId: 'listTranslationRuntimeProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/translation-runtime/monitoring': {
      get: {
        summary: 'Translation Runtime monitoring',
        operationId: 'getTranslationRuntimeMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/translation-runtime/routes': {
      get: {
        summary: 'Translation Runtime routes',
        operationId: 'listTranslationRuntimeRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/translation-runtime/route': {
      get: {
        summary: 'Route via Translation Runtime',
        operationId: 'routeTranslationRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/translation-runtime/execute': {
      get: {
        summary: 'Execute via Translation Runtime',
        operationId: 'executeTranslationRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/translation-runtime/query': {
      get: {
        summary: 'Query Translation Runtime',
        operationId: 'queryTranslationRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/speech-runtime/engine': {
      get: {
        summary: 'Speech Runtime engine',
        operationId: 'getSpeechRuntimeEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/speech-runtime/products': {
      get: {
        summary: 'Speech Runtime products',
        operationId: 'listSpeechRuntimeProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/speech-runtime/monitoring': {
      get: {
        summary: 'Speech Runtime monitoring',
        operationId: 'getSpeechRuntimeMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/speech-runtime/routes': {
      get: {
        summary: 'Speech Runtime routes',
        operationId: 'listSpeechRuntimeRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/speech-runtime/route': {
      get: {
        summary: 'Route via Speech Runtime',
        operationId: 'routeSpeechRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/speech-runtime/execute': {
      get: {
        summary: 'Execute via Speech Runtime',
        operationId: 'executeSpeechRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/speech-runtime/query': {
      get: {
        summary: 'Query Speech Runtime',
        operationId: 'querySpeechRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/voice-runtime/engine': {
      get: {
        summary: 'Voice Runtime engine',
        operationId: 'getVoiceRuntimeEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/voice-runtime/products': {
      get: {
        summary: 'Voice Runtime products',
        operationId: 'listVoiceRuntimeProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/voice-runtime/monitoring': {
      get: {
        summary: 'Voice Runtime monitoring',
        operationId: 'getVoiceRuntimeMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/voice-runtime/routes': {
      get: {
        summary: 'Voice Runtime routes',
        operationId: 'listVoiceRuntimeRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/voice-runtime/route': {
      get: {
        summary: 'Route via Voice Runtime',
        operationId: 'routeVoiceRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/voice-runtime/execute': {
      get: {
        summary: 'Execute via Voice Runtime',
        operationId: 'executeVoiceRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/voice-runtime/query': {
      get: {
        summary: 'Query Voice Runtime',
        operationId: 'queryVoiceRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vision-runtime/engine': {
      get: {
        summary: 'Vision Runtime engine',
        operationId: 'getVisionRuntimeEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vision-runtime/products': {
      get: {
        summary: 'Vision Runtime products',
        operationId: 'listVisionRuntimeProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vision-runtime/monitoring': {
      get: {
        summary: 'Vision Runtime monitoring',
        operationId: 'getVisionRuntimeMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vision-runtime/routes': {
      get: {
        summary: 'Vision Runtime routes',
        operationId: 'listVisionRuntimeRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vision-runtime/route': {
      get: {
        summary: 'Route via Vision Runtime',
        operationId: 'routeVisionRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vision-runtime/execute': {
      get: {
        summary: 'Execute via Vision Runtime',
        operationId: 'executeVisionRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vision-runtime/query': {
      get: {
        summary: 'Query Vision Runtime',
        operationId: 'queryVisionRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-runtime/engine': {
      get: {
        summary: 'Knowledge Runtime engine',
        operationId: 'getKnowledgeRuntimeEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-runtime/products': {
      get: {
        summary: 'Knowledge Runtime products',
        operationId: 'listKnowledgeRuntimeProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-runtime/monitoring': {
      get: {
        summary: 'Knowledge Runtime monitoring',
        operationId: 'getKnowledgeRuntimeMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-runtime/routes': {
      get: {
        summary: 'Knowledge Runtime routes',
        operationId: 'listKnowledgeRuntimeRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-runtime/route': {
      get: {
        summary: 'Route via Knowledge Runtime',
        operationId: 'routeKnowledgeRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-runtime/execute': {
      get: {
        summary: 'Execute via Knowledge Runtime',
        operationId: 'executeKnowledgeRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-runtime/query': {
      get: {
        summary: 'Query Knowledge Runtime',
        operationId: 'queryKnowledgeRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/embedding-runtime/engine': {
      get: {
        summary: 'Embedding Runtime engine',
        operationId: 'getEmbeddingRuntimeEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/embedding-runtime/products': {
      get: {
        summary: 'Embedding Runtime products',
        operationId: 'listEmbeddingRuntimeProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/embedding-runtime/monitoring': {
      get: {
        summary: 'Embedding Runtime monitoring',
        operationId: 'getEmbeddingRuntimeMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/embedding-runtime/routes': {
      get: {
        summary: 'Embedding Runtime routes',
        operationId: 'listEmbeddingRuntimeRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/embedding-runtime/route': {
      get: {
        summary: 'Route via Embedding Runtime',
        operationId: 'routeEmbeddingRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/embedding-runtime/execute': {
      get: {
        summary: 'Execute via Embedding Runtime',
        operationId: 'executeEmbeddingRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/embedding-runtime/query': {
      get: {
        summary: 'Query Embedding Runtime',
        operationId: 'queryEmbeddingRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-streaming/engine': {
      get: {
        summary: 'Data Plane Streaming engine',
        operationId: 'getDataPlaneStreamingEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-streaming/products': {
      get: {
        summary: 'Data Plane Streaming products',
        operationId: 'listDataPlaneStreamingProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-streaming/monitoring': {
      get: {
        summary: 'Data Plane Streaming monitoring',
        operationId: 'getDataPlaneStreamingMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-streaming/routes': {
      get: {
        summary: 'Data Plane Streaming routes',
        operationId: 'listDataPlaneStreamingRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-streaming/route': {
      get: {
        summary: 'Route via Data Plane Streaming',
        operationId: 'routeDataPlaneStreaming',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-streaming/execute': {
      get: {
        summary: 'Execute via Data Plane Streaming',
        operationId: 'executeDataPlaneStreaming',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/data-plane-streaming/query': {
      get: {
        summary: 'Query Data Plane Streaming',
        operationId: 'queryDataPlaneStreaming',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gpu-runtime/engine': {
      get: {
        summary: 'GPU Runtime engine',
        operationId: 'getGpuRuntimeEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gpu-runtime/products': {
      get: {
        summary: 'GPU Runtime products',
        operationId: 'listGpuRuntimeProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gpu-runtime/monitoring': {
      get: {
        summary: 'GPU Runtime monitoring',
        operationId: 'getGpuRuntimeMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gpu-runtime/routes': {
      get: {
        summary: 'GPU Runtime routes',
        operationId: 'listGpuRuntimeRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gpu-runtime/route': {
      get: {
        summary: 'Route via GPU Runtime',
        operationId: 'routeGpuRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gpu-runtime/execute': {
      get: {
        summary: 'Execute via GPU Runtime',
        operationId: 'executeGpuRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/gpu-runtime/query': {
      get: {
        summary: 'Query GPU Runtime',
        operationId: 'queryGpuRuntime',
        responses: { '200': { description: 'OK' } },
      },
    },

    '/v1/vaios/products': {
      get: {
        summary: 'VAIOS products',
        operationId: 'listVaiosProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vaios/engine': {
      get: {
        summary: 'VAIOS engine alias',
        operationId: 'getVaiosEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vaios/routing': {
      get: {
        summary: 'VAIOS routing',
        operationId: 'getVaiosRouting',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vaios/overview': {
      get: {
        summary: 'VAIOS overview',
        operationId: 'getVaiosOverview',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/vaios/monitoring': {
      get: {
        summary: 'VAIOS monitoring',
        operationId: 'getVaiosMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-scheduler/engine': {
      get: {
        summary: 'AI Scheduler engine',
        operationId: 'getAiSchedulerEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-scheduler/products': {
      get: {
        summary: 'AI Scheduler products',
        operationId: 'listAiSchedulerProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-scheduler/monitoring': {
      get: {
        summary: 'AI Scheduler monitoring',
        operationId: 'getAiSchedulerMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-scheduler/routes': {
      get: {
        summary: 'AI Scheduler routes',
        operationId: 'listAiSchedulerRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-scheduler/route': {
      get: {
        summary: 'Route via AI Scheduler',
        operationId: 'routeAiScheduler',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-scheduler/execute': {
      get: {
        summary: 'Execute via AI Scheduler',
        operationId: 'executeAiScheduler',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-scheduler/query': {
      get: {
        summary: 'Query AI Scheduler',
        operationId: 'queryAiScheduler',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/runtime-manager/engine': {
      get: {
        summary: 'Runtime Manager engine',
        operationId: 'getRuntimeManagerEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/runtime-manager/products': {
      get: {
        summary: 'Runtime Manager products',
        operationId: 'listRuntimeManagerProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/runtime-manager/monitoring': {
      get: {
        summary: 'Runtime Manager monitoring',
        operationId: 'getRuntimeManagerMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/runtime-manager/routes': {
      get: {
        summary: 'Runtime Manager routes',
        operationId: 'listRuntimeManagerRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/runtime-manager/route': {
      get: {
        summary: 'Route via Runtime Manager',
        operationId: 'routeRuntimeManager',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/runtime-manager/execute': {
      get: {
        summary: 'Execute via Runtime Manager',
        operationId: 'executeRuntimeManager',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/runtime-manager/query': {
      get: {
        summary: 'Query Runtime Manager',
        operationId: 'queryRuntimeManager',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/resource-manager/engine': {
      get: {
        summary: 'Resource Manager engine',
        operationId: 'getResourceManagerEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/resource-manager/products': {
      get: {
        summary: 'Resource Manager products',
        operationId: 'listResourceManagerProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/resource-manager/monitoring': {
      get: {
        summary: 'Resource Manager monitoring',
        operationId: 'getResourceManagerMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/resource-manager/routes': {
      get: {
        summary: 'Resource Manager routes',
        operationId: 'listResourceManagerRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/resource-manager/route': {
      get: {
        summary: 'Route via Resource Manager',
        operationId: 'routeResourceManager',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/resource-manager/execute': {
      get: {
        summary: 'Execute via Resource Manager',
        operationId: 'executeResourceManager',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/resource-manager/query': {
      get: {
        summary: 'Query Resource Manager',
        operationId: 'queryResourceManager',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/workflow-operating-system/engine': {
      get: {
        summary: 'Workflow Operating System engine',
        operationId: 'getWorkflowOperatingSystemEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/workflow-operating-system/products': {
      get: {
        summary: 'Workflow Operating System products',
        operationId: 'listWorkflowOperatingSystemProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/workflow-operating-system/monitoring': {
      get: {
        summary: 'Workflow Operating System monitoring',
        operationId: 'getWorkflowOperatingSystemMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/workflow-operating-system/routes': {
      get: {
        summary: 'Workflow Operating System routes',
        operationId: 'listWorkflowOperatingSystemRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/workflow-operating-system/route': {
      get: {
        summary: 'Route via Workflow Operating System',
        operationId: 'routeWorkflowOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/workflow-operating-system/execute': {
      get: {
        summary: 'Execute via Workflow Operating System',
        operationId: 'executeWorkflowOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/workflow-operating-system/query': {
      get: {
        summary: 'Query Workflow Operating System',
        operationId: 'queryWorkflowOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/agent-operating-system/engine': {
      get: {
        summary: 'Agent Operating System engine',
        operationId: 'getAgentOperatingSystemEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/agent-operating-system/products': {
      get: {
        summary: 'Agent Operating System products',
        operationId: 'listAgentOperatingSystemProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/agent-operating-system/monitoring': {
      get: {
        summary: 'Agent Operating System monitoring',
        operationId: 'getAgentOperatingSystemMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/agent-operating-system/routes': {
      get: {
        summary: 'Agent Operating System routes',
        operationId: 'listAgentOperatingSystemRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/agent-operating-system/route': {
      get: {
        summary: 'Route via Agent Operating System',
        operationId: 'routeAgentOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/agent-operating-system/execute': {
      get: {
        summary: 'Execute via Agent Operating System',
        operationId: 'executeAgentOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/agent-operating-system/query': {
      get: {
        summary: 'Query Agent Operating System',
        operationId: 'queryAgentOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-memory-operating-system/engine': {
      get: {
        summary: 'AI Memory Operating System engine',
        operationId: 'getAiMemoryOperatingSystemEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-memory-operating-system/products': {
      get: {
        summary: 'AI Memory Operating System products',
        operationId: 'listAiMemoryOperatingSystemProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-memory-operating-system/monitoring': {
      get: {
        summary: 'AI Memory Operating System monitoring',
        operationId: 'getAiMemoryOperatingSystemMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-memory-operating-system/routes': {
      get: {
        summary: 'AI Memory Operating System routes',
        operationId: 'listAiMemoryOperatingSystemRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-memory-operating-system/route': {
      get: {
        summary: 'Route via AI Memory Operating System',
        operationId: 'routeAiMemoryOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-memory-operating-system/execute': {
      get: {
        summary: 'Execute via AI Memory Operating System',
        operationId: 'executeAiMemoryOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-memory-operating-system/query': {
      get: {
        summary: 'Query AI Memory Operating System',
        operationId: 'queryAiMemoryOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-operating-system/engine': {
      get: {
        summary: 'Knowledge Operating System engine',
        operationId: 'getKnowledgeOperatingSystemEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-operating-system/products': {
      get: {
        summary: 'Knowledge Operating System products',
        operationId: 'listKnowledgeOperatingSystemProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-operating-system/monitoring': {
      get: {
        summary: 'Knowledge Operating System monitoring',
        operationId: 'getKnowledgeOperatingSystemMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-operating-system/routes': {
      get: {
        summary: 'Knowledge Operating System routes',
        operationId: 'listKnowledgeOperatingSystemRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-operating-system/route': {
      get: {
        summary: 'Route via Knowledge Operating System',
        operationId: 'routeKnowledgeOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-operating-system/execute': {
      get: {
        summary: 'Execute via Knowledge Operating System',
        operationId: 'executeKnowledgeOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/knowledge-operating-system/query': {
      get: {
        summary: 'Query Knowledge Operating System',
        operationId: 'queryKnowledgeOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/plugin-operating-system/engine': {
      get: {
        summary: 'Plugin Operating System engine',
        operationId: 'getPluginOperatingSystemEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/plugin-operating-system/products': {
      get: {
        summary: 'Plugin Operating System products',
        operationId: 'listPluginOperatingSystemProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/plugin-operating-system/monitoring': {
      get: {
        summary: 'Plugin Operating System monitoring',
        operationId: 'getPluginOperatingSystemMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/plugin-operating-system/routes': {
      get: {
        summary: 'Plugin Operating System routes',
        operationId: 'listPluginOperatingSystemRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/plugin-operating-system/route': {
      get: {
        summary: 'Route via Plugin Operating System',
        operationId: 'routePluginOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/plugin-operating-system/execute': {
      get: {
        summary: 'Execute via Plugin Operating System',
        operationId: 'executePluginOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/plugin-operating-system/query': {
      get: {
        summary: 'Query Plugin Operating System',
        operationId: 'queryPluginOperatingSystem',
        responses: { '200': { description: 'OK' } },
      },
    },

    '/v1/enterprise-engineering-system/products': {
      get: {
        summary: 'EES products',
        operationId: 'listEnterpriseEngineeringSystemProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/enterprise-engineering-system/engine': {
      get: {
        summary: 'EES engine alias',
        operationId: 'getEnterpriseEngineeringSystemEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/enterprise-engineering-system/routing': {
      get: {
        summary: 'EES routing',
        operationId: 'getEnterpriseEngineeringSystemRouting',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/enterprise-engineering-system/overview': {
      get: {
        summary: 'EES overview',
        operationId: 'getEnterpriseEngineeringSystemOverview',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/enterprise-engineering-system/monitoring': {
      get: {
        summary: 'EES monitoring',
        operationId: 'getEnterpriseEngineeringSystemMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-governance/engine': {
      get: {
        summary: 'Engineering Governance engine',
        operationId: 'getEngineeringGovernanceEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-governance/products': {
      get: {
        summary: 'Engineering Governance products',
        operationId: 'listEngineeringGovernanceProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-governance/monitoring': {
      get: {
        summary: 'Engineering Governance monitoring',
        operationId: 'getEngineeringGovernanceMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-governance/routes': {
      get: {
        summary: 'Engineering Governance routes',
        operationId: 'listEngineeringGovernanceRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-governance/route': {
      get: {
        summary: 'Route via Engineering Governance',
        operationId: 'routeEngineeringGovernance',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-governance/execute': {
      get: {
        summary: 'Execute via Engineering Governance',
        operationId: 'executeEngineeringGovernance',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-governance/query': {
      get: {
        summary: 'Query Engineering Governance',
        operationId: 'queryEngineeringGovernance',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/architecture-governance/engine': {
      get: {
        summary: 'Architecture Governance engine',
        operationId: 'getArchitectureGovernanceEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/architecture-governance/products': {
      get: {
        summary: 'Architecture Governance products',
        operationId: 'listArchitectureGovernanceProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/architecture-governance/monitoring': {
      get: {
        summary: 'Architecture Governance monitoring',
        operationId: 'getArchitectureGovernanceMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/architecture-governance/routes': {
      get: {
        summary: 'Architecture Governance routes',
        operationId: 'listArchitectureGovernanceRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/architecture-governance/route': {
      get: {
        summary: 'Route via Architecture Governance',
        operationId: 'routeArchitectureGovernance',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/architecture-governance/execute': {
      get: {
        summary: 'Execute via Architecture Governance',
        operationId: 'executeArchitectureGovernance',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/architecture-governance/query': {
      get: {
        summary: 'Query Architecture Governance',
        operationId: 'queryArchitectureGovernance',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/architecture-governance/adr-series': {
      get: {
        summary: 'ADR series note',
        operationId: 'getArchitectureGovernanceAdrSeries',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/repository-standards/engine': {
      get: {
        summary: 'Repository Standards engine',
        operationId: 'getRepositoryStandardsEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/repository-standards/products': {
      get: {
        summary: 'Repository Standards products',
        operationId: 'listRepositoryStandardsProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/repository-standards/monitoring': {
      get: {
        summary: 'Repository Standards monitoring',
        operationId: 'getRepositoryStandardsMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/repository-standards/routes': {
      get: {
        summary: 'Repository Standards routes',
        operationId: 'listRepositoryStandardsRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/repository-standards/route': {
      get: {
        summary: 'Route via Repository Standards',
        operationId: 'routeRepositoryStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/repository-standards/execute': {
      get: {
        summary: 'Execute via Repository Standards',
        operationId: 'executeRepositoryStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/repository-standards/query': {
      get: {
        summary: 'Query Repository Standards',
        operationId: 'queryRepositoryStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-quality-platform/engine': {
      get: {
        summary: 'Engineering Quality Platform engine',
        operationId: 'getEngineeringQualityPlatformEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-quality-platform/products': {
      get: {
        summary: 'Engineering Quality Platform products',
        operationId: 'listEngineeringQualityPlatformProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-quality-platform/monitoring': {
      get: {
        summary: 'Engineering Quality Platform monitoring',
        operationId: 'getEngineeringQualityPlatformMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-quality-platform/routes': {
      get: {
        summary: 'Engineering Quality Platform routes',
        operationId: 'listEngineeringQualityPlatformRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-quality-platform/route': {
      get: {
        summary: 'Route via Engineering Quality Platform',
        operationId: 'routeEngineeringQualityPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-quality-platform/execute': {
      get: {
        summary: 'Execute via Engineering Quality Platform',
        operationId: 'executeEngineeringQualityPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/engineering-quality-platform/query': {
      get: {
        summary: 'Query Engineering Quality Platform',
        operationId: 'queryEngineeringQualityPlatform',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/engine': {
      get: {
        summary: 'AI Engineering Standards engine',
        operationId: 'getAiEngineeringStandardsEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/products': {
      get: {
        summary: 'AI Engineering Standards products',
        operationId: 'listAiEngineeringStandardsProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/monitoring': {
      get: {
        summary: 'AI Engineering Standards monitoring',
        operationId: 'getAiEngineeringStandardsMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/routes': {
      get: {
        summary: 'AI Engineering Standards routes',
        operationId: 'listAiEngineeringStandardsRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/route': {
      get: {
        summary: 'Route via AI Engineering Standards',
        operationId: 'routeAiEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/execute': {
      get: {
        summary: 'Execute via AI Engineering Standards',
        operationId: 'executeAiEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/query': {
      get: {
        summary: 'Query AI Engineering Standards',
        operationId: 'queryAiEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/checks': {
      get: {
        summary: 'AI engineering retroactive checks',
        operationId: 'listAiEngineeringStandardsChecks',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/ai-engineering-standards/check/list': {
      get: {
        summary: 'AI engineering check list',
        operationId: 'listAiEngineeringStandardsCheckList',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/api-engineering-standards/engine': {
      get: {
        summary: 'API Engineering Standards engine',
        operationId: 'getApiEngineeringStandardsEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/api-engineering-standards/products': {
      get: {
        summary: 'API Engineering Standards products',
        operationId: 'listApiEngineeringStandardsProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/api-engineering-standards/monitoring': {
      get: {
        summary: 'API Engineering Standards monitoring',
        operationId: 'getApiEngineeringStandardsMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/api-engineering-standards/routes': {
      get: {
        summary: 'API Engineering Standards routes',
        operationId: 'listApiEngineeringStandardsRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/api-engineering-standards/route': {
      get: {
        summary: 'Route via API Engineering Standards',
        operationId: 'routeApiEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/api-engineering-standards/execute': {
      get: {
        summary: 'Execute via API Engineering Standards',
        operationId: 'executeApiEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/api-engineering-standards/query': {
      get: {
        summary: 'Query API Engineering Standards',
        operationId: 'queryApiEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/database-engineering-standards/engine': {
      get: {
        summary: 'Database Engineering Standards engine',
        operationId: 'getDatabaseEngineeringStandardsEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/database-engineering-standards/products': {
      get: {
        summary: 'Database Engineering Standards products',
        operationId: 'listDatabaseEngineeringStandardsProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/database-engineering-standards/monitoring': {
      get: {
        summary: 'Database Engineering Standards monitoring',
        operationId: 'getDatabaseEngineeringStandardsMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/database-engineering-standards/routes': {
      get: {
        summary: 'Database Engineering Standards routes',
        operationId: 'listDatabaseEngineeringStandardsRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/database-engineering-standards/route': {
      get: {
        summary: 'Route via Database Engineering Standards',
        operationId: 'routeDatabaseEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/database-engineering-standards/execute': {
      get: {
        summary: 'Execute via Database Engineering Standards',
        operationId: 'executeDatabaseEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/database-engineering-standards/query': {
      get: {
        summary: 'Query Database Engineering Standards',
        operationId: 'queryDatabaseEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/infrastructure-engineering-standards/engine': {
      get: {
        summary: 'Infrastructure Engineering Standards engine',
        operationId: 'getInfrastructureEngineeringStandardsEngine',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/infrastructure-engineering-standards/products': {
      get: {
        summary: 'Infrastructure Engineering Standards products',
        operationId: 'listInfrastructureEngineeringStandardsProducts',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/infrastructure-engineering-standards/monitoring': {
      get: {
        summary: 'Infrastructure Engineering Standards monitoring',
        operationId: 'getInfrastructureEngineeringStandardsMonitoring',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/infrastructure-engineering-standards/routes': {
      get: {
        summary: 'Infrastructure Engineering Standards routes',
        operationId: 'listInfrastructureEngineeringStandardsRoutes',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/infrastructure-engineering-standards/route': {
      get: {
        summary: 'Route via Infrastructure Engineering Standards',
        operationId: 'routeInfrastructureEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/infrastructure-engineering-standards/execute': {
      get: {
        summary: 'Execute via Infrastructure Engineering Standards',
        operationId: 'executeInfrastructureEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/infrastructure-engineering-standards/query': {
      get: {
        summary: 'Query Infrastructure Engineering Standards',
        operationId: 'queryInfrastructureEngineeringStandards',
        responses: { '200': { description: 'OK' } },
      },
    },

    '/v1/localize/file': {
      post: {
        summary: 'Translate an uploaded .json/.yaml file',
        operationId: 'localizeFile',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Localized content + serialized file' } },
      },
    },
  },
} as const;
