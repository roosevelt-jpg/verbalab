export type OntologyCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type OntologyCapability = {
  id: string;
  name: string;
  status: OntologyCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 63 → Ontology Platform. Concepts over existing KG — not OWL/Protege OS. */
export function ontologyPlatformCatalog {
  return {
    product: 'Lugemi Ontology Platform',
    note:
      'Workspace-scoped concepts, hierarchies (is_a), synonyms, and multilingual labels over Knowledge Graph entities. Not OWL/RDF/Protege OS; vertical medical/legal packs are light domain tags, not certified ontologies.',
    capabilities: [
      {
        id: 'concepts',
        name: 'Concepts',
        status: 'shipped',
        api: 'POST /v1/ontology/concepts',
        notes: 'KgEntity rows with type=concept (org+workspace scoped).',
      },
      {
        id: 'entities',
        name: 'Entities',
        status: 'shipped',
        api: 'GET /v1/ontology/concepts',
        notes: 'Alias for ontology concepts; full KG entity API remains /v1/knowledge-graph.',
      },
      {
        id: 'relationships',
        name: 'Relationships',
        status: 'shipped',
        api: 'POST /v1/ontology/hierarchies',
        notes: 'is_a / synonym_of / related_to edges via kg_relationships.',
      },
      {
        id: 'hierarchies',
        name: 'Hierarchies',
        status: 'shipped',
        api: 'GET /v1/ontology/concepts/:id/children',
        notes: 'Parent/child via is_a edges. Deep transitive closure deferred.',
      },
      {
        id: 'categories',
        name: 'Categories',
        status: 'partial',
        api: 'POST /v1/ontology/concepts',
        notes: 'type=category concepts. Taxonomy platform is .',
      },
      {
        id: 'synonyms',
        name: 'Synonyms',
        status: 'shipped',
        api: 'POST /v1/ontology/synonyms',
        notes: 'Aliases on concept + optional synonym_of edge.',
      },
      {
        id: 'multilingual',
        name: 'Multilingual labels',
        status: 'partial',
        api: 'POST /v1/ontology/concepts/:id/labels',
        notes: 'metadata.labels { lang: string }. Full i18n ontology OS deferred.',
      },
      {
        id: 'medical-ontology',
        name: 'Medical ontology pack',
        status: 'deferred',
        api: null,
        notes: 'Domain tag medical allowed; SNOMED/UMLS parity deferred.',
      },
      {
        id: 'legal-ontology',
        name: 'Legal ontology pack',
        status: 'deferred',
        api: null,
        notes: 'Domain tag legal allowed; certified legal ontology deferred.',
      },
      {
        id: 'financial-ontology',
        name: 'Financial ontology pack',
        status: 'deferred',
        api: null,
        notes: 'Domain tag financial allowed; FIBO parity deferred.',
      },
      {
        id: 'government-ontology',
        name: 'Government ontology pack',
        status: 'deferred',
        api: null,
        notes: 'Domain tag government allowed; full pack deferred.',
      },
      {
        id: 'education-ontology',
        name: 'Education ontology pack',
        status: 'deferred',
        api: null,
        notes: 'Domain tag educational allowed; full pack deferred.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/ontology/analytics',
        notes: 'Concept/hierarchy/synonym counts for workspace.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/ontology/monitoring',
        notes: 'Honesty + deferred vertical packs.',
      },
    ] satisfies OntologyCapability[],
    honesty: {
      owlOs: false,
      protegeParity: false,
      rdfTripleStore: false,
      certifiedVerticalOntologies: false,
      neo4jParity: false,
      orgWorkspaceScoped: true,
      extendsKnowledgeGraph: true,
      extendsVl184: true,
    },
    links: {
      hub: '/knowledge-cloud',
      console: '/ontology',
      knowledgeGraph: '/knowledge-graph',
      knowledgeBase: '/knowledge-base',
      enterpriseSearch: '/enterprise-search',
    },
  };
}

export const ONTOLOGY_DOMAINS = [
  { id: 'general', name: 'General', status: 'shipped' as const },
  { id: 'medical', name: 'Medical', status: 'deferred' as const },
  { id: 'legal', name: 'Legal', status: 'deferred' as const },
  { id: 'financial', name: 'Financial', status: 'deferred' as const },
  { id: 'government', name: 'Government', status: 'deferred' as const },
  { id: 'educational', name: 'Education', status: 'deferred' as const },
] as const;

export const ONTOLOGY_REL_TYPES = ['is_a', 'synonym_of', 'related_to'] as const;
