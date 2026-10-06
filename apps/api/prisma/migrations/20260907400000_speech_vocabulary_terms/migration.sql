-- Custom STT vocabulary (VL-151 Speech Recognition Engine)
CREATE TABLE IF NOT EXISTS "speech_vocabulary_terms" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speech_vocabulary_terms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "speech_vocabulary_terms_workspace_id_phrase_key"
  ON "speech_vocabulary_terms"("workspace_id", "phrase");

CREATE INDEX IF NOT EXISTS "speech_vocabulary_terms_organization_id_workspace_id_idx"
  ON "speech_vocabulary_terms"("organization_id", "workspace_id");

ALTER TABLE "speech_vocabulary_terms"
  ADD CONSTRAINT "speech_vocabulary_terms_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "speech_vocabulary_terms"
  ADD CONSTRAINT "speech_vocabulary_terms_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
