-- MeetingBridge: multilingual meetings with revision-linked transcripts and explicit confirmations

CREATE TABLE IF NOT EXISTS "meeting_meetings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agenda" TEXT NOT NULL DEFAULT '',
    "time_zone" TEXT NOT NULL DEFAULT 'Africa/Accra',
    "state" TEXT NOT NULL DEFAULT 'scheduled',
    "corridor" TEXT NOT NULL DEFAULT 'en-ak',
    "supported_languages" JSONB NOT NULL,
    "terminology_snapshot" JSONB,
    "approval_policy" JSONB NOT NULL,
    "max_participants" INTEGER NOT NULL DEFAULT 6,
    "interpretation_mode" TEXT NOT NULL DEFAULT 'turn_taking',
    "media_mode" TEXT NOT NULL DEFAULT 'phrase_upload',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "retention_policy" TEXT NOT NULL DEFAULT 'default_90d',
    "feature_flag" TEXT NOT NULL DEFAULT 'meetingbridge',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "is_fixture" BOOLEAN NOT NULL DEFAULT false,
    "closed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_meetings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_memberships" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "speaking_language" TEXT NOT NULL,
    "listening_language" TEXT NOT NULL,
    "speaking_variety" TEXT,
    "listening_variety" TEXT,
    "listening_mode" TEXT NOT NULL DEFAULT 'captions_only',
    "presence" TEXT NOT NULL DEFAULT 'offline',
    "language_pref_version" INTEGER NOT NULL DEFAULT 1,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_invitations" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "redeemed_at" TIMESTAMP(3),
    "redeemed_by_user_id" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'participant',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_utterances" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "speaker_id" TEXT NOT NULL,
    "turn_id" TEXT NOT NULL,
    "active_revision_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_utterances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_utterance_revisions" (
    "id" TEXT NOT NULL,
    "utterance_id" TEXT NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "original_text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "variety" TEXT,
    "audio_key" TEXT,
    "audio_mime" TEXT,
    "commit_state" TEXT NOT NULL DEFAULT 'committed',
    "parent_revision_id" TEXT,
    "content_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'current',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_utterance_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_translation_revisions" (
    "id" TEXT NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "target_language" TEXT NOT NULL,
    "target_variety" TEXT,
    "text" TEXT NOT NULL,
    "audio_key" TEXT,
    "text_hash" TEXT NOT NULL,
    "model_version" TEXT NOT NULL DEFAULT 'lugemi-mt',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_translation_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_items" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "active_revision_id" TEXT,
    "state" TEXT NOT NULL DEFAULT 'proposed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_item_revisions" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "wording" TEXT NOT NULL,
    "owner_participant_ids" JSONB NOT NULL,
    "required_approver_ids" JSONB NOT NULL,
    "due_date" TEXT,
    "time_zone" TEXT,
    "conditions" JSONB,
    "source_revision_ids" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'current',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_item_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_review_presentations" (
    "id" TEXT NOT NULL,
    "item_revision_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "wording" TEXT NOT NULL,
    "presentation_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_review_presentations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_item_confirmations" (
    "id" TEXT NOT NULL,
    "item_revision_id" TEXT NOT NULL,
    "presentation_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "item_hash" TEXT NOT NULL,
    "presentation_hash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_item_confirmations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_disagreements" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "item_revision_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "proposed_wording" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_disagreements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_minutes_revisions" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "markdown" TEXT NOT NULL,
    "json_payload" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "issued_by_id" TEXT NOT NULL,
    "supersedes_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_minutes_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_exports" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "minutes_revision_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "destination" TEXT NOT NULL DEFAULT 'private_download',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "storage_key" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_exports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_events" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actor_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_consents" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notice_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_consents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "meeting_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "meeting_invitations_token_hash_key" ON "meeting_invitations"("token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_memberships_meeting_id_user_id_key" ON "meeting_memberships"("meeting_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_utterances_meeting_id_turn_id_key" ON "meeting_utterances"("meeting_id", "turn_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_utterances_active_revision_id_key" ON "meeting_utterances"("active_revision_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_utterance_revisions_utterance_id_revision_number_key" ON "meeting_utterance_revisions"("utterance_id", "revision_number");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_items_active_revision_id_key" ON "meeting_items"("active_revision_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_item_revisions_item_id_revision_number_key" ON "meeting_item_revisions"("item_id", "revision_number");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_review_presentations_item_revision_id_participant_id_language_key" ON "meeting_review_presentations"("item_revision_id", "participant_id", "language");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_item_confirmations_item_revision_id_actor_id_idempotency_key_key" ON "meeting_item_confirmations"("item_revision_id", "actor_id", "idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_minutes_revisions_meeting_id_revision_number_key" ON "meeting_minutes_revisions"("meeting_id", "revision_number");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_exports_meeting_id_idempotency_key_key" ON "meeting_exports"("meeting_id", "idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_events_event_id_key" ON "meeting_events"("event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_events_meeting_id_sequence_key" ON "meeting_events"("meeting_id", "sequence");

CREATE INDEX IF NOT EXISTS "meeting_meetings_organization_id_state_created_at_idx" ON "meeting_meetings"("organization_id", "state", "created_at");
CREATE INDEX IF NOT EXISTS "meeting_meetings_workspace_id_created_at_idx" ON "meeting_meetings"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "meeting_meetings_organizer_id_idx" ON "meeting_meetings"("organizer_id");
CREATE INDEX IF NOT EXISTS "meeting_memberships_user_id_active_idx" ON "meeting_memberships"("user_id", "active");
CREATE INDEX IF NOT EXISTS "meeting_invitations_meeting_id_expires_at_idx" ON "meeting_invitations"("meeting_id", "expires_at");
CREATE INDEX IF NOT EXISTS "meeting_utterances_meeting_id_created_at_idx" ON "meeting_utterances"("meeting_id", "created_at");
CREATE INDEX IF NOT EXISTS "meeting_utterances_speaker_id_idx" ON "meeting_utterances"("speaker_id");
CREATE INDEX IF NOT EXISTS "meeting_utterance_revisions_utterance_id_status_idx" ON "meeting_utterance_revisions"("utterance_id", "status");
CREATE INDEX IF NOT EXISTS "meeting_translation_revisions_source_revision_id_target_language_idx" ON "meeting_translation_revisions"("source_revision_id", "target_language");
CREATE INDEX IF NOT EXISTS "meeting_items_meeting_id_state_idx" ON "meeting_items"("meeting_id", "state");
CREATE INDEX IF NOT EXISTS "meeting_item_revisions_item_id_status_idx" ON "meeting_item_revisions"("item_id", "status");
CREATE INDEX IF NOT EXISTS "meeting_item_confirmations_item_revision_id_action_idx" ON "meeting_item_confirmations"("item_revision_id", "action");
CREATE INDEX IF NOT EXISTS "meeting_disagreements_item_id_status_idx" ON "meeting_disagreements"("item_id", "status");
CREATE INDEX IF NOT EXISTS "meeting_events_meeting_id_created_at_idx" ON "meeting_events"("meeting_id", "created_at");
CREATE INDEX IF NOT EXISTS "meeting_consents_meeting_id_purpose_idx" ON "meeting_consents"("meeting_id", "purpose");
CREATE INDEX IF NOT EXISTS "meeting_audit_events_organization_id_created_at_idx" ON "meeting_audit_events"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "meeting_audit_events_meeting_id_idx" ON "meeting_audit_events"("meeting_id");

ALTER TABLE "meeting_meetings" ADD CONSTRAINT "meeting_meetings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_memberships" ADD CONSTRAINT "meeting_memberships_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_invitations" ADD CONSTRAINT "meeting_invitations_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_utterances" ADD CONSTRAINT "meeting_utterances_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_utterance_revisions" ADD CONSTRAINT "meeting_utterance_revisions_utterance_id_fkey" FOREIGN KEY ("utterance_id") REFERENCES "meeting_utterances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_utterances" ADD CONSTRAINT "meeting_utterances_active_revision_id_fkey" FOREIGN KEY ("active_revision_id") REFERENCES "meeting_utterance_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "meeting_translation_revisions" ADD CONSTRAINT "meeting_translation_revisions_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "meeting_utterance_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_items" ADD CONSTRAINT "meeting_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_item_revisions" ADD CONSTRAINT "meeting_item_revisions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "meeting_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_items" ADD CONSTRAINT "meeting_items_active_revision_id_fkey" FOREIGN KEY ("active_revision_id") REFERENCES "meeting_item_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "meeting_review_presentations" ADD CONSTRAINT "meeting_review_presentations_item_revision_id_fkey" FOREIGN KEY ("item_revision_id") REFERENCES "meeting_item_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_item_confirmations" ADD CONSTRAINT "meeting_item_confirmations_item_revision_id_fkey" FOREIGN KEY ("item_revision_id") REFERENCES "meeting_item_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_item_confirmations" ADD CONSTRAINT "meeting_item_confirmations_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "meeting_review_presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_disagreements" ADD CONSTRAINT "meeting_disagreements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "meeting_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_minutes_revisions" ADD CONSTRAINT "meeting_minutes_revisions_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_exports" ADD CONSTRAINT "meeting_exports_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_exports" ADD CONSTRAINT "meeting_exports_minutes_revision_id_fkey" FOREIGN KEY ("minutes_revision_id") REFERENCES "meeting_minutes_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_events" ADD CONSTRAINT "meeting_events_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_consents" ADD CONSTRAINT "meeting_consents_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_consents" ADD CONSTRAINT "meeting_consents_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "meeting_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_audit_events" ADD CONSTRAINT "meeting_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_audit_events" ADD CONSTRAINT "meeting_audit_events_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meeting_meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
