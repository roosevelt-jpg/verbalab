export type DomainStatus = 'shipped' | 'partial' | 'deferred';

export type DomainTerm = {
  id: string;
  name: string;
  status: DomainStatus;
  api: string | null;
  notes: string;
};

/**
 * Library Phase 136 → Tourism & Heritage Intelligence (VL-269).
 * Domain vocabulary + safety flags for African Intelligence Cloud.
 */
export function tourismHeritageIntelligenceEngineCatalog() {
  const terms: DomainTerm[] = [
      {
        id: 'tour-sites',
        name: 'Heritage site vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/tourism-heritage-intelligence/terms',
        notes: 'Public site labels — respect community access rules.',
      },
      {
        id: 'tour-festivals',
        name: 'Festival tourism terms',
        status: 'shipped' as const,
        api: 'GET /v1/tourism-heritage-intelligence/terms',
        notes: 'Public festival labels with cultural consent posture.',
      },
      {
        id: 'tour-crafts',
        name: 'Craft & heritage terms',
        status: 'shipped' as const,
        api: 'GET /v1/tourism-heritage-intelligence/terms',
        notes: 'Traditional crafts require consent before deep content.',
      },
      {
        id: 'tour-routes',
        name: 'Tourism route vocabulary',
        status: 'shipped' as const,
        api: 'GET /v1/tourism-heritage-intelligence/terms',
        notes: 'Route labels — not a booking OS.',
      }
  ];
  return {
    product: 'VerbaLab Tourism & Heritage Intelligence',
    note:
      'Tourism & Heritage Intelligence (VL-269). Domain terms/services catalog for African Intelligence Cloud with domain-specific safety flags. Extends Knowledge/Intelligence clouds — not a vertical operations OS.',
    capabilities: terms,
    terms,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to11: false,
      domain: 'tourism_heritage',
    },
    honesty: {
      regeneratesVolumes1to11: false,
      coverageComplete: false,
      verticalOperationsOs: false,
      traditionalKnowledgeConsentRequired: true,
      extractiveTraditionalKnowledgeScrape: false,
    },
    safety: {
      traditionalKnowledgeConsentRequired: true,
      extractiveTraditionalKnowledgeScrape: false,
      note:
        'Heritage content may include traditional knowledge — require provenance/consent before deep cultural extraction.',
    },
    docs: '/docs/TOURISM_HERITAGE_INTELLIGENCE.md',
  };
}
