-- Voice Studio collaborative workflow (script → translate → speech → review → export)

ALTER TABLE "voice_studio_projects" ADD COLUMN IF NOT EXISTS "source_language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "voice_studio_projects" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "voice_studio_projects" ADD COLUMN IF NOT EXISTS "review_policy" TEXT NOT NULL DEFAULT 'independent_reviewer';
ALTER TABLE "voice_studio_projects" ADD COLUMN IF NOT EXISTS "owner_user_id" TEXT;
ALTER TABLE "voice_studio_projects" ADD COLUMN IF NOT EXISTS "retention_days" INTEGER;

CREATE INDEX IF NOT EXISTS "voice_studio_projects_status_idx" ON "voice_studio_projects"("status");

CREATE TABLE IF NOT EXISTS "studio_source_revisions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "author_user_id" TEXT,
    "parent_id" TEXT,
    "segments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_source_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_editions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "language_variety" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dictionary_hash" TEXT,
    "segments" JSONB NOT NULL DEFAULT '[]',
    "selected_take_ids" JSONB NOT NULL DEFAULT '[]',
    "expected_revision" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_editions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_audio_takes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "stable_segment_id" TEXT NOT NULL,
    "translation_text" TEXT NOT NULL,
    "translation_hash" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "synth_engine" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL,
    "dictionary_hash" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "audio_sha256" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "audio_base64" TEXT NOT NULL,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_audio_takes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_native_reviews" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "take_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT NOT NULL,
    "qualifications" JSONB NOT NULL DEFAULT '[]',
    "ratings" JSONB NOT NULL,
    "span_notes" JSONB NOT NULL DEFAULT '[]',
    "pronunciation_notes" TEXT,
    "meaning_notes" TEXT,
    "decision" TEXT NOT NULL,
    "take_hash" TEXT NOT NULL,
    "training_eligible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_native_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_assemblies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "take_ids" JSONB NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "audio_sha256" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "audio_base64" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_assemblies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_releases" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "assembly_id" TEXT NOT NULL,
    "assembly_hash" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL DEFAULT 'studio-review-v1',
    "approver_user_id" TEXT NOT NULL,
    "producer_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_export_artifacts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "audio_base64" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_export_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "studio_pronunciation_entries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'tenant',
    "project_id" TEXT,
    "language_variety" TEXT NOT NULL,
    "written_form" TEXT NOT NULL,
    "representation" TEXT NOT NULL DEFAULT 'pronunciation_alias',
    "value" TEXT NOT NULL,
    "compatible_model_ids" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'awaiting_native_review',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "studio_pronunciation_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "studio_source_revisions_project_id_created_at_idx" ON "studio_source_revisions"("project_id", "created_at");
CREATE INDEX IF NOT EXISTS "studio_source_revisions_organization_id_workspace_id_idx" ON "studio_source_revisions"("organization_id", "workspace_id");
CREATE INDEX IF NOT EXISTS "studio_editions_project_id_idx" ON "studio_editions"("project_id");
CREATE INDEX IF NOT EXISTS "studio_editions_organization_id_workspace_id_idx" ON "studio_editions"("organization_id", "workspace_id");
CREATE INDEX IF NOT EXISTS "studio_audio_takes_edition_id_stable_segment_id_idx" ON "studio_audio_takes"("edition_id", "stable_segment_id");
CREATE INDEX IF NOT EXISTS "studio_audio_takes_organization_id_workspace_id_idx" ON "studio_audio_takes"("organization_id", "workspace_id");
CREATE INDEX IF NOT EXISTS "studio_native_reviews_take_id_idx" ON "studio_native_reviews"("take_id");
CREATE INDEX IF NOT EXISTS "studio_native_reviews_organization_id_workspace_id_idx" ON "studio_native_reviews"("organization_id", "workspace_id");
CREATE INDEX IF NOT EXISTS "studio_assemblies_edition_id_idx" ON "studio_assemblies"("edition_id");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_releases_assembly_id_key" ON "studio_releases"("assembly_id");
CREATE INDEX IF NOT EXISTS "studio_releases_project_id_idx" ON "studio_releases"("project_id");
CREATE INDEX IF NOT EXISTS "studio_export_artifacts_release_id_idx" ON "studio_export_artifacts"("release_id");
CREATE INDEX IF NOT EXISTS "studio_pronunciation_entries_workspace_id_language_variety_written_form_idx" ON "studio_pronunciation_entries"("workspace_id", "language_variety", "written_form");
CREATE INDEX IF NOT EXISTS "studio_pronunciation_entries_organization_id_workspace_id_idx" ON "studio_pronunciation_entries"("organization_id", "workspace_id");

ALTER TABLE "studio_source_revisions" ADD CONSTRAINT "studio_source_revisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_source_revisions" ADD CONSTRAINT "studio_source_revisions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_source_revisions" ADD CONSTRAINT "studio_source_revisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "voice_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "studio_editions" ADD CONSTRAINT "studio_editions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_editions" ADD CONSTRAINT "studio_editions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_editions" ADD CONSTRAINT "studio_editions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "voice_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_editions" ADD CONSTRAINT "studio_editions_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "studio_source_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "studio_audio_takes" ADD CONSTRAINT "studio_audio_takes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_audio_takes" ADD CONSTRAINT "studio_audio_takes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_audio_takes" ADD CONSTRAINT "studio_audio_takes_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "studio_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "studio_native_reviews" ADD CONSTRAINT "studio_native_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_native_reviews" ADD CONSTRAINT "studio_native_reviews_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_native_reviews" ADD CONSTRAINT "studio_native_reviews_take_id_fkey" FOREIGN KEY ("take_id") REFERENCES "studio_audio_takes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "studio_assemblies" ADD CONSTRAINT "studio_assemblies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_assemblies" ADD CONSTRAINT "studio_assemblies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_assemblies" ADD CONSTRAINT "studio_assemblies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "voice_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_assemblies" ADD CONSTRAINT "studio_assemblies_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "studio_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "studio_releases" ADD CONSTRAINT "studio_releases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_releases" ADD CONSTRAINT "studio_releases_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_releases" ADD CONSTRAINT "studio_releases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "voice_studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_releases" ADD CONSTRAINT "studio_releases_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "studio_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_releases" ADD CONSTRAINT "studio_releases_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "studio_assemblies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "studio_export_artifacts" ADD CONSTRAINT "studio_export_artifacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_export_artifacts" ADD CONSTRAINT "studio_export_artifacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_export_artifacts" ADD CONSTRAINT "studio_export_artifacts_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "studio_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "studio_pronunciation_entries" ADD CONSTRAINT "studio_pronunciation_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_pronunciation_entries" ADD CONSTRAINT "studio_pronunciation_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
