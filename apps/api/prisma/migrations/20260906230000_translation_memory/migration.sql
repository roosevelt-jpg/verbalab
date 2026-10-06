-- CreateTable
CREATE TABLE IF NOT EXISTS "translation_memory_entries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_lang" TEXT NOT NULL,
    "target_lang" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "target_text" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_memory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (short names — PG identifier limit is 63 chars)
CREATE INDEX IF NOT EXISTS "tm_entries_ws_langs_idx" ON "translation_memory_entries"("workspace_id", "source_lang", "target_lang");

CREATE UNIQUE INDEX IF NOT EXISTS "tm_entries_ws_langs_hash_key" ON "translation_memory_entries"("workspace_id", "source_lang", "target_lang", "source_hash");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "translation_memory_entries" ADD CONSTRAINT "translation_memory_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "translation_memory_entries" ADD CONSTRAINT "translation_memory_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
