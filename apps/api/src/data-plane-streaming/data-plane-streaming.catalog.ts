/**
 * Library Phase 198 → Data Plane Streaming (VL-331).
 * Data Plane Streaming (VL-331). Façade over Volume 7 streaming-runtime — extendsStreamingRuntime=true; does not create a second streaming-runtime module.
 */
export function dataPlaneStreamingEngineCatalog() {
  return {
    product: 'VerbaLab Data Plane Streaming',
    thinExecutionLayer: true,
    duplicatesProductLogic: false,
    capabilities: [
      { id: 'sse', name: 'SSE Stream Routing', status: 'shipped', notes: 'VL-331 routing capability — not a new engine.' },
      { id: 'chunk', name: 'Chunk Stream Routing', status: 'shipped', notes: 'VL-331 routing capability — not a new engine.' },
      { id: 'realtime', name: 'Realtime Stream Routing', status: 'shipped', notes: 'VL-331 routing capability — not a new engine.' },
      { id: 'backpressure', name: 'Backpressure Routing', status: 'shipped', notes: 'VL-331 routing capability — not a new engine.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'streaming-runtime',
        path: '/v1/streaming-runtime/engine',
        role: 'Streaming Runtime (Volume 7)',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      },
      {
        id: 'route-2',
        module: 'streaming-runtime',
        path: '/v1/streaming-runtime',
        role: 'Streaming Runtime API',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      }
    ],
    routesTo: [
      { module: 'streaming-runtime', path: '/v1/streaming-runtime/engine', role: 'Streaming Runtime (Volume 7)' },
      { module: 'streaming-runtime', path: '/v1/streaming-runtime', role: 'Streaming Runtime API' }
    ],
    honesty: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      controlPlaneSeparation: true,
      regeneratesVolumes1to17: false,
      integratesExistingSystems: true,
      extendsStreamingRuntime: true,
      secondStreamingRuntimeModule: false,
    },
    safety: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      note: 'Data Plane Streaming (VL-331). Façade over Volume 7 streaming-runtime — extendsStreamingRuntime=true; does not create a second streaming-runtime module.',
    },
    docs: '/docs/DATA_PLANE_STREAMING.md',
    note: 'Data Plane Streaming (VL-331). Façade over Volume 7 streaming-runtime — extendsStreamingRuntime=true; does not create a second streaming-runtime module.',
  };
}
