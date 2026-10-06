export type DomainStatus = 'shipped' | 'partial' | 'deferred';

export type DomainTerm = {
  id: string;
  name: string;
  status: DomainStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 133 → Financial Intelligence (VL-266).
 * Domain vocabulary + safety flags for African Intelligence Cloud.
 */
export function financialIntelligenceEngineCatalog() {
  const terms: DomainTerm[] = [
      {
        id: 'fin-literacy',
        name: 'Financial literacy terms',
        status: 'shipped' as const,
        api: 'GET /v1/financial-intelligence/terms',
        notes: 'Educational — not investment advice.',
      },
      {
        id: 'fin-payments',
        name: 'Payments vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/financial-intelligence/terms',
        notes: 'Mobile money / banking terms catalog.',
      },
      {
        id: 'fin-credit',
        name: 'Credit vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/financial-intelligence/terms',
        notes: 'Fair-lending considerations flagged — not a credit decision engine.',
      },
      {
        id: 'fin-insurance',
        name: 'Insurance vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/financial-intelligence/terms',
        notes: 'Product terms — not personalized recommendations.',
      }
  ];
  return {
    product: 'VerbaLab Financial Intelligence',
    note:
      'Financial Intelligence (VL-266). Domain terms/services catalog for African Intelligence Cloud with domain-specific safety flags. Extends Knowledge/Intelligence clouds — not a vertical operations OS.',
    capabilities: terms,
    terms,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to11: false,
      domain: 'financial',
    },
    honesty: {
      regeneratesVolumes1to11: false,
      coverageComplete: false,
      verticalOperationsOs: false,
      notInvestmentAdvice: true,
      fairLendingConsiderationsFlagged: true,
    },
    safety: {
      notInvestmentAdvice: true,
      fairLendingConsiderationsFlagged: true,
      note:
        'Educational/financial vocabulary only — not investment, lending, or credit advice. Fair-lending considerations apply if credit data is later connected.',
    },
    docs: '/docs/FINANCIAL_INTELLIGENCE.md',
  };
}
