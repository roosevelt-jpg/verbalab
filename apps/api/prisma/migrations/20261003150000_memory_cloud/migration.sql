-- Memory Cloud (VL-183 / Phase 50) — persistent AI interaction memory with GDPR erase path
CREATE TABLE "memory_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "subject_user_id" TEXT,
    "agent_id" TEXT,
    "project_key" TEXT,
    "conversation_id" TEXT,
    "scope" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "memory_records_organization_id_workspace_id_created_at_idx" ON "memory_records"("organization_id", "workspace_id", "created_at");
CREATE INDEX "memory_records_organization_id_subject_user_id_idx" ON "memory_records"("organization_id", "subject_user_id");
CREATE INDEX "memory_records_workspace_id_scope_kind_idx" ON "memory_records"("workspace_id", "scope", "kind");
CREATE INDEX "memory_records_conversation_id_idx" ON "memory_records"("conversation_id");
CREATE INDEX "memory_records_workspace_id_key_idx" ON "memory_records"("workspace_id", "key");

ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
