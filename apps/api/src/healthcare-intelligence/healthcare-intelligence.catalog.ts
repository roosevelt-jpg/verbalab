export type DomainStatus = 'shipped' | 'partial' | 'deferred';

export type DomainTerm = {
  id: string;
  name: string;
  status: DomainStatus;
  api: string | null;
  notes: string;
};

/**
 * Healthcare Intelligence.
 * Domain vocabulary + safety flags for African Intelligence Cloud.
 */
export function healthcareIntelligenceEngineCatalog() {
  const terms: DomainTerm[] = [
      {
        id: 'health-info',
        name: 'General health information',
        status: 'shipped' as const,
        api: 'GET /v1/healthcare-intelligence/terms',
        notes: 'Information only — not diagnosis or treatment.',
      },
      {
        id: 'health-terms',
        name: 'Clinical vocabulary (public)',
        status: 'shipped' as const,
        api: 'GET /v1/healthcare-intelligence/terms',
        notes: 'Public terminology — consult a professional.',
      },
      {
        id: 'health-public',
        name: 'Public health messaging',
        status: 'shipped' as const,
        api: 'GET /v1/healthcare-intelligence/terms',
        notes: 'Campaign-style information, not personalized advice.',
      },
      {
        id: 'health-referral',
        name: 'Care referral framing',
        status: 'shipped' as const,
        api: 'GET /v1/healthcare-intelligence/terms',
        notes: 'Always direct users to qualified clinicians.',
      }
  ];
  return {
    product: 'Lugemi Healthcare Intelligence',
    note:
      'Healthcare Intelligence. Domain terms/services catalog for African Intelligence Cloud with domain-specific safety flags. Extends Knowledge/Intelligence clouds — not a vertical operations OS.',
    capabilities: terms,
    terms,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesPriorLayers: false,
      domain: 'healthcare',
    },
    honesty: {
      regeneratesPriorLayers: false,
      coverageComplete: false,
      verticalOperationsOs: false,
      notMedicalAdvice: true,
      consultProfessionalRequired: true,
    },
    safety: {
      notMedicalAdvice: true,
      consultProfessionalRequired: true,
      note:
        'Output is information, not diagnosis or personalized medical advice. Always consult a qualified healthcare professional.',
    },
    docs: '/docs/HEALTHCARE_INTELLIGENCE.md',
  };
}
