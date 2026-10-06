/**
 * Library Phase 195 → Vision Runtime (VL-328).
 * Vision Runtime (VL-328). Thin layer over ocr / documents — routes OCR/document vision; does not invent a new OCR engine.
 */
export function visionRuntimeEngineCatalog() {
  return {
    product: 'VerbaLab Vision Runtime',
    thinExecutionLayer: true,
    duplicatesProductLogic: false,
    capabilities: [
      { id: 'ocr', name: 'OCR Routing', status: 'shipped', notes: 'VL-328 routing capability — not a new engine.' },
      { id: 'documents', name: 'Document Vision Routing', status: 'shipped', notes: 'VL-328 routing capability — not a new engine.' },
      { id: 'batch', name: 'Batch Vision Routing', status: 'shipped', notes: 'VL-328 routing capability — not a new engine.' },
      { id: 'layout', name: 'Layout Analysis Routing', status: 'shipped', notes: 'VL-328 routing capability — not a new engine.' }
    ],
    routes: [
      {
        id: 'route-1',
        module: 'ocr',
        path: '/v1/ocr',
        role: 'OCR',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      },
      {
        id: 'route-2',
        module: 'documents',
        path: '/v1/documents',
        role: 'Documents',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      }
    ],
    routesTo: [
      { module: 'ocr', path: '/v1/ocr', role: 'OCR' },
      { module: 'documents', path: '/v1/documents', role: 'Documents' }
    ],
    honesty: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      controlPlaneSeparation: true,
      regeneratesVolumes1to17: false,
      integratesExistingSystems: true,
      inventsOcrEngine: false,
    },
    safety: {
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      note: 'Vision Runtime (VL-328). Thin layer over ocr / documents — routes OCR/document vision; does not invent a new OCR engine.',
    },
    docs: '/docs/VISION_RUNTIME.md',
    note: 'Vision Runtime (VL-328). Thin layer over ocr / documents — routes OCR/document vision; does not invent a new OCR engine.',
  };
}
