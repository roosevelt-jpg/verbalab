-- Speaker Intelligence (VL-152)
CREATE TABLE IF NOT EXISTS "speaker_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "external_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "fingerprint_json" JSONB,
    "enrolled_at" TIMESTAMP(3),
    "enrollment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speaker_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "speaker_profiles_organization_id_workspace_id_status_idx"
  ON "speaker_profiles"("organization_id", "workspace_id", "status");

ALTER TABLE "speaker_profiles"
  ADD CONSTRAINT "speaker_profiles_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "speaker_profiles"
  ADD CONSTRAINT "speaker_profiles_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "speaker_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "action" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "decision" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speaker_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "speaker_events_organization_id_workspace_id_created_at_idx"
  ON "speaker_events"("organization_id", "workspace_id", "created_at");

ALTER TABLE "speaker_events"
  ADD CONSTRAINT "speaker_events_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "speaker_events"
  ADD CONSTRAINT "speaker_events_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "speaker_events"
  ADD CONSTRAINT "speaker_events_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "speaker_profiles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
