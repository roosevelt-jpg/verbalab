-- Language Assurance: immutable artifact bundles, policy-gated verification runs, native review

CREATE TABLE IF NOT EXISTS "assurance_artifact_bundles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "content_category" TEXT NOT NULL,
    "corridor" TEXT NOT NULL DEFAULT 'en-ak',
    "source_language" TEXT NOT NULL,
    "target_language" TEXT NOT NULL,
    "source_variety" TEXT,
    "target_variety" TEXT,
    "source_text" TEXT NOT NULL,
    "source_text_hash" TEXT NOT NULL,
    "target_text" TEXT NOT NULL,
    "target_text_hash" TEXT NOT NULL,
    "audio_storage_key" TEXT,
    "audio_sha256" TEXT,
    "audio_mime_type" TEXT,
    "model_version" TEXT,
    "voice_version" TEXT,
    "terminology_snapshot" JSONB,
    "provenance" JSONB,
    "bundle_hash" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assurance_artifact_bundles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assurance_policy_snapshots" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "version" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "content_category" TEXT NOT NULL,
    "required_stages" JSONB NOT NULL,
    "require_native_review" BOOLEAN NOT NULL DEFAULT true,
    "allow_overrides" BOOLEAN NOT NULL DEFAULT false,
    "max_retries" INTEGER NOT NULL DEFAULT 1,
    "thresholds" JSONB,
    "budget_note" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assurance_policy_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assurance_verification_runs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "execution_state" TEXT NOT NULL DEFAULT 'queued',
    "disposition" TEXT,
    "calibration_version" TEXT NOT NULL DEFAULT 'assurance-cal-unmeasured-v1',
    "model_versions" JSONB,
    "unavailable_checks" JSONB NOT NULL DEFAULT '[]',
    "stage_states" JSONB NOT NULL DEFAULT '{}',
    "idempotency_key" TEXT NOT NULL,
    "report_hash" TEXT,
    "report_markdown" TEXT,
    "report_json" JSONB,
    "created_by_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assurance_verification_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assurance_check_findings" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source_evidence" TEXT,
    "target_evidence" TEXT,
    "audio_timestamp_ms" INTEGER,
    "uncertainty" TEXT,
    "score_meaning" TEXT NOT NULL DEFAULT 'uncalibrated_detector_score',
    "reason_code" TEXT,
    "evidence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assurance_check_findings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assurance_review_assignments" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "variety" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'both',
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assurance_review_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assurance_human_reviews" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "reviewer_user_id" TEXT NOT NULL,
    "source_text_hash" TEXT NOT NULL,
    "target_text_hash" TEXT NOT NULL,
    "audio_sha256" TEXT,
    "judgment" TEXT NOT NULL,
    "meaning_ok" BOOLEAN,
    "pronunciation_ok" BOOLEAN,
    "tone_ok" BOOLEAN,
    "naturalness_ok" BOOLEAN,
    "audio_integrity_ok" BOOLEAN,
    "notes" TEXT,
    "correction_suggestion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assurance_human_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assurance_release_evidence" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "bundle_hash" TEXT NOT NULL,
    "report_hash" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "disposition" TEXT NOT NULL,
    "decided_by_id" TEXT NOT NULL,
    "reason" TEXT,
    "evidence_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assurance_release_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assurance_events" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assurance_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assurance_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "run_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assurance_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "assurance_artifact_bundles_organization_id_bundle_hash_key" ON "assurance_artifact_bundles"("organization_id", "bundle_hash");
CREATE INDEX IF NOT EXISTS "assurance_artifact_bundles_organization_id_created_at_idx" ON "assurance_artifact_bundles"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "assurance_artifact_bundles_workspace_id_created_at_idx" ON "assurance_artifact_bundles"("workspace_id", "created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "assurance_policy_snapshots_organization_id_version_task_corridor_key" ON "assurance_policy_snapshots"("organization_id", "version", "task", "corridor");
CREATE INDEX IF NOT EXISTS "assurance_policy_snapshots_task_corridor_idx" ON "assurance_policy_snapshots"("task", "corridor");

CREATE UNIQUE INDEX IF NOT EXISTS "assurance_verification_runs_organization_id_idempotency_key_key" ON "assurance_verification_runs"("organization_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "assurance_verification_runs_organization_id_execution_state_created_at_idx" ON "assurance_verification_runs"("organization_id", "execution_state", "created_at");
CREATE INDEX IF NOT EXISTS "assurance_verification_runs_bundle_id_idx" ON "assurance_verification_runs"("bundle_id");

CREATE INDEX IF NOT EXISTS "assurance_check_findings_run_id_stage_severity_idx" ON "assurance_check_findings"("run_id", "stage", "severity");
CREATE INDEX IF NOT EXISTS "assurance_review_assignments_reviewer_user_id_status_idx" ON "assurance_review_assignments"("reviewer_user_id", "status");
CREATE INDEX IF NOT EXISTS "assurance_review_assignments_run_id_idx" ON "assurance_review_assignments"("run_id");
CREATE INDEX IF NOT EXISTS "assurance_human_reviews_run_id_created_at_idx" ON "assurance_human_reviews"("run_id", "created_at");
CREATE INDEX IF NOT EXISTS "assurance_human_reviews_organization_id_created_at_idx" ON "assurance_human_reviews"("organization_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "assurance_release_evidence_run_id_bundle_hash_report_hash_key" ON "assurance_release_evidence"("run_id", "bundle_hash", "report_hash");
CREATE INDEX IF NOT EXISTS "assurance_release_evidence_run_id_idx" ON "assurance_release_evidence"("run_id");
CREATE UNIQUE INDEX IF NOT EXISTS "assurance_events_event_id_key" ON "assurance_events"("event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "assurance_events_run_id_sequence_key" ON "assurance_events"("run_id", "sequence");
CREATE INDEX IF NOT EXISTS "assurance_events_run_id_idx" ON "assurance_events"("run_id");
CREATE INDEX IF NOT EXISTS "assurance_audit_events_organization_id_created_at_idx" ON "assurance_audit_events"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "assurance_audit_events_run_id_idx" ON "assurance_audit_events"("run_id");

ALTER TABLE "assurance_artifact_bundles" ADD CONSTRAINT "assurance_artifact_bundles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_policy_snapshots" ADD CONSTRAINT "assurance_policy_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_verification_runs" ADD CONSTRAINT "assurance_verification_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_verification_runs" ADD CONSTRAINT "assurance_verification_runs_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "assurance_artifact_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_verification_runs" ADD CONSTRAINT "assurance_verification_runs_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "assurance_policy_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assurance_check_findings" ADD CONSTRAINT "assurance_check_findings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "assurance_verification_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_review_assignments" ADD CONSTRAINT "assurance_review_assignments_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "assurance_verification_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_human_reviews" ADD CONSTRAINT "assurance_human_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_human_reviews" ADD CONSTRAINT "assurance_human_reviews_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "assurance_verification_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_release_evidence" ADD CONSTRAINT "assurance_release_evidence_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "assurance_verification_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_events" ADD CONSTRAINT "assurance_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "assurance_verification_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assurance_audit_events" ADD CONSTRAINT "assurance_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
