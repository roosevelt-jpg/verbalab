export type PatentStatus = 'shipped' | 'partial' | 'deferred';

export type DisclosureStatus =
  | 'idea'
  | 'invention_disclosure'
  | 'prior_art_review'
  | 'filed_stub'
  | 'portfolio';

export type IpPortfolioItem = {
  id: string;
  title: string;
  disclosureStatus: DisclosureStatus;
  priorArtNotes: string;
  notes: string;
};

/**
 * Patent & Innovation Platform.
 * usptoOs=false — tracking catalog, not a legal filing system.
 */
export function patentInnovationPlatformEngineCatalog() {
  const portfolio: IpPortfolioItem[] = [
    {
      id: 'ip-001',
      title: 'Dialect-aware ASR routing',
      disclosureStatus: 'invention_disclosure',
      priorArtNotes: 'Internal prior-art checklist started.',
      notes: 'Disclosure workflow seed — not a USPTO filing.',
    },
    {
      id: 'ip-002',
      title: 'Consent-gated cultural knowledge release',
      disclosureStatus: 'prior_art_review',
      priorArtNotes: 'Cross-check Volume 12 consent posture.',
      notes: 'Innovation pipeline seed.',
    },
    {
      id: 'ip-003',
      title: 'Synthetic label propagation for sensitive domains',
      disclosureStatus: 'idea',
      priorArtNotes: 'Idea slot only.',
      notes: 'Tracks honesty requirement from the research charter.',
    },
  ];
  return {
    product: 'Lugemi Patent & Innovation Platform',
    note:
      'Patent & Innovation Platform. Disclosure workflow + IP portfolio tracking — usptoOs=false. Not a legal filing system or USPTO OS.',
    portfolio,
    capabilities: [
      { id: 'tracking', name: 'Patent tracking', status: 'shipped' as PatentStatus, api: 'GET /v1/patent-innovation-platform/portfolio', notes: 'Portfolio list.' },
      { id: 'prior-art', name: 'Prior art', status: 'partial' as PatentStatus, api: 'GET /v1/patent-innovation-platform/portfolio', notes: 'Prior-art notes only.' },
      { id: 'pipeline', name: 'Innovation pipeline', status: 'shipped' as PatentStatus, api: 'GET /v1/patent-innovation-platform/portfolio', notes: 'Disclosure statuses.' },
      { id: 'disclosure', name: 'Disclosure workflow', status: 'shipped' as PatentStatus, api: 'GET /v1/patent-innovation-platform/portfolio', notes: 'idea → disclosure → review → filed_stub.' },
      { id: 'tech-transfer', name: 'Technology transfer', status: 'partial' as PatentStatus, api: null, notes: 'Catalog posture — not a transfer OS.' },
    ],
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to12: false,
      usptoOs: false,
    },
    honesty: {
      regeneratesVolumes1to12: false,
      usptoOs: false,
      legalFilingSystem: false,
      coverageComplete: false,
    },
    safety: {
      usptoOs: false,
      legalAdvice: false,
      note: 'Tracking catalog only — not legal advice and not a USPTO filing system.',
    },
    docs: '/docs/PATENT_INNOVATION_PLATFORM.md',
  };
}
