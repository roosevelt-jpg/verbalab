export function edgeCatalog() {
  return {
    product: 'Lugemi Edge',
    model_id: 'lugemi-edge',
    model_version: 'pilot-1',
    family: 'Edge + Echo + Translate + Voice',
    note:
      'Verified offline speech-translation packs for declared device classes. Modes: local | cloud_allowed | cloud_forbidden. No silent cloud fallback when cloud is forbidden.',
    modes: ['local', 'cloud_allowed', 'cloud_forbidden'],
    device_scope: {
      class: 'android-4gb',
      peak_ram_budget_mb: 2048,
      streaming: 'deferred until device tests justify',
    },
    apis: {
      engine: 'GET /v1/edge/engine',
      packs: 'GET /v1/edge/packs',
      pack: 'GET /v1/edge/packs/:packId',
      verify: 'POST /v1/edge/packs/:packId/verify',
      run: 'POST /v1/edge/packs/:packId/run',
    },
    console: '/edge',
    docs: '/docs/next-model-portfolio/06_EDGE.md',
  };
}
