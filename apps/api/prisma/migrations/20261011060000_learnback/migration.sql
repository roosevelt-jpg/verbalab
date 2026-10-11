-- Lugemi LearnBack: learner profiles, scenario packs, practice sessions, attempts,
-- transcripts, evaluations, feedback, phrasebook, progress, audio, events, audit

CREATE TABLE IF NOT EXISTS "learnback_learner_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "explanation_language" TEXT NOT NULL DEFAULT 'ak',
    "practice_language" TEXT NOT NULL DEFAULT 'en',
    "optional_accent_target" TEXT,
    "goal" TEXT,
    "accessibility_prefs" JSONB,
    "training_consent" BOOLEAN NOT NULL DEFAULT false,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "reminder_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "reminder_timezone" TEXT,
    "reminder_channel" TEXT,
    "quiet_hours_start" INTEGER,
    "quiet_hours_end" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learnback_learner_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_scenario_packs" (
    "id" TEXT NOT NULL,
    "pack_key" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "corridor_id" TEXT NOT NULL,
    "level_label" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_explanation" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "target_skills" JSONB NOT NULL,
    "follow_up_prompts" JSONB NOT NULL,
    "example_answers" JSONB NOT NULL,
    "phrase_examples" JSONB NOT NULL,
    "rubric_version" TEXT NOT NULL,
    "reviewer_note" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learnback_scenario_packs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_practice_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "scenario_pack_id" TEXT NOT NULL,
    "corridor_id" TEXT NOT NULL,
    "explanation_language" TEXT NOT NULL,
    "practice_language" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "fictional_mode" BOOLEAN NOT NULL DEFAULT false,
    "state" TEXT NOT NULL DEFAULT 'ready',
    "policy_version" TEXT NOT NULL DEFAULT 'learnback_private_v1',
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "training_consent" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learnback_practice_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_attempts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "audio_storage_key" TEXT,
    "audio_hash" TEXT,
    "audio_mime_type" TEXT,
    "prompt_revision" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'uploaded',
    "idempotency_key" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learnback_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_transcript_revisions" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "asr_text" TEXT NOT NULL,
    "edited_text" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "asr_model" TEXT NOT NULL,
    "uncertainty" TEXT NOT NULL DEFAULT 'medium',
    "origin" TEXT NOT NULL DEFAULT 'asr',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learnback_transcript_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_evaluations" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "transcript_revision_id" TEXT NOT NULL,
    "transcript_hash" TEXT NOT NULL,
    "audio_hash" TEXT,
    "rubric_version" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "calibration_version" TEXT NOT NULL DEFAULT 'learnback-cal-descriptive-v1',
    "status" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "unassessed_dimensions" JSONB NOT NULL,
    "pronunciation_status" TEXT NOT NULL,
    "pronunciation_reason" TEXT,
    "pronunciation_findings" JSONB NOT NULL DEFAULT '[]',
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learnback_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_feedback_revisions" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "explanation_language" TEXT NOT NULL,
    "localized_explanation" TEXT NOT NULL,
    "improved_example" TEXT NOT NULL,
    "example_label" TEXT NOT NULL,
    "placeholders" JSONB NOT NULL DEFAULT '[]',
    "content_hash" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learnback_feedback_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_phrasebook_entries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "phrase" TEXT NOT NULL,
    "intended_meaning" TEXT NOT NULL,
    "context" TEXT,
    "practice_language" TEXT NOT NULL,
    "explanation_language" TEXT NOT NULL,
    "source_attempt_id" TEXT,
    "audio_storage_key" TEXT,
    "audio_hash" TEXT,
    "review_status" TEXT NOT NULL DEFAULT 'learner',
    "revision_number" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learnback_phrasebook_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_progress_observations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "skill" TEXT NOT NULL,
    "rubric_version" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "attempt_id" TEXT,
    "assisted" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learnback_progress_observations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_audio_artifacts" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text_hash" TEXT NOT NULL,
    "exact_text" TEXT NOT NULL,
    "storage_key" TEXT,
    "audio_hash" TEXT,
    "mime_type" TEXT,
    "voice_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "model_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learnback_audio_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learnback_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learnback_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "session_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learnback_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "learnback_learner_profiles_organization_id_owner_user_id_key"
  ON "learnback_learner_profiles"("organization_id", "owner_user_id");
CREATE INDEX IF NOT EXISTS "learnback_learner_profiles_organization_id_workspace_id_idx"
  ON "learnback_learner_profiles"("organization_id", "workspace_id");

CREATE UNIQUE INDEX IF NOT EXISTS "learnback_scenario_packs_pack_key_revision_corridor_id_key"
  ON "learnback_scenario_packs"("pack_key", "revision", "corridor_id");
CREATE INDEX IF NOT EXISTS "learnback_scenario_packs_situation_corridor_id_idx"
  ON "learnback_scenario_packs"("situation", "corridor_id");

CREATE INDEX IF NOT EXISTS "learnback_practice_sessions_organization_id_owner_user_id_created_at_idx"
  ON "learnback_practice_sessions"("organization_id", "owner_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "learnback_practice_sessions_organization_id_state_created_at_idx"
  ON "learnback_practice_sessions"("organization_id", "state", "created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "learnback_attempts_session_id_idempotency_key_key"
  ON "learnback_attempts"("session_id", "idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "learnback_attempts_session_id_attempt_number_key"
  ON "learnback_attempts"("session_id", "attempt_number");
CREATE INDEX IF NOT EXISTS "learnback_attempts_session_id_created_at_idx"
  ON "learnback_attempts"("session_id", "created_at");

CREATE INDEX IF NOT EXISTS "learnback_transcript_revisions_attempt_id_is_active_idx"
  ON "learnback_transcript_revisions"("attempt_id", "is_active");

CREATE INDEX IF NOT EXISTS "learnback_evaluations_attempt_id_created_at_idx"
  ON "learnback_evaluations"("attempt_id", "created_at");

CREATE INDEX IF NOT EXISTS "learnback_feedback_revisions_attempt_id_created_at_idx"
  ON "learnback_feedback_revisions"("attempt_id", "created_at");

CREATE INDEX IF NOT EXISTS "learnback_phrasebook_entries_organization_id_owner_user_id_created_at_idx"
  ON "learnback_phrasebook_entries"("organization_id", "owner_user_id", "created_at");

CREATE INDEX IF NOT EXISTS "learnback_progress_observations_organization_id_owner_user_id_created_at_idx"
  ON "learnback_progress_observations"("organization_id", "owner_user_id", "created_at");

CREATE INDEX IF NOT EXISTS "learnback_audio_artifacts_organization_id_owner_user_id_created_at_idx"
  ON "learnback_audio_artifacts"("organization_id", "owner_user_id", "created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "learnback_events_event_id_key" ON "learnback_events"("event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "learnback_events_session_id_sequence_key"
  ON "learnback_events"("session_id", "sequence");
CREATE INDEX IF NOT EXISTS "learnback_events_session_id_idx" ON "learnback_events"("session_id");

CREATE INDEX IF NOT EXISTS "learnback_audit_events_organization_id_created_at_idx"
  ON "learnback_audit_events"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "learnback_audit_events_session_id_idx" ON "learnback_audit_events"("session_id");

DO $$ BEGIN
  ALTER TABLE "learnback_learner_profiles"
    ADD CONSTRAINT "learnback_learner_profiles_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_practice_sessions"
    ADD CONSTRAINT "learnback_practice_sessions_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_practice_sessions"
    ADD CONSTRAINT "learnback_practice_sessions_scenario_pack_id_fkey"
    FOREIGN KEY ("scenario_pack_id") REFERENCES "learnback_scenario_packs"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_attempts"
    ADD CONSTRAINT "learnback_attempts_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "learnback_practice_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_transcript_revisions"
    ADD CONSTRAINT "learnback_transcript_revisions_attempt_id_fkey"
    FOREIGN KEY ("attempt_id") REFERENCES "learnback_attempts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_evaluations"
    ADD CONSTRAINT "learnback_evaluations_attempt_id_fkey"
    FOREIGN KEY ("attempt_id") REFERENCES "learnback_attempts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_evaluations"
    ADD CONSTRAINT "learnback_evaluations_transcript_revision_id_fkey"
    FOREIGN KEY ("transcript_revision_id") REFERENCES "learnback_transcript_revisions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_feedback_revisions"
    ADD CONSTRAINT "learnback_feedback_revisions_attempt_id_fkey"
    FOREIGN KEY ("attempt_id") REFERENCES "learnback_attempts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_feedback_revisions"
    ADD CONSTRAINT "learnback_feedback_revisions_evaluation_id_fkey"
    FOREIGN KEY ("evaluation_id") REFERENCES "learnback_evaluations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_phrasebook_entries"
    ADD CONSTRAINT "learnback_phrasebook_entries_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "learnback_learner_profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_progress_observations"
    ADD CONSTRAINT "learnback_progress_observations_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "learnback_learner_profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_events"
    ADD CONSTRAINT "learnback_events_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "learnback_practice_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "learnback_audit_events"
    ADD CONSTRAINT "learnback_audit_events_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
