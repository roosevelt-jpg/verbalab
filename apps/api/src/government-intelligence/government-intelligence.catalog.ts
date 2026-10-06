export type DomainStatus = 'shipped' | 'partial' | 'deferred';

export type DomainTerm = {
  id: string;
  name: string;
  status: DomainStatus;
  api: string | null;
  notes: string;
};

/**
 * Government Intelligence.
 * Domain vocabulary + safety flags for African Intelligence Cloud.
 */
export function governmentIntelligenceEngineCatalog() {
  const terms: DomainTerm[] = [
      {
        id: 'gov-eligibility',
        name: 'Benefits eligibility guidance',
        status: 'shipped' as const,
        api: 'GET /v1/government-intelligence/terms',
        notes: 'Must cite official source; may go stale.',
      },
      {
        id: 'gov-civic',
        name: 'Civic process overview',
        status: 'shipped' as const,
        api: 'GET /v1/government-intelligence/terms',
        notes: 'High-level process descriptions — not legal advice.',
      },
      {
        id: 'gov-services',
        name: 'Public service directory terms',
        status: 'shipped' as const,
        api: 'GET /v1/government-intelligence/terms',
        notes: 'Catalog labels for service discovery.',
      },
      {
        id: 'gov-policy',
        name: 'Policy vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/government-intelligence/terms',
        notes: 'Domain terms for government content routing.',
      }
  ];
  return {
    product: 'Lugemi Government Intelligence',
    note:
      'Government Intelligence. Domain terms/services catalog for African Intelligence Cloud with domain-specific safety flags. Extends Knowledge/Intelligence clouds — not a vertical operations OS.',
    capabilities: terms,
    terms,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to11: false,
      domain: 'government',
    },
    honesty: {
      regeneratesVolumes1to11: false,
      coverageComplete: false,
      verticalOperationsOs: false,
      officialGuidanceMustBeSourced: true,
      staleGuidanceRiskNoted: true,
      notLegalAdvice: true,
    },
    safety: {
      officialGuidanceMustBeSourced: true,
      staleGuidanceRiskNoted: true,
      notLegalAdvice: true,
      note:
        'Official government guidance must be sourced and kept current. Stale or wrong guidance is a serious failure mode. Not legal advice.',
    },
    docs: '/docs/GOVERNMENT_INTELLIGENCE.md',
  };
}
