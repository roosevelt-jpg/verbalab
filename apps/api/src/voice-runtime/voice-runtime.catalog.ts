/**
 * Voice Runtime.
 * Voice Runtime. Thin layer over voice-cloud / voice — routes streaming/neural/cloning/rendering; does not reimplement TTS.
 */
export function voiceRuntimeEngineCatalog() {
  return {
    product: 'Lugemi Voice Runtime',
    thinExecutionLayer: true,
    duplicatesProductLogic: false,
    capabilities: [
      { id: 'streaming', name: 'Streaming Voice Routing', status: 'shipped', notes: ' routing capability — not a new engine.' },
      { id: 'neural', name: 'Neural TTS Routing', status: 'shipped', notes: ' routing capability — not a new engine.' },
      { id: 'cloning', name: 'Voice Cloning Routing', status: 'shipped', notes: ' routing capability — not a new engine.' },
      { id: 'rendering', name: 'Voice Rendering Routing', status: 'shipped', notes: ' routing capability — not a new engine.' },
      { id: 'realtime', name: 'Realtime Voice Routing', status: 'shipped', notes: ' routing capability — not a new engine.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'voice-cloud',
        path: '/v1/voice-cloud/products',
        role: 'Voice Cloud products',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      },
      {
        id: 'route-2',
        module: 'voice',
        path: '/v1/voice',
        role: 'Voice API',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      }
    ],
    routesTo: [
      { module: 'voice-cloud', path: '/v1/voice-cloud/products', role: 'Voice Cloud products' },
      { module: 'voice', path: '/v1/voice', role: 'Voice API' }
    ],
    honesty: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      controlPlaneSeparation: true,
      regeneratesVolumes1to17: false,
      integratesExistingSystems: true,
      reimplementsTts: false,
    },
    safety: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      note: 'Voice Runtime. Thin layer over voice-cloud / voice — routes streaming/neural/cloning/rendering; does not reimplement TTS.',
    },
    docs: '/docs/VOICE_RUNTIME.md',
    note: 'Voice Runtime. Thin layer over voice-cloud / voice — routes streaming/neural/cloning/rendering; does not reimplement TTS.',
  };
}
