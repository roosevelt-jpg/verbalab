-- VoiceBridge domain tables

CREATE TABLE "voice_threads" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "state" TEXT NOT NULL DEFAULT 'active',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "retention_policy" TEXT NOT NULL DEFAULT 'default_90d',
    "max_participants" INTEGER NOT NULL DEFAULT 10,
    "corridor" TEXT NOT NULL DEFAULT 'en-fr',
    "feature_flag" TEXT NOT NULL DEFAULT 'voicebridge',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_memberships" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL,
    "variety" TEXT,
    "language_pref_version" INTEGER NOT NULL DEFAULT 1,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_invitations" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "redeemed_at" TIMESTAMP(3),
    "redeemed_by_user_id" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "active_revision_id" TEXT,
    "reply_to_message_id" TEXT,
    "reply_to_revision_id" TEXT,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "voice_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_source_revisions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "original_audio_key" TEXT,
    "original_audio_mime" TEXT,
    "reviewed_transcript" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "variety" TEXT,
    "supersedes_id" TEXT,
    "correction_reason" TEXT,
    "author_id" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'current',
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_source_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_language_variants" (
    "id" TEXT NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "target_language" TEXT NOT NULL,
    "target_variety" TEXT,
    "text" TEXT NOT NULL,
    "audio_key" TEXT,
    "audio_mime" TEXT,
    "state" TEXT NOT NULL DEFAULT 'queued',
    "model_versions" JSONB,
    "verification_state" TEXT NOT NULL DEFAULT 'not_assessed',
    "verification_issues" JSONB,
    "content_hash" TEXT NOT NULL,
    "supersedes_variant_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_language_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_delivery_records" (
    "id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "revision_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "available_at" TIMESTAMP(3),
    "first_played_at" TIMESTAMP(3),
    "acknowledgment_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_delivery_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_processing_jobs" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "expected_active_revision_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "target_language" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "cost_usd_micros" INTEGER NOT NULL DEFAULT 0,
    "error_class" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_processing_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_consents" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "notice_version" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_consents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_thread_events" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message_id" TEXT,
    "source_revision_id" TEXT,
    "variant_version" INTEGER,
    "correlation_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_thread_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "revision_id" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_deal_draft_links" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "initiator_id" TEXT NOT NULL,
    "deal_session_id" TEXT,
    "selected_revision_ids" JSONB NOT NULL,
    "selected_revision_hashes" JSONB NOT NULL,
    "party_a_user_id" TEXT NOT NULL,
    "party_b_user_id" TEXT NOT NULL,
    "category" TEXT,
    "handoff_key" TEXT NOT NULL,
    "stale_since" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_deal_draft_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "voice_threads_organization_id_state_created_at_idx" ON "voice_threads"("organization_id", "state", "created_at");

CREATE INDEX "voice_threads_workspace_id_created_at_idx" ON "voice_threads"("workspace_id", "created_at");

CREATE INDEX "voice_threads_creator_id_idx" ON "voice_threads"("creator_id");

CREATE INDEX "voice_memberships_user_id_active_idx" ON "voice_memberships"("user_id", "active");

CREATE UNIQUE INDEX "voice_memberships_thread_id_user_id_key" ON "voice_memberships"("thread_id", "user_id");

CREATE UNIQUE INDEX "voice_invitations_token_hash_key" ON "voice_invitations"("token_hash");

CREATE INDEX "voice_invitations_thread_id_expires_at_idx" ON "voice_invitations"("thread_id", "expires_at");

CREATE UNIQUE INDEX "voice_messages_active_revision_id_key" ON "voice_messages"("active_revision_id");

CREATE INDEX "voice_messages_thread_id_created_at_idx" ON "voice_messages"("thread_id", "created_at");

CREATE INDEX "voice_messages_author_id_idx" ON "voice_messages"("author_id");

CREATE UNIQUE INDEX "voice_messages_thread_id_idempotency_key_key" ON "voice_messages"("thread_id", "idempotency_key");

CREATE INDEX "voice_source_revisions_message_id_status_idx" ON "voice_source_revisions"("message_id", "status");

CREATE UNIQUE INDEX "voice_source_revisions_message_id_revision_number_key" ON "voice_source_revisions"("message_id", "revision_number");

CREATE INDEX "voice_language_variants_source_revision_id_state_idx" ON "voice_language_variants"("source_revision_id", "state");

CREATE UNIQUE INDEX "voice_language_variants_source_revision_id_target_language__key" ON "voice_language_variants"("source_revision_id", "target_language", "target_variety", "version");

CREATE INDEX "voice_delivery_records_revision_id_idx" ON "voice_delivery_records"("revision_id");

CREATE UNIQUE INDEX "voice_delivery_records_membership_id_revision_id_key" ON "voice_delivery_records"("membership_id", "revision_id");

CREATE UNIQUE INDEX "voice_processing_jobs_idempotency_key_key" ON "voice_processing_jobs"("idempotency_key");

CREATE INDEX "voice_processing_jobs_thread_id_status_idx" ON "voice_processing_jobs"("thread_id", "status");

CREATE INDEX "voice_processing_jobs_source_revision_id_stage_idx" ON "voice_processing_jobs"("source_revision_id", "stage");

CREATE INDEX "voice_consents_user_id_purpose_idx" ON "voice_consents"("user_id", "purpose");

CREATE INDEX "voice_consents_thread_id_idx" ON "voice_consents"("thread_id");

CREATE UNIQUE INDEX "voice_thread_events_event_id_key" ON "voice_thread_events"("event_id");

CREATE INDEX "voice_thread_events_thread_id_created_at_idx" ON "voice_thread_events"("thread_id", "created_at");

CREATE UNIQUE INDEX "voice_thread_events_thread_id_sequence_key" ON "voice_thread_events"("thread_id", "sequence");

CREATE INDEX "voice_audit_events_organization_id_created_at_idx" ON "voice_audit_events"("organization_id", "created_at");

CREATE INDEX "voice_audit_events_thread_id_created_at_idx" ON "voice_audit_events"("thread_id", "created_at");

CREATE UNIQUE INDEX "voice_deal_draft_links_handoff_key_key" ON "voice_deal_draft_links"("handoff_key");

CREATE INDEX "voice_deal_draft_links_thread_id_created_at_idx" ON "voice_deal_draft_links"("thread_id", "created_at");

CREATE INDEX "voice_deal_draft_links_deal_session_id_idx" ON "voice_deal_draft_links"("deal_session_id");

ALTER TABLE "voice_threads" ADD CONSTRAINT "voice_threads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_memberships" ADD CONSTRAINT "voice_memberships_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "voice_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_invitations" ADD CONSTRAINT "voice_invitations_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "voice_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_messages" ADD CONSTRAINT "voice_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "voice_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_messages" ADD CONSTRAINT "voice_messages_active_revision_id_fkey" FOREIGN KEY ("active_revision_id") REFERENCES "voice_source_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "voice_source_revisions" ADD CONSTRAINT "voice_source_revisions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "voice_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_language_variants" ADD CONSTRAINT "voice_language_variants_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "voice_source_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_delivery_records" ADD CONSTRAINT "voice_delivery_records_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "voice_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_delivery_records" ADD CONSTRAINT "voice_delivery_records_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "voice_source_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_delivery_records" ADD CONSTRAINT "voice_delivery_records_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "voice_language_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "voice_processing_jobs" ADD CONSTRAINT "voice_processing_jobs_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "voice_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_processing_jobs" ADD CONSTRAINT "voice_processing_jobs_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "voice_source_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_consents" ADD CONSTRAINT "voice_consents_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "voice_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_consents" ADD CONSTRAINT "voice_consents_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "voice_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_thread_events" ADD CONSTRAINT "voice_thread_events_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "voice_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_audit_events" ADD CONSTRAINT "voice_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_audit_events" ADD CONSTRAINT "voice_audit_events_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "voice_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "voice_deal_draft_links" ADD CONSTRAINT "voice_deal_draft_links_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "voice_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

