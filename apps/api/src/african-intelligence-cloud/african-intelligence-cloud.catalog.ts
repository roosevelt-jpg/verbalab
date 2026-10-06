export type AfricanIntelProductStatus = 'shipped' | 'partial' | 'deferred';

export type AfricanIntelProductRow = {
  id: string;
  name: string;
  status: AfricanIntelProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * African Intelligence Cloud Foundation.
 * Hub over Language/Knowledge/Intelligence clouds — not Neo4j OS, not extractive scrape OS,
 * not Digital Twin OS, not Global Intelligence OS ( recommendation after audit).
 */
export function africanIntelligenceProductCatalog(): AfricanIntelProductRow[] {
  return [
    {
      id: 'african-intelligence-cloud',
      name: 'African Intelligence Cloud',
      status: 'shipped',
      api: 'GET /v1/african-intelligence-cloud/products',
      console: '/african-intelligence-cloud',
      notes:
        'Foundation hub. Extends Language/Knowledge/Intelligence clouds — does not regenerate.',
    },
    {
      id: 'african-language-registry',
      name: 'African Language Registry',
      status: 'shipped',
      api: 'GET /v1/african-language-registry/engine',
      console: '/african-language-registry',
      notes: 'Representative language/dialect/writing-system seed. coverageComplete=false.',
    },
    {
      id: 'cultural-intelligence',
      name: 'Cultural Intelligence',
      status: 'shipped',
      api: 'GET /v1/cultural-intelligence/engine',
      console: '/cultural-intelligence',
      notes:
        'Provenance/sourceCommunity/consentStatus required. traditionalKnowledgeConsentRequired=true.',
    },
    {
      id: 'african-knowledge-graph',
      name: 'African Knowledge Graph',
      status: 'shipped',
      api: 'GET /v1/african-knowledge-graph/engine',
      console: '/african-knowledge-graph',
      notes: 'In-process entity/relationship graph. neo4jOs=false.',
    },
    {
      id: 'government-intelligence',
      name: 'Government Intelligence',
      status: 'shipped',
      api: 'GET /v1/government-intelligence/engine',
      console: '/government-intelligence',
      notes: 'officialGuidanceMustBeSourced=true; stale-guidance risk flagged.',
    },
    {
      id: 'healthcare-intelligence',
      name: 'Healthcare Intelligence',
      status: 'shipped',
      api: 'GET /v1/healthcare-intelligence/engine',
      console: '/healthcare-intelligence',
      notes: 'notMedicalAdvice=true; consult-professional framing in engine/safety.',
    },
    {
      id: 'financial-intelligence',
      name: 'Financial Intelligence',
      status: 'shipped',
      api: 'GET /v1/financial-intelligence/engine',
      console: '/financial-intelligence',
      notes: 'notInvestmentAdvice=true; fair-lending considerations flagged.',
    },
    {
      id: 'education-intelligence',
      name: 'Education Intelligence',
      status: 'shipped',
      api: 'GET /v1/education-intelligence/engine',
      console: '/education-intelligence',
      notes: 'Curriculum/terms catalog — not a national education OS.',
    },
    {
      id: 'agricultural-intelligence',
      name: 'Agricultural Intelligence',
      status: 'shipped',
      api: 'GET /v1/agricultural-intelligence/engine',
      console: '/agricultural-intelligence',
      notes: 'Crop/climate/terms catalog — not a farm-management OS.',
    },
    {
      id: 'tourism-heritage-intelligence',
      name: 'Tourism & Heritage Intelligence',
      status: 'shipped',
      api: 'GET /v1/tourism-heritage-intelligence/engine',
      console: '/tourism-heritage-intelligence',
      notes:
        'Heritage/tourism terms with traditional-knowledge consent posture.',
    },
  ];
}

export function africanIntelligenceArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_african_intelligence_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'in_process_catalogs_and_existing_clouds',
    eventDriven: 'audit_jobs_and_event_fabric',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsLanguageCloud: true,
    extendsKnowledgeCloud: true,
    extendsIntelligenceCloud: true,
    regeneratesPriorLayers: false,
    neo4jOs: false,
    worldsLargestScrapeOs: false,
    digitalTwinOs: false,
    globalIntelligenceOs: false,
    traditionalKnowledgeConsentRequired: true,
    note:
      'African Intelligence Cloud hub. Extends Language/Knowledge/Intelligence clouds. Not Neo4j OS, not extractive scrape OS, not Digital Twin OS. Global Intelligence OS is a recommendation after Production Audit — not invented here.',
  };
}

export function africanIntelligenceHonesty() {
  return {
    regeneratesPriorLayers: false,
    neo4jOs: false,
    worldsLargestScrapeOs: false,
    digitalTwinOs: false,
    globalIntelligenceOs: false,
    traditionalKnowledgeConsentRequired: true,
    extractiveTraditionalKnowledgeScrape: false,
    coverageComplete: false,
    notMedicalAdvice: true,
    notInvestmentAdvice: true,
    officialGuidanceMustBeSourced: true,
    fairLendingConsiderationsFlagged: true,
    staleGuidanceRiskNoted: true,
  };
}

export function africanIntelligenceRoutingTable() {
  return [
    {
      surface: 'african-language-registry',
      path: '/african-language-registry',
      api: '/v1/african-language-registry/engine',
    },
    {
      surface: 'cultural-intelligence',
      path: '/cultural-intelligence',
      api: '/v1/cultural-intelligence/engine',
    },
    {
      surface: 'african-knowledge-graph',
      path: '/african-knowledge-graph',
      api: '/v1/african-knowledge-graph/engine',
    },
    {
      surface: 'government-intelligence',
      path: '/government-intelligence',
      api: '/v1/government-intelligence/engine',
    },
    {
      surface: 'healthcare-intelligence',
      path: '/healthcare-intelligence',
      api: '/v1/healthcare-intelligence/engine',
    },
    {
      surface: 'financial-intelligence',
      path: '/financial-intelligence',
      api: '/v1/financial-intelligence/engine',
    },
    {
      surface: 'education-intelligence',
      path: '/education-intelligence',
      api: '/v1/education-intelligence/engine',
    },
    {
      surface: 'agricultural-intelligence',
      path: '/agricultural-intelligence',
      api: '/v1/agricultural-intelligence/engine',
    },
    {
      surface: 'tourism-heritage-intelligence',
      path: '/tourism-heritage-intelligence',
      api: '/v1/tourism-heritage-intelligence/engine',
    },
    { surface: 'language-cloud', path: '/language', api: '/v1/language-cloud/products' },
    { surface: 'knowledge-cloud', path: '/knowledge-cloud', api: '/v1/knowledge-cloud/products' },
    {
      surface: 'intelligence-cloud',
      path: '/intelligence-cloud',
      api: '/v1/intelligence-cloud/products',
    },
    { surface: 'dialects', path: '/dialects', api: '/v1/dialects' },
    { surface: 'accents', path: '/accents', api: '/v1/accents' },
  ];
}
