-- Enterprise Knowledge Base (VL-194 / Phase 61) — collection/tags/contentKind/version on knowledge_documents
ALTER TABLE "knowledge_documents" ADD COLUMN "collection" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "knowledge_documents" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "knowledge_documents" ADD COLUMN "content_kind" TEXT NOT NULL DEFAULT 'document';
ALTER TABLE "knowledge_documents" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "knowledge_documents_workspace_id_collection_idx" ON "knowledge_documents"("workspace_id", "collection");
