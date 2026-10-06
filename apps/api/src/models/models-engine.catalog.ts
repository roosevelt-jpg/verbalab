export type ModelsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type ModelsCapability = {
  id: string;
  name: string;
  status: ModelsCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Models Engine — live registry matrix over gateway features. Not MLflow. */
export function modelsEngineCatalog() {
  return {
    product: 'Lugemi Models Engine',
    note:
      'Live model matrix for gateway features (translate, STT, TTS, OCR, detect, chat, embeddings, and Language Intelligence verticals). First-party Lugemi entries plus optional vendor adapters. Not MLflow, SageMaker Model Registry, or a training OS.',
    capabilities: [
      {
        id: 'live-matrix',
        name: 'Live readiness matrix',
        status: 'shipped',
        api: 'GET /v1/models/live',
        notes: 'Public: ready models per feature with credential configured flags.',
      },
      {
        id: 'registry-list',
        name: 'Registry list',
        status: 'shipped',
        api: 'GET /v1/models',
        notes: 'Clerk session required.',
      },
      {
        id: 'registry-get',
        name: 'Registry get',
        status: 'shipped',
        api: 'GET /v1/models/:idOrSlug',
        notes: 'By id or slug.',
      },
      {
        id: 'admin-status',
        name: 'Admin status / external URL',
        status: 'shipped',
        api: 'POST /v1/models/:idOrSlug/status',
        notes: 'Platform admin only; optional W&B-style external URLs.',
      },
      {
        id: 'model-registry-hub',
        name: 'Model Registry hub',
        status: 'partial',
        api: 'GET /v1/model-registry/engine',
        notes: 'Cards/versions/deploy plans — sandbox depth, not mesh canary OS.',
      },
      {
        id: 'model-serving',
        name: 'Model Serving',
        status: 'partial',
        api: 'GET /v1/model-serving/engine',
        notes: 'Serving plans over existing gateway — not vLLM OS.',
      },
      {
        id: 'mlflow',
        name: 'MLflow / experiment tracking OS',
        status: 'deferred',
        api: null,
        notes: 'External URL hooks only — not an MLflow product.',
      },
      {
        id: 'auto-weight-deploy',
        name: 'Automatic weight deploy',
        status: 'deferred',
        api: null,
        notes: 'No cluster weight rollout fabric.',
      },
    ] satisfies ModelsCapability[],
    honesty: {
      mlflowOs: false,
      sagemakerModelRegistryOs: false,
      automaticWeightDeploy: false,
      regeneratesGateway: false,
    },
    links: {
      console: '/models',
      modelRegistry: '/model-registry',
      translate: '/translate',
      languageIntelligence: '/language-intelligence',
      openapi: '/v1/openapi.json',
      live: '/v1/models/live',
    },
  };
}
