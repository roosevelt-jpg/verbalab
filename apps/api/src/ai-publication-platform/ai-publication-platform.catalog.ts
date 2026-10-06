export type PublicationStatus = 'shipped' | 'partial' | 'deferred';

export type PublicationRecord = {
  id: string;
  kind: 'paper' | 'report' | 'dataset' | 'benchmark' | 'reproducibility_package';
  title: string;
  version: string;
  doi: string | null;
  notes: string;
};

/**
 * Library Phase 143 → AI Publication Platform.
 * doiRegistryOs=false — DOI field optional/stub honesty.
 */
export function aiPublicationPlatformEngineCatalog {
  const publications: PublicationRecord[] = [
    {
      id: 'pub-paper-001',
      kind: 'paper',
      title: 'Multilingual ASR incubation notes',
      version: '0.1.0',
      doi: null,
      notes: 'Internal paper draft — DOI stub only.',
    },
    {
      id: 'pub-report-001',
      kind: 'report',
      title: 'Research Cloud TRL snapshot',
      version: '0.1.0',
      doi: null,
      notes: 'Technical report seed.',
    },
    {
      id: 'pub-dataset-001',
      kind: 'dataset',
      title: 'Synthetic Swahili FAQ (labeled)',
      version: '0.1.0',
      doi: null,
      notes: 'Dataset publication slot — isSynthetic upstream.',
    },
    {
      id: 'pub-bench-001',
      kind: 'benchmark',
      title: 'Internal translation suite card',
      version: '0.1.0',
      doi: null,
      notes: 'Benchmark publication slot.',
    },
    {
      id: 'pub-repro-001',
      kind: 'reproducibility_package',
      title: 'exp-sw-asr-002 reproducibility pack',
      version: '0.1.0',
      doi: null,
      notes: 'Links experiment lineage + artifacts.',
    },
  ];
  return {
    product: 'Lugemi AI Publication Platform',
    note:
      'AI Publication Platform. Papers/reports/datasets/benchmarks/reproducibility packages with versioning. doiRegistryOs=false — DOI is optional stub, not a DOI registry OS.',
    publications,
    capabilities: [
      { id: 'papers', name: 'Research papers', status: 'shipped' as PublicationStatus, api: 'GET /v1/ai-publication-platform/publications', notes: 'Paper tracking.' },
      { id: 'reports', name: 'Technical reports', status: 'shipped' as PublicationStatus, api: 'GET /v1/ai-publication-platform/publications', notes: 'Report tracking.' },
      { id: 'datasets', name: 'Datasets', status: 'shipped' as PublicationStatus, api: 'GET /v1/ai-publication-platform/publications', notes: 'Dataset publication slots.' },
      { id: 'benchmarks', name: 'Benchmarks', status: 'shipped' as PublicationStatus, api: 'GET /v1/ai-publication-platform/publications', notes: 'Benchmark cards.' },
      { id: 'repro', name: 'Reproducibility packages', status: 'shipped' as PublicationStatus, api: 'GET /v1/ai-publication-platform/publications', notes: 'Repro packs.' },
      { id: 'doi', name: 'DOI integration', status: 'deferred' as PublicationStatus, api: null, notes: 'doiRegistryOs=false — stub field only.' },
    ],
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to12: false,
      doiRegistryOs: false,
    },
    honesty: {
      regeneratesVolumes1to12: false,
      doiRegistryOs: false,
      doiFieldOptionalStub: true,
      coverageComplete: false,
    },
    docs: '/docs/AI_PUBLICATION_PLATFORM.md',
  };
}
