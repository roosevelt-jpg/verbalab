export type SyntheticModalityStatus = 'shipped' | 'partial' | 'deferred';

export type SyntheticModality = {
  id: string;
  name: string;
  status: SyntheticModalityStatus;
  api: string | null;
  notes: string;
};

export type SyntheticArtifact = {
  id: string;
  name: string;
  modality: string;
  isSynthetic: true;
  sensitiveDomainHint: 'none' | 'healthcare' | 'financial' | 'government' | null;
  notes: string;
};

/**
 * Library Phase 140 → Synthetic Data Platform (VL-273).
 * syntheticLabelRequired=true; every artifact isSynthetic=true.
 * If used with Volume 12 sensitive domains, remain labeled synthetic downstream.
 */
export function syntheticDataPlatformEngineCatalog() {
  const modalities: SyntheticModality[] = [
    { id: 'text', name: 'Text generation', status: 'shipped', api: 'GET /v1/synthetic-data-platform/artifacts', notes: 'Synthetic text corpora.' },
    { id: 'speech', name: 'Speech generation', status: 'shipped', api: 'GET /v1/synthetic-data-platform/artifacts', notes: 'Synthetic speech samples.' },
    { id: 'voice', name: 'Voice generation', status: 'shipped', api: 'GET /v1/synthetic-data-platform/artifacts', notes: 'Synthetic voice clips — rights-aware.' },
    { id: 'image', name: 'Image generation', status: 'partial', api: 'GET /v1/synthetic-data-platform/artifacts', notes: 'Catalog posture for synthetic images.' },
    { id: 'video', name: 'Video generation', status: 'deferred', api: null, notes: 'Deferred — not a video generation OS.' },
    { id: 'dialogue', name: 'Dialogue generation', status: 'shipped', api: 'GET /v1/synthetic-data-platform/artifacts', notes: 'Synthetic dialogues.' },
    { id: 'document', name: 'Document generation', status: 'shipped', api: 'GET /v1/synthetic-data-platform/artifacts', notes: 'Synthetic documents.' },
    { id: 'augmentation', name: 'Data augmentation', status: 'shipped', api: 'GET /v1/synthetic-data-platform/artifacts', notes: 'Augmentation recipes.' },
    { id: 'privacyPreserving', name: 'Privacy-preserving data', status: 'shipped', api: 'GET /v1/synthetic-data-platform/artifacts', notes: 'Privacy-preserving synthetic slots.' },
  ];
  const artifacts: SyntheticArtifact[] = [
    {
      id: 'syn-text-sw-001',
      name: 'Synthetic Swahili FAQ pairs',
      modality: 'text',
      isSynthetic: true,
      sensitiveDomainHint: null,
      notes: 'Always treat as synthetic training signal.',
    },
    {
      id: 'syn-dialog-health-001',
      name: 'Synthetic healthcare triage dialogue (labeled)',
      modality: 'dialogue',
      isSynthetic: true,
      sensitiveDomainHint: 'healthcare',
      notes: 'Volume 12 healthcare domain — must remain isSynthetic downstream.',
    },
    {
      id: 'syn-doc-finance-001',
      name: 'Synthetic financial glossary excerpts (labeled)',
      modality: 'document',
      isSynthetic: true,
      sensitiveDomainHint: 'financial',
      notes: 'Volume 12 financial domain — must remain isSynthetic downstream.',
    },
  ];
  return {
    product: 'VerbaLab Synthetic Data Platform',
    note:
      'Synthetic Data Platform (VL-273). Modalities catalog with mandatory synthetic labeling. Not a generative-media OS.',
    modalities,
    artifacts,
    capabilities: modalities,
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to12: false,
      syntheticLabelRequired: true,
    },
    honesty: {
      regeneratesVolumes1to12: false,
      syntheticLabelRequired: true,
      generativeMediaOs: false,
      coverageComplete: false,
    },
    safety: {
      syntheticLabelRequired: true,
      isSyntheticRequiredOnArtifacts: true,
      sensitiveDomainDownstreamLabelingRequired: true,
      note:
        'Every artifact carries isSynthetic=true. If used with Volume 12 healthcare/financial/government domains, remain labeled synthetic downstream — never silently treated as real training signal.',
    },
    docs: '/docs/SYNTHETIC_DATA_PLATFORM.md',
  };
}
