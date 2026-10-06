export type TaxonomyCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type TaxonomyCapability = {
  id: string;
  name: string;
  status: TaxonomyCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 64 → Taxonomy Platform. Classification trees — not enterprise taxonomy OS. */
export function taxonomyPlatformCatalog {
  return {
    product: 'Lugemi Taxonomy Platform',
    note:
      'Workspace-scoped categories, tags, content-type terms, and knowledge trees. Assigns to Knowledge Base documents. Not an enterprise taxonomy OS; automatic classification is keyword-heuristic only.',
    capabilities: [
      {
        id: 'categories',
        name: 'Categories',
        status: 'shipped',
        api: 'POST /v1/taxonomy/terms',
        notes: 'kind=category terms with optional parentId tree.',
      },
      {
        id: 'tags',
        name: 'Tags',
        status: 'shipped',
        api: 'POST /v1/taxonomy/terms',
        notes: 'kind=tag terms; also syncs to KnowledgeDocument.tags on assign.',
      },
      {
        id: 'classifications',
        name: 'Classifications',
        status: 'shipped',
        api: 'POST /v1/taxonomy/assign',
        notes: 'Manual term↔document assignment (org+workspace scoped).',
      },
      {
        id: 'metadata',
        name: 'Metadata',
        status: 'partial',
        api: 'POST /v1/taxonomy/terms',
        notes: 'JSON metadata on terms. Schema registry deferred.',
      },
      {
        id: 'content-types',
        name: 'Content types',
        status: 'partial',
        api: 'GET /v1/taxonomy/content-types',
        notes: 'Aligns with EKB contentKind values; kind=content_type terms.',
      },
      {
        id: 'knowledge-trees',
        name: 'Knowledge trees',
        status: 'shipped',
        api: 'GET /v1/taxonomy/trees',
        notes: 'Root terms + children nested one level (recursive fetch via children).',
      },
      {
        id: 'automatic-classification',
        name: 'Automatic classification',
        status: 'partial',
        api: 'POST /v1/taxonomy/classify',
        notes: 'Keyword/heuristic match of term name/slug to filename/tags. ML classifiers deferred.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/taxonomy/analytics',
        notes: 'Term/assignment counts for workspace.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/taxonomy/monitoring',
        notes: 'Honesty + deferred ML flags.',
      },
    ] satisfies TaxonomyCapability[],
    honesty: {
      enterpriseTaxonomyOs: false,
      mlAutoClassification: false,
      schemaRegistry: false,
      orgWorkspaceScoped: true,
      extendsKnowledgeBase: true,
      distinctFromOntology: true,
    },
    links: {
      hub: '/knowledge-cloud',
      console: '/taxonomy',
      knowledgeBase: '/knowledge-base',
      ontology: '/ontology',
      knowledge: '/knowledge',
    },
  };
}

export const TAXONOMY_KINDS = ['category', 'tag', 'content_type'] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];
