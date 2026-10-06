export type DomainStatus = 'shipped' | 'partial' | 'deferred';

export type DomainTerm = {
  id: string;
  name: string;
  status: DomainStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 135 → Agricultural Intelligence.
 * Domain vocabulary + safety flags for African Intelligence Cloud.
 */
export function agriculturalIntelligenceEngineCatalog() {
  const terms: DomainTerm[] = [
      {
        id: 'agri-crops',
        name: 'Crop vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/agricultural-intelligence/terms',
        notes: 'Crop names and seasons — not farm management OS.',
      },
      {
        id: 'agri-climate',
        name: 'Climate advisories (public)',
        status: 'shipped' as const,
        api: 'GET /v1/agricultural-intelligence/terms',
        notes: 'Public climate info — verify local extension services.',
      },
      {
        id: 'agri-markets',
        name: 'Market terms',
        status: 'shipped' as const,
        api: 'GET /v1/agricultural-intelligence/terms',
        notes: 'Commodity/market vocabulary.',
      },
      {
        id: 'agri-soil',
        name: 'Soil & input terms',
        status: 'shipped' as const,
        api: 'GET /v1/agricultural-intelligence/terms',
        notes: 'Agronomy vocabulary for content routing.',
      }
  ];
  return {
    product: 'Lugemi Agricultural Intelligence',
    note:
      'Agricultural Intelligence. Domain terms/services catalog for African Intelligence Cloud with domain-specific safety flags. Extends Knowledge/Intelligence clouds — not a vertical operations OS.',
    capabilities: terms,
    terms,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to11: false,
      domain: 'agricultural',
    },
    honesty: {
      regeneratesVolumes1to11: false,
      coverageComplete: false,
      verticalOperationsOs: false,
    },
    safety: {
      note: 'Domain vocabulary catalog for African Intelligence Cloud — not a vertical operations OS.',
    },
    docs: '/docs/AGRICULTURAL_INTELLIGENCE.md',
  };
}
