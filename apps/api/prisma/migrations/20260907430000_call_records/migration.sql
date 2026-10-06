-- Call Intelligence records (VL-158)
CREATE TABLE IF NOT EXISTS "call_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "external_ref" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'created',
    "duration_seconds" DOUBLE PRECISION,
    "language" TEXT,
    "recording_key" TEXT,
    "recording_filename" TEXT,
    "mime_type" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "analysis_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "call_records_organization_id_workspace_id_created_at_idx"
  ON "call_records"("organization_id", "workspace_id", "created_at");

CREATE INDEX IF NOT EXISTS "call_records_organization_id_workspace_id_status_idx"
  ON "call_records"("organization_id", "workspace_id", "status");

ALTER TABLE "call_records"
  ADD CONSTRAINT "call_records_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_records"
  ADD CONSTRAINT "call_records_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
