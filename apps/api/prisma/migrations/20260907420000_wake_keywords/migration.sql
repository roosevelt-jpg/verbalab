-- Wake Word / Keyword Intelligence custom phrases (VL-157)
CREATE TABLE IF NOT EXISTS "wake_keywords" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'keyword',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wake_keywords_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wake_keywords_workspace_id_phrase_kind_key"
  ON "wake_keywords"("workspace_id", "phrase", "kind");

CREATE INDEX IF NOT EXISTS "wake_keywords_organization_id_workspace_id_kind_enabled_idx"
  ON "wake_keywords"("organization_id", "workspace_id", "kind", "enabled");

ALTER TABLE "wake_keywords"
  ADD CONSTRAINT "wake_keywords_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wake_keywords"
  ADD CONSTRAINT "wake_keywords_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
