export type OpenScienceStatus = 'shipped' | 'partial' | 'deferred';

export type ConsentStatus = 'unverified' | 'attested' | 'restricted';

export type OpenReleaseCandidate = {
  id: string;
  kind: 'model' | 'dataset' | 'benchmark' | 'api' | 'collaboration';
  title: string;
  carriesTraditionalKnowledge: boolean;
  provenance: string | null;
  sourceCommunity: string | null;
  consentStatus: ConsentStatus | null;
  notes: string;
};

/**
 * Open Science Platform.
 * traditionalKnowledgeConsentRequired=true.
 * Before open release of traditional knowledge, require consent fields
 * (provenance, sourceCommunity, consentStatus). Block restricted/unverified.
 */
export function openSciencePlatformEngineCatalog() {
  const candidates: OpenReleaseCandidate[] = [
    {
      id: 'os-model-001',
      kind: 'model',
      title: 'Open multilingual embedding research checkpoint',
      carriesTraditionalKnowledge: false,
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'Non-cultural model release candidate.',
    },
    {
      id: 'os-dataset-attested',
      kind: 'dataset',
      title: 'Attested festival calendar summaries',
      carriesTraditionalKnowledge: true,
      provenance: 'Public cultural calendar descriptions',
      sourceCommunity: 'Ethiopian Orthodox communities',
      consentStatus: 'attested',
      notes: 'Eligible for open release when consent attested.',
    },
    {
      id: 'os-dataset-restricted',
      kind: 'dataset',
      title: 'Restricted proverb collection (blocked)',
      carriesTraditionalKnowledge: true,
      provenance: 'Restricted until source-community attestation',
      sourceCommunity: 'Hausa communities',
      consentStatus: 'restricted',
      notes: 'Must be blocked from open release.',
    },
    {
      id: 'os-dataset-unverified',
      kind: 'dataset',
      title: 'Unverified greeting corpus (blocked)',
      carriesTraditionalKnowledge: true,
      provenance: 'Public descriptive linguistics summary — community attestation pending',
      sourceCommunity: 'Swahili-speaking communities (East Africa)',
      consentStatus: 'unverified',
      notes: 'Must be blocked from open release until attested.',
    },
    {
      id: 'os-bench-001',
      kind: 'benchmark',
      title: 'Open internal translation suite card',
      carriesTraditionalKnowledge: false,
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'Benchmark open-release candidate.',
    },
    {
      id: 'os-collab-001',
      kind: 'collaboration',
      title: 'University research collaboration slot',
      carriesTraditionalKnowledge: false,
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'University program / community contribution posture.',
    },
  ];
  return {
    product: 'Lugemi Open Science Platform',
    note:
      'Open Science Platform. Open models/datasets/benchmarks/APIs/collaborations with traditional-knowledge consent gate. traditionalKnowledgeConsentRequired=true.',
    candidates,
    capabilities: [
      { id: 'open-models', name: 'Open models', status: 'shipped' as OpenScienceStatus, api: 'GET /v1/open-science-platform/releases', notes: 'Model release candidates.' },
      { id: 'open-datasets', name: 'Open datasets', status: 'shipped' as OpenScienceStatus, api: 'GET /v1/open-science-platform/releases', notes: 'Dataset release candidates.' },
      { id: 'open-benchmarks', name: 'Open benchmarks', status: 'shipped' as OpenScienceStatus, api: 'GET /v1/open-science-platform/releases', notes: 'Benchmark release candidates.' },
      { id: 'open-apis', name: 'Open APIs', status: 'partial' as OpenScienceStatus, api: null, notes: 'API release posture.' },
      { id: 'collaborations', name: 'Research collaborations', status: 'shipped' as OpenScienceStatus, api: 'GET /v1/open-science-platform/releases', notes: 'University/community slots.' },
    ],
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      regeneratesVolumes1to12: false,
      traditionalKnowledgeConsentRequired: true,
    },
    honesty: {
      regeneratesVolumes1to12: false,
      traditionalKnowledgeConsentRequired: true,
      huggingFaceHubOs: false,
      coverageComplete: false,
    },
    safety: {
      traditionalKnowledgeConsentRequired: true,
      requiredConsentFields: ['provenance', 'sourceCommunity', 'consentStatus'],
      blockConsentStatuses: ['restricted', 'unverified'],
      note:
        'Before open release of traditional knowledge, require consent fields. Block open release when consentStatus is restricted or unverified.',
    },
    docs: '/docs/OPEN_SCIENCE_PLATFORM.md',
  };
}

export function evaluateOpenRelease(
  candidate: OpenReleaseCandidate,
): { allowed: boolean; reason: string } {
  if (!candidate.carriesTraditionalKnowledge) {
    return { allowed: true, reason: 'No traditional knowledge — consent gate not applicable.' };
  }
  if (!candidate.provenance || !candidate.sourceCommunity || !candidate.consentStatus) {
    return {
      allowed: false,
      reason: 'Missing required consent fields: provenance, sourceCommunity, consentStatus.',
    };
  }
  if (candidate.consentStatus === 'restricted' || candidate.consentStatus === 'unverified') {
    return {
      allowed: false,
      reason: `Blocked: consentStatus=${candidate.consentStatus}. Attested consent required for traditional-knowledge open release.`,
    };
  }
  if (candidate.consentStatus === 'attested') {
    return { allowed: true, reason: 'Attested traditional-knowledge consent — open release allowed.' };
  }
  return { allowed: false, reason: 'Unknown consentStatus — blocked.' };
}
