/**
 * Library Phase 171 → Service Catalog (VL-304).
 * Service Catalog (VL-304). Seed catalog of Lugemi services (api, web, SDK, CLI) with ownership/deps. serviceMeshOs=false.
 */
export function serviceCatalogEngineCatalog() {
  return {
    product: 'Lugemi Service Catalog',
    capabilities: [
      { id: 'microservices', name: 'Microservices', status: 'shipped', notes: 'VL-304 capability.' },
      { id: 'ownership', name: 'Ownership', status: 'shipped', notes: 'VL-304 capability.' },
      { id: 'dependencies', name: 'Dependencies', status: 'shipped', notes: 'VL-304 capability.' },
      { id: 'apis', name: 'APIs', status: 'shipped', notes: 'VL-304 capability.' },
      { id: 'databases', name: 'Databases', status: 'shipped', notes: 'VL-304 capability.' },
      { id: 'queues', name: 'Queues', status: 'shipped', notes: 'VL-304 capability.' },
      { id: 'events', name: 'Events', status: 'shipped', notes: 'VL-304 capability.' },
      { id: 'infra', name: 'Infrastructure', status: 'shipped', notes: 'VL-304 capability.' }
    ],
    services: [
      {
        id: 'svc-api',
        name: 'api',
        kind: 'api',
        status: 'shipped',
        notes: 'NestJS API — apps/api',
      },
      {
        id: 'svc-web',
        name: 'web',
        kind: 'web',
        status: 'shipped',
        notes: 'Next.js console — apps/web',
      },
      {
        id: 'svc-sdk',
        name: 'sdk',
        kind: 'sdk',
        status: 'shipped',
        notes: 'TypeScript SDK — packages/sdk',
      },
      {
        id: 'svc-cli',
        name: 'cli',
        kind: 'cli',
        status: 'shipped',
        notes: 'CLI — packages/cli',
      },
      {
        id: 'svc-postgres',
        name: 'postgres',
        kind: 'database',
        status: 'shipped',
        notes: 'Primary Postgres via Prisma',
      },
      {
        id: 'svc-redis',
        name: 'redis',
        kind: 'queue',
        status: 'shipped',
        notes: 'Redis Streams / cache (Event Fabric)',
      },
      {
        id: 'svc-fly',
        name: 'fly',
        kind: 'infra',
        status: 'shipped',
        notes: 'Fly.io shared platform deploy path',
      }
    ],
    honesty: {
      serviceMeshOs: false,
      regeneratesVolumes1to15: false,
      integratesExistingSystems: true,
      internalEngineeringTooling: true,
    },
    safety: {
      serviceMeshOs: false,
      note: 'Service Catalog (VL-304). Seed catalog of Lugemi services (api, web, SDK, CLI) with ownership/deps. serviceMeshOs=false.',
    },
    docs: '/docs/SERVICE_CATALOG.md',
    note: 'Service Catalog (VL-304). Seed catalog of Lugemi services (api, web, SDK, CLI) with ownership/deps. serviceMeshOs=false.',
  };
}
