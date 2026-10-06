/**
 * Release Engineering.
 * Release Engineering. Blue-green/canary/rolling/feature-flags/rollback/approval/progressive delivery catalog + seed releases. spinnakerOs=false.
 */
export function releaseEngineeringEngineCatalog() {
  return {
    product: 'Lugemi Release Engineering',
    capabilities: [
      { id: 'blue_green', name: 'Blue-Green', status: 'shipped', notes: ' capability.' },
      { id: 'canary', name: 'Canary', status: 'shipped', notes: ' capability.' },
      { id: 'rolling', name: 'Rolling', status: 'shipped', notes: ' capability.' },
      { id: 'feature_flags', name: 'Feature Flags', status: 'shipped', notes: ' capability.' },
      { id: 'rollback', name: 'Rollback', status: 'shipped', notes: ' capability.' },
      { id: 'approval', name: 'Release Approval', status: 'shipped', notes: ' capability.' },
      { id: 'progressive', name: 'Progressive Delivery', status: 'shipped', notes: ' capability.' }
    ],
    releases: [
      {
        id: 'rel-api-241',
        name: 'api@0.241.0',
        kind: 'rolling',
        status: 'shipped',
        notes: 'Rolling deploy via Fly shared platform',
      },
      {
        id: 'rel-web-118',
        name: 'web@0.118.0',
        kind: 'canary',
        status: 'shipped',
        notes: 'Canary web console slice',
      },
      {
        id: 'rel-sdk-77',
        name: 'sdk@0.77.0',
        kind: 'approval',
        status: 'shipped',
        notes: 'SDK publish with approval gate',
      },
      {
        id: 'rel-ff-trust',
        name: 'ff-trust-cloud',
        kind: 'feature_flag',
        status: 'shipped',
        notes: 'Feature flag for Trust Cloud consoles',
      },
      {
        id: 'rel-rb-gpu',
        name: 'rollback-gpu-budget',
        kind: 'rollback',
        status: 'shipped',
        notes: 'Rollback path for GPU budget alert change',
      },
      {
        id: 'rel-bg-cli',
        name: 'cli@0.55.0',
        kind: 'blue_green',
        status: 'shipped',
        notes: 'Blue-green CLI package cut',
      }
    ],
    honesty: {
      spinnakerOs: false,
      regeneratesVolumes1to15: false,
      integratesExistingSystems: true,
      internalEngineeringTooling: true,
    },
    safety: {
      spinnakerOs: false,
      note: 'Release Engineering. Blue-green/canary/rolling/feature-flags/rollback/approval/progressive delivery catalog + seed releases. spinnakerOs=false.',
    },
    docs: '/docs/RELEASE_ENGINEERING.md',
    note: 'Release Engineering. Blue-green/canary/rolling/feature-flags/rollback/approval/progressive delivery catalog + seed releases. spinnakerOs=false.',
  };
}
