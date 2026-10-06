# ADR-0105: Enterprise Knowledge Base (extend VL-062, tenant-scoped, not Confluence OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-194 (library “Phase 61 Enterprise Knowledge Base” mapped)

## Context

Library Phase 61 asks for an Enterprise Knowledge Base covering documents/policies/manuals/books, images/video/audio, web pages, PDF/Word/PPT/Excel/Markdown/HTML, versioning, permissions, collections, tags, and approval workflow — plus engine/REST/GraphQL/SDK/dashboard.

VL-062 already ships org/workspace-scoped DOCX/PDF/TXT ingest + RAG. Volume 6 README requires access controls scoped per workspace/org from day one. Inventing a CMS/approval OS would violate honesty and “extend, don’t regenerate.”

## Decision

1. **Ship** `/v1/knowledge-base/*` hub over existing `KnowledgeService` (engine, content-kinds, collections, analytics, monitoring, documents list, revise-meta).
2. **Extend** `KnowledgeDocument` with `collection`, `tags`, `contentKind`, `version` — all dual-scoped with existing org/workspace columns.
3. **Harden** get/remove/ingest lookups to require `workspaceId` (close same-org IDOR).
4. **Expand** text ingest to Markdown + HTML plaintext strip; keep DOCX/PDF/TXT.
5. **Defer** images/video/audio, OCR/layout, PPTX/XLSX, web crawlers, fine-grained ACLs, approval workflows, Confluence/SharePoint parity.
6. **Flip** Knowledge Cloud catalog `enterprise-knowledge-base` → `partial`.

## Consequences

- Tenant scoping is load-bearing for all later Knowledge Cloud phases.
- Ingest remains on `/v1/knowledge/documents`; EKB is discovery + metadata + honesty, not a fork.
- Enterprise Search / Ontology / Taxonomy / Enterprise RAG remain later VL tickets.
