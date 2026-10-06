-- Taxonomy Platform (VL-197 / Phase 64) — classification trees + document assignments
CREATE TABLE "taxonomy_terms" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'category',
    "description" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxonomy_terms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "taxonomy_assignments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxonomy_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "taxonomy_terms_workspace_id_slug_key" ON "taxonomy_terms"("workspace_id", "slug");
CREATE INDEX "taxonomy_terms_organization_id_workspace_id_kind_idx" ON "taxonomy_terms"("organization_id", "workspace_id", "kind");
CREATE INDEX "taxonomy_terms_workspace_id_parent_id_idx" ON "taxonomy_terms"("workspace_id", "parent_id");

CREATE UNIQUE INDEX "taxonomy_assignments_term_id_document_id_key" ON "taxonomy_assignments"("term_id", "document_id");
CREATE INDEX "taxonomy_assignments_organization_id_workspace_id_idx" ON "taxonomy_assignments"("organization_id", "workspace_id");
CREATE INDEX "taxonomy_assignments_document_id_idx" ON "taxonomy_assignments"("document_id");

ALTER TABLE "taxonomy_terms" ADD CONSTRAINT "taxonomy_terms_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "taxonomy_terms" ADD CONSTRAINT "taxonomy_terms_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "taxonomy_terms" ADD CONSTRAINT "taxonomy_terms_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "taxonomy_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "taxonomy_assignments" ADD CONSTRAINT "taxonomy_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "taxonomy_assignments" ADD CONSTRAINT "taxonomy_assignments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "taxonomy_assignments" ADD CONSTRAINT "taxonomy_assignments_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "taxonomy_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
