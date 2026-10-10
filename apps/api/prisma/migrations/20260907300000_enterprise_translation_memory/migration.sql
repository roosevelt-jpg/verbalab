-- VL-145 Enterprise Translation Memory: scopes, versioning, optional embeddings

ALTER TABLE "translation_memory_entries"
  ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'workspace',
  ADD COLUMN IF NOT EXISTS "project_key" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "translation_memory_entries"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE INDEX IF NOT EXISTS "tm_entries_org_scope_langs_idx"
  ON "translation_memory_entries"("organization_id", "scope", "source_lang", "target_lang");

CREATE INDEX IF NOT EXISTS "tm_entries_org_project_langs_idx"
  ON "translation_memory_entries"("organization_id", "project_key", "source_lang", "target_lang");

CREATE TABLE IF NOT EXISTS "translation_memory_versions" (
  "id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "source_text" TEXT NOT NULL,
  "target_text" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "project_key" TEXT NOT NULL DEFAULT '',
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "translation_memory_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tm_versions_entry_version_key"
  ON "translation_memory_versions"("entry_id", "version");

CREATE INDEX IF NOT EXISTS "tm_versions_entry_idx"
  ON "translation_memory_versions"("entry_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'translation_memory_versions_entry_id_fkey'
  ) THEN
    ALTER TABLE "translation_memory_versions"
      ADD CONSTRAINT "translation_memory_versions_entry_id_fkey"
      FOREIGN KEY ("entry_id") REFERENCES "translation_memory_entries"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
