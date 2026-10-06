import { EDGE_PACK_COUNT } from './edge.packs';

export function edgeCatalog() {
  return {
    product: 'Lugemi Edge',
    model_id: 'lugemi-edge',
    model_version: 'local-demo-1',
    family: 'Edge + Echo + Translate + Voice',
    note:
      'Verified offline speech-translation packs for declared device classes. Modes: local | cloud_allowed | cloud_forbidden. No silent cloud fallback when cloud is forbidden.',
    catalog_note:
      `Full registry catalog (${EDGE_PACK_COUNT} language↔English packs). Packs are local/demo signed manifests until real on-device weights ship. Peak RAM is a measured budget subject to quality review.`,
    modes: ['local', 'cloud_allowed', 'cloud_forbidden'],
    pack_count: EDGE_PACK_COUNT,
    device_scope: {
      classes: ['android-4gb', 'android-6gb', 'ios-4gb'],
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
