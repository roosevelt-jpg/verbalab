export type KnowledgeBaseCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeBaseCapability = {
  id: string;
  name: string;
  status: KnowledgeBaseCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Enterprise Knowledge Base. Extends existing — not Confluence/SharePoint OS. */
export function knowledgeBaseCatalog() {
  return {
    product: 'Lugemi Enterprise Knowledge Base',
    note:
      'Org/workspace-scoped document store over existing ingest. Collections/tags/content kinds + Markdown/HTML. Not a Confluence/SharePoint OS; media/OCR/approval workflows deferred.',
    capabilities: [
      {
        id: 'document-ingest',
        name: 'Document ingest',
        status: 'shipped',
        api: 'POST /v1/knowledge/documents',
        notes: 'DOCX/PDF/TXT/Markdown/HTML → chunk/embed. Caps per workspace.',
      },
      {
        id: 'org-workspace-scope',
        name: 'Org + workspace scope',
        status: 'shipped',
        api: 'GET /v1/knowledge/documents',
        notes: 'All list/get/delete/query paths require organizationId + workspaceId.',
      },
      {
        id: 'collections',
        name: 'Collections',
        status: 'partial',
        api: 'GET /v1/knowledge-base/collections',
        notes: 'Logical collection string per doc. Multi-collection vector OS deferred.',
      },
      {
        id: 'tags',
        name: 'Tags',
        status: 'partial',
        api: 'GET /v1/knowledge/documents?tag=',
        notes: 'Freeform tags for filter. Taxonomy platform is .',
      },
      {
        id: 'content-kinds',
        name: 'Content kinds',
        status: 'partial',
        api: 'GET /v1/knowledge-base/content-kinds',
        notes: 'document/policy/manual/book/markdown/html. Images/video/audio deferred.',
      },
      {
        id: 'versioning',
        name: 'Light versioning',
        status: 'partial',
        api: 'POST /v1/knowledge-base/documents/:id/revise-meta',
        notes: 'Integer version bump + metadata. Full history table deferred.',
      },
      {
        id: 'permissions',
        name: 'Permissions',
        status: 'partial',
        api: null,
        notes: 'Workspace membership via TranslateAuth. Fine-grained ACLs deferred.',
      },
      {
        id: 'approval-workflow',
        name: 'Approval workflow',
        status: 'deferred',
        api: null,
        notes: 'Not shipped — not an enterprise CMS approval OS.',
      },
      {
        id: 'media-ingest',
        name: 'Images / video / audio',
        status: 'deferred',
        api: null,
        notes: 'Multimodal media ingest + OCR/layout deferred.',
      },
      {
        id: 'office-decks',
        name: 'PowerPoint / Excel',
        status: 'deferred',
        api: null,
        notes: 'PPTX/XLSX parsers deferred.',
      },
      {
        id: 'web-pages',
        name: 'Web page crawler',
        status: 'deferred',
        api: null,
        notes: 'HTML upload plaintext strip only; crawler deferred.',
      },
    ] satisfies KnowledgeBaseCapability[],
    honesty: {
      confluenceOs: false,
      sharePointParity: false,
      approvalWorkflow: false,
      multimodalMediaIngest: false,
      ocrLayoutTables: false,
      orgWorkspaceScoped: true,
      extendsVl062: true,
      regeneratesVl062: false,
    },
    links: {
      hub: '/knowledge-cloud',
      console: '/knowledge-base',
      knowledge: '/knowledge',
      ingest: 'POST /v1/knowledge/documents',
      query: 'POST /v1/knowledge/query',
    },
  };
}

export const KNOWLEDGE_CONTENT_KINDS = [
  'document',
  'policy',
  'manual',
  'book',
  'markdown',
  'html',
] as const;
