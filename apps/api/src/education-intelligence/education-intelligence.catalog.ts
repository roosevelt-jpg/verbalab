export type DomainStatus = 'shipped' | 'partial' | 'deferred';

export type DomainTerm = {
  id: string;
  name: string;
  status: DomainStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 134 → Education Intelligence (VL-267).
 * Domain vocabulary + safety flags for African Intelligence Cloud.
 */
export function educationIntelligenceEngineCatalog() {
  const terms: DomainTerm[] = [
      {
        id: 'edu-curriculum',
        name: 'Curriculum terms',
        status: 'shipped' as const,
        api: 'GET /v1/education-intelligence/terms',
        notes: 'Subject/level vocabulary — not a national curriculum OS.',
      },
      {
        id: 'edu-assessment',
        name: 'Assessment vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/education-intelligence/terms',
        notes: 'Exam/assessment labels for content routing.',
      },
      {
        id: 'edu-literacy',
        name: 'Literacy pathways',
        status: 'shipped' as const,
        api: 'GET /v1/education-intelligence/terms',
        notes: 'Learning pathway labels.',
      },
      {
        id: 'edu-tvet',
        name: 'TVET vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/education-intelligence/terms',
        notes: 'Technical/vocational education terms.',
      }
  ];
  return {
    product: 'VerbaLab Education Intelligence',
    note:
      'Education Intelligence (VL-267). Domain terms/services catalog for African Intelligence Cloud with domain-specific safety flags. Extends Knowledge/Intelligence clouds — not a vertical operations OS.',
    capabilities: terms,
    terms,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to11: false,
      domain: 'education',
    },
    honesty: {
      regeneratesVolumes1to11: false,
      coverageComplete: false,
      verticalOperationsOs: false,
    },
    safety: {
      note: 'Domain vocabulary catalog for African Intelligence Cloud — not a vertical operations OS.',
    },
    docs: '/docs/EDUCATION_INTELLIGENCE.md',
  };
}
