export type DataPlaneCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type DataPlaneCloudProductRow = {
  id: string;
  name: string;
  status: DataPlaneCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Library Phase 191 → Data Plane Cloud Foundation.
 * Execution layer — never manages orgs/policies/billing.
 * Not Service Mesh / VAIOS / architecture-freeze OS.
 */
export function dataPlaneCloudProductCatalog: DataPlaneCloudProductRow[] {
  return [
    {
      id: 'data-plane-cloud',
      name: 'Data Plane Cloud',
      status: 'shipped',
      api: 'GET /v1/data-plane-cloud/products',
      console: '/data-plane-cloud',
      notes:
        'Foundation hub. managesOrgsPoliciesBilling=false; serviceMeshOs=false.',
    },
    {
      id: 'translation-runtime',
      name: 'Translation Runtime',
      status: 'shipped',
      api: 'GET /v1/translation-runtime/engine',
      console: '/translation-runtime',
      notes:
        '. Thin over translate; thinExecutionLayer=true.',
    },
    {
      id: 'speech-runtime',
      name: 'Speech Runtime',
      status: 'shipped',
      api: 'GET /v1/speech-runtime/engine',
      console: '/speech-runtime',
      notes:
        '. Thin over speech-cloud / speech-recognition.',
    },
    {
      id: 'voice-runtime',
      name: 'Voice Runtime',
      status: 'shipped',
      api: 'GET /v1/voice-runtime/engine',
      console: '/voice-runtime',
      notes:
        '. Thin over voice-cloud / voice.',
    },
    {
      id: 'vision-runtime',
      name: 'Vision Runtime',
      status: 'shipped',
      api: 'GET /v1/vision-runtime/engine',
      console: '/vision-runtime',
      notes:
        '. Thin over ocr / documents.',
    },
    {
      id: 'knowledge-runtime',
      name: 'Knowledge Runtime',
      status: 'shipped',
      api: 'GET /v1/knowledge-runtime/engine',
      console: '/knowledge-runtime',
      notes:
        '. Thin over knowledge-cloud / knowledge / knowledge-fabric.',
    },
    {
      id: 'embedding-runtime',
      name: 'Embedding Runtime',
      status: 'shipped',
      api: 'GET /v1/embedding-runtime/engine',
      console: '/embedding-runtime',
      notes:
        '. Thin over embeddings / embedding-cloud.',
    },
    {
      id: 'data-plane-streaming',
      name: 'Data Plane Streaming',
      status: 'shipped',
      api: 'GET /v1/data-plane-streaming/engine',
      console: '/data-plane-streaming',
      notes:
        '. Façade over streaming-runtime; extendsStreamingRuntime=true.',
    },
    {
      id: 'gpu-runtime',
      name: 'GPU Runtime',
      status: 'shipped',
      api: 'GET /v1/gpu-runtime/engine',
      console: '/gpu-runtime',
      notes:
        '. Thin over gpu-platform; gpuBudgetLimitsRequired=true.',
    },
    {
      id: 'api-runtime',
      name: 'API Runtime',
      status: 'shipped',
      api: 'GET /v1/data-plane-cloud/routing',
      console: '/data-plane-cloud',
      notes:
        'Ingress path into data-plane runtimes (foundation routing).',
    },
    {
      id: 'monitoring',
      name: 'Data Plane Monitoring',
      status: 'shipped',
      api: 'GET /v1/data-plane-cloud/monitoring',
      console: '/data-plane-cloud',
      notes:
        'Foundation monitoring snapshot.',
    },
  ];
}

export function dataPlaneCloudRoutingTable: Array<{
  id: string;
  path: string;
  purpose: string;
}> {
  return [
    { id: 'products', path: '/v1/data-plane-cloud/products', purpose: 'Product catalog' },
    { id: 'engine', path: '/v1/data-plane-cloud/engine', purpose: 'Engine alias' },
    { id: 'routing', path: '/v1/data-plane-cloud/routing', purpose: 'Static routing table' },
    { id: 'monitoring', path: '/v1/data-plane-cloud/monitoring', purpose: 'Monitoring snapshot' },
    { id: 'overview', path: '/v1/data-plane-cloud/overview', purpose: 'Authenticated overview' },
  ];
}

export function dataPlaneCloudRuntimeInventory: Array<{
  id: string;
  title: string;
  thinExecutionLayer: boolean;
  routesTo: string[];
}> {
  return [
      {
        id: 'translation-runtime',
        title: 'Translation Runtime',
        thinExecutionLayer: true,
        routesTo: ['translate', 'translate'],
      },
      {
        id: 'speech-runtime',
        title: 'Speech Runtime',
        thinExecutionLayer: true,
        routesTo: ['speech-cloud', 'speech-recognition'],
      },
      {
        id: 'voice-runtime',
        title: 'Voice Runtime',
        thinExecutionLayer: true,
        routesTo: ['voice-cloud', 'voice'],
      },
      {
        id: 'vision-runtime',
        title: 'Vision Runtime',
        thinExecutionLayer: true,
        routesTo: ['ocr', 'documents'],
      },
      {
        id: 'knowledge-runtime',
        title: 'Knowledge Runtime',
        thinExecutionLayer: true,
        routesTo: ['knowledge-cloud', 'knowledge', 'knowledge-fabric'],
      },
      {
        id: 'embedding-runtime',
        title: 'Embedding Runtime',
        thinExecutionLayer: true,
        routesTo: ['embeddings', 'embedding-cloud'],
      },
      {
        id: 'data-plane-streaming',
        title: 'Data Plane Streaming',
        thinExecutionLayer: true,
        routesTo: ['streaming-runtime', 'streaming-runtime'],
      },
      {
        id: 'gpu-runtime',
        title: 'GPU Runtime',
        thinExecutionLayer: true,
        routesTo: ['gpu-platform', 'gpu-platform'],
      }
  ];
}

export function dataPlaneCloudArchitectureNotes: Record<string, unknown> {
  return {
    role: 'data-plane-execution',
    extends: [
      'translate',
      'speech-cloud',
      'voice-cloud',
      'ocr',
      'documents',
      'knowledge-cloud',
      'embeddings',
      'embedding-cloud',
      'streaming-runtime',
      'gpu-platform',
      'control-plane-cloud',
    ],
    regeneratesVolumes1to17: false,
    managesOrgsPoliciesBilling: false,
    serviceMeshOs: false,
    thinExecutionLayers: true,
    controlPlaneSeparation: true,
    deferredPastVolume18: ['service-mesh', 'vaios', 'architecture-freeze-os'],
  };
}

export function dataPlaneCloudHonesty: Record<string, boolean | string> {
  return {
    managesOrgsPoliciesBilling: false,
    serviceMeshOs: false,
    thinExecutionLayer: true,
    duplicatesProductLogic: false,
    controlPlaneSeparation: true,
    regeneratesVolumes1to17: false,
    integratesExistingSystems: true,
    gpuBudgetLimitsRequired: true,
    note:
      'Data Plane Cloud executes workloads via thin runtime hubs that route to existing product logic. Never manages orgs/policies/billing. Service Mesh / VAIOS rejected in this volume.',
  };
}
