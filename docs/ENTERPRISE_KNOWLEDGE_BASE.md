# VerbaLab Enterprise Knowledge Base

**Status:** Partial (VL-194 / library Phase 61)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md) (VL-193+)  
**Rule:** Extends VL-062 `/knowledge` ingest with org/workspace scoping, collections, tags, content kinds, and Markdown/HTML. Do **not** invent Confluence/SharePoint/approval OS. Media/OCR/PPTX/XLSX deferred.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/knowledge-base` |
| Engine | `GET /v1/knowledge-base/engine` (public) |
| Content kinds | `GET /v1/knowledge-base/content-kinds` |
| Collections | `GET /v1/knowledge-base/collections` (auth) |
| Documents | `GET /v1/knowledge-base/documents` (auth; filters) |
| Revise meta | `POST /v1/knowledge-base/documents/:id/revise-meta` |
| Analytics / monitoring | `GET /v1/knowledge-base/analytics` · `/monitoring` |
| Ingest (existing) | `POST /v1/knowledge/documents` (multipart + optional `collection`/`tags`/`contentKind`) |
| GraphQL | `knowledgeBaseEngine` |
| SDK / CLI | `knowledgeBaseEngine()` · `verbalab knowledge-base-engine` |

---

## Tenant scoping (README constraint)

Every list/get/delete/query path requires **both** `organizationId` and `workspaceId`. VL-194 hardened get/remove (previously org-only) to close same-org cross-workspace IDOR. New metadata columns stay dual-scoped.

---

## Honesty

| Flag | Value |
| --- | --- |
| `orgWorkspaceScoped` | true |
| `extendsVl062` | true |
| `regeneratesVl062` | false |
| `confluenceOs` | false |
| `sharePointParity` | false |
| `approvalWorkflow` | false |
| `multimodalMediaIngest` | false |
| `ocrLayoutTables` | false |

See ADR-0105.
