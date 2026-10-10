-- DealBridge domain
CREATE TABLE "deal_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'wholesale_rice',
    "corridor" TEXT NOT NULL DEFAULT 'en-fr',
    "merchant_language" TEXT NOT NULL,
    "buyer_language" TEXT NOT NULL,
    "time_zone" TEXT NOT NULL DEFAULT 'Africa/Accra',
    "state" TEXT NOT NULL DEFAULT 'draft',
    "revision_counter" INTEGER NOT NULL DEFAULT 0,
    "active_revision" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "idempotency_key" TEXT,
    "feature_flag" TEXT NOT NULL DEFAULT 'dealbridge',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "is_fixture" BOOLEAN NOT NULL DEFAULT false,
    "pilot_cohort" TEXT,
    "retention_policy" TEXT NOT NULL DEFAULT 'default_90d',
    "deleted_at" TIMESTAMP(3),
    "deletion_outcome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_participants" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "variety" TEXT,
    "auth_context" TEXT NOT NULL DEFAULT 'session',
    "identity_assurance" TEXT NOT NULL DEFAULT 'authenticated_session',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_invites" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3),
    "redeemed_by_user_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_consent_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "notice_version" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_consent_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_conversation_turns" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "speaker_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "source_language" TEXT NOT NULL,
    "audio_storage_key" TEXT,
    "audio_mime_type" TEXT,
    "audio_bytes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'received',
    "asr_provider" TEXT,
    "asr_model_version" TEXT,
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_conversation_turns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_transcript_revisions" (
    "id" TEXT NOT NULL,
    "turn_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "editor" TEXT NOT NULL,
    "supersedes_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_transcript_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_translation_revisions" (
    "id" TEXT NOT NULL,
    "turn_id" TEXT NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "target_language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "reviewer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_translation_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_term_candidates" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "source_span_ids" TEXT[],
    "speaker_id" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "uncertainty_reason" TEXT,
    "extractor_version" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_term_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_term_snapshots" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "normalized_terms" JSONB NOT NULL,
    "provenance" JSONB NOT NULL,
    "unresolved_fields" TEXT[],
    "schema_version" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_term_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_review_presentations" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "summary_text" TEXT NOT NULL,
    "audio_storage_key" TEXT,
    "audio_hash" TEXT,
    "translation_version" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "presentation_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_review_presentations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_understanding_checks" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "presentation_id" TEXT NOT NULL,
    "presentation_hash" TEXT NOT NULL,
    "response_text" TEXT,
    "response_turn_id" TEXT,
    "comparisons" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'not_assessed',
    "verifier_version" TEXT NOT NULL,
    "clarification_field" TEXT,
    "clarification_question" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_understanding_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_confirmations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "presentation_id" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "presentation_hash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "auth_context" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "server_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_confirmations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_receipts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "merchant_confirmation_id" TEXT NOT NULL,
    "buyer_confirmation_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "key_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersedes_receipt_id" TEXT,
    "superseded_by_receipt_id" TEXT,
    "retention_policy" TEXT NOT NULL,
    "share_token_hash" TEXT,
    "share_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_session_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "server_sequence" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source_revision" INTEGER,
    "active_revision" INTEGER,
    "correlation_id" TEXT,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_session_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "session_id" TEXT,
    "actor_user_id" TEXT,
    "operation" TEXT NOT NULL,
    "affected_revision" INTEGER,
    "metadata" JSONB,
    "server_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_pilot_configs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "merchant_variety" TEXT NOT NULL,
    "buyer_variety" TEXT NOT NULL,
    "enrollment_starts_at" TIMESTAMP(3) NOT NULL,
    "enrollment_ends_at" TIMESTAMP(3) NOT NULL,
    "cohort_assignment" JSONB NOT NULL,
    "metric_definitions" JSONB NOT NULL,
    "cost_budgets" JSONB NOT NULL,
    "thresholds" JSONB NOT NULL,
    "evaluation_protocol" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_pilot_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_pilot_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "session_id" TEXT,
    "merchant_pseudo_id" TEXT NOT NULL,
    "cohort" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "revision" INTEGER,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_pilot_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_usage_cost_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "amount_usd_micros" INTEGER NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_usage_cost_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_sessions_organization_id_idempotency_key_key" ON "deal_sessions"("organization_id", "idempotency_key");
CREATE INDEX "deal_sessions_organization_id_state_created_at_idx" ON "deal_sessions"("organization_id", "state", "created_at");
CREATE INDEX "deal_sessions_workspace_id_created_at_idx" ON "deal_sessions"("workspace_id", "created_at");
CREATE INDEX "deal_sessions_is_demo_is_fixture_idx" ON "deal_sessions"("is_demo", "is_fixture");

CREATE UNIQUE INDEX "deal_participants_session_id_role_key" ON "deal_participants"("session_id", "role");
CREATE UNIQUE INDEX "deal_participants_session_id_user_id_key" ON "deal_participants"("session_id", "user_id");
CREATE INDEX "deal_participants_user_id_idx" ON "deal_participants"("user_id");

CREATE UNIQUE INDEX "deal_invites_token_hash_key" ON "deal_invites"("token_hash");
CREATE INDEX "deal_invites_session_id_expires_at_idx" ON "deal_invites"("session_id", "expires_at");

CREATE INDEX "deal_consent_events_session_id_purpose_idx" ON "deal_consent_events"("session_id", "purpose");
CREATE INDEX "deal_consent_events_participant_id_purpose_idx" ON "deal_consent_events"("participant_id", "purpose");

CREATE UNIQUE INDEX "deal_conversation_turns_session_id_sequence_key" ON "deal_conversation_turns"("session_id", "sequence");
CREATE INDEX "deal_conversation_turns_session_id_created_at_idx" ON "deal_conversation_turns"("session_id", "created_at");

CREATE INDEX "deal_transcript_revisions_turn_id_created_at_idx" ON "deal_transcript_revisions"("turn_id", "created_at");
CREATE INDEX "deal_translation_revisions_turn_id_target_language_created_at_idx" ON "deal_translation_revisions"("turn_id", "target_language", "created_at");
CREATE INDEX "deal_term_candidates_session_id_field_idx" ON "deal_term_candidates"("session_id", "field");

CREATE UNIQUE INDEX "deal_term_snapshots_session_id_revision_key" ON "deal_term_snapshots"("session_id", "revision");
CREATE INDEX "deal_term_snapshots_content_hash_idx" ON "deal_term_snapshots"("content_hash");

CREATE UNIQUE INDEX "deal_review_presentations_snapshot_id_participant_id_key" ON "deal_review_presentations"("snapshot_id", "participant_id");
CREATE INDEX "deal_review_presentations_presentation_hash_idx" ON "deal_review_presentations"("presentation_hash");

CREATE INDEX "deal_understanding_checks_session_id_snapshot_id_idx" ON "deal_understanding_checks"("session_id", "snapshot_id");
CREATE INDEX "deal_understanding_checks_participant_id_snapshot_id_idx" ON "deal_understanding_checks"("participant_id", "snapshot_id");

CREATE UNIQUE INDEX "deal_confirmations_session_id_participant_id_snapshot_id_action_idempotency_key_key" ON "deal_confirmations"("session_id", "participant_id", "snapshot_id", "action", "idempotency_key");
CREATE INDEX "deal_confirmations_session_id_snapshot_id_action_idx" ON "deal_confirmations"("session_id", "snapshot_id", "action");

CREATE UNIQUE INDEX "deal_receipts_session_id_snapshot_id_key" ON "deal_receipts"("session_id", "snapshot_id");
CREATE INDEX "deal_receipts_content_hash_idx" ON "deal_receipts"("content_hash");

CREATE UNIQUE INDEX "deal_session_events_session_id_server_sequence_key" ON "deal_session_events"("session_id", "server_sequence");
CREATE INDEX "deal_session_events_session_id_occurred_at_idx" ON "deal_session_events"("session_id", "occurred_at");
CREATE INDEX "deal_session_events_organization_id_occurred_at_idx" ON "deal_session_events"("organization_id", "occurred_at");

CREATE INDEX "deal_audit_events_organization_id_server_timestamp_idx" ON "deal_audit_events"("organization_id", "server_timestamp");
CREATE INDEX "deal_audit_events_session_id_server_timestamp_idx" ON "deal_audit_events"("session_id", "server_timestamp");

CREATE UNIQUE INDEX "deal_pilot_configs_organization_id_version_key" ON "deal_pilot_configs"("organization_id", "version");
CREATE INDEX "deal_pilot_configs_organization_id_active_idx" ON "deal_pilot_configs"("organization_id", "active");

CREATE INDEX "deal_pilot_events_organization_id_type_occurred_at_idx" ON "deal_pilot_events"("organization_id", "type", "occurred_at");
CREATE INDEX "deal_pilot_events_merchant_pseudo_id_occurred_at_idx" ON "deal_pilot_events"("merchant_pseudo_id", "occurred_at");
CREATE INDEX "deal_pilot_events_cohort_occurred_at_idx" ON "deal_pilot_events"("cohort", "occurred_at");

CREATE INDEX "deal_usage_cost_events_session_id_component_idx" ON "deal_usage_cost_events"("session_id", "component");
CREATE INDEX "deal_usage_cost_events_organization_id_created_at_idx" ON "deal_usage_cost_events"("organization_id", "created_at");

ALTER TABLE "deal_sessions" ADD CONSTRAINT "deal_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_participants" ADD CONSTRAINT "deal_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_invites" ADD CONSTRAINT "deal_invites_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_consent_events" ADD CONSTRAINT "deal_consent_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_consent_events" ADD CONSTRAINT "deal_consent_events_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "deal_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_conversation_turns" ADD CONSTRAINT "deal_conversation_turns_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_conversation_turns" ADD CONSTRAINT "deal_conversation_turns_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "deal_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_transcript_revisions" ADD CONSTRAINT "deal_transcript_revisions_turn_id_fkey" FOREIGN KEY ("turn_id") REFERENCES "deal_conversation_turns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_translation_revisions" ADD CONSTRAINT "deal_translation_revisions_turn_id_fkey" FOREIGN KEY ("turn_id") REFERENCES "deal_conversation_turns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_term_candidates" ADD CONSTRAINT "deal_term_candidates_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_term_snapshots" ADD CONSTRAINT "deal_term_snapshots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_review_presentations" ADD CONSTRAINT "deal_review_presentations_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "deal_term_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_review_presentations" ADD CONSTRAINT "deal_review_presentations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "deal_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_understanding_checks" ADD CONSTRAINT "deal_understanding_checks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_understanding_checks" ADD CONSTRAINT "deal_understanding_checks_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "deal_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_understanding_checks" ADD CONSTRAINT "deal_understanding_checks_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "deal_term_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_understanding_checks" ADD CONSTRAINT "deal_understanding_checks_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "deal_review_presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_confirmations" ADD CONSTRAINT "deal_confirmations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_confirmations" ADD CONSTRAINT "deal_confirmations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "deal_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_confirmations" ADD CONSTRAINT "deal_confirmations_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "deal_term_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_confirmations" ADD CONSTRAINT "deal_confirmations_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "deal_review_presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_receipts" ADD CONSTRAINT "deal_receipts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_receipts" ADD CONSTRAINT "deal_receipts_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "deal_term_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_session_events" ADD CONSTRAINT "deal_session_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_audit_events" ADD CONSTRAINT "deal_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_audit_events" ADD CONSTRAINT "deal_audit_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deal_pilot_configs" ADD CONSTRAINT "deal_pilot_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_pilot_events" ADD CONSTRAINT "deal_pilot_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_usage_cost_events" ADD CONSTRAINT "deal_usage_cost_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "deal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
