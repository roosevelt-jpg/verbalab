-- Lugemi Everyday: private sessions, documents, OCR/source revisions, translation, explanation, Q&A, audio, replies

CREATE TABLE IF NOT EXISTS "everyday_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "preferred_variety" TEXT NOT NULL,
    "source_language" TEXT NOT NULL DEFAULT 'en',
    "corridor" TEXT NOT NULL DEFAULT 'en-ak',
    "state" TEXT NOT NULL DEFAULT 'capturing',
    "policy_version" TEXT NOT NULL DEFAULT 'everyday_private_v1',
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "training_consent" BOOLEAN NOT NULL DEFAULT false,
    "sensitive_policy_ok" BOOLEAN NOT NULL DEFAULT false,
    "document_category" TEXT NOT NULL DEFAULT 'administrative_notice',
    "page_budget_used" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "everyday_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_document_assets" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "page_count" INTEGER NOT NULL DEFAULT 1,
    "consent_scope" TEXT NOT NULL DEFAULT 'private',
    "quality_report" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_document_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_ocr_revisions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "model_version" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "full_text" TEXT NOT NULL,
    "reading_order_ok" BOOLEAN NOT NULL DEFAULT true,
    "layout_status" TEXT NOT NULL DEFAULT 'resolved',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_ocr_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_source_revisions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "ocr_revision_id" TEXT,
    "parent_id" TEXT,
    "content_hash" TEXT NOT NULL,
    "full_text" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'ocr',
    "author_user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_source_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_translation_revisions" (
    "id" TEXT NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "target_variety" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "faithful_text" TEXT NOT NULL,
    "block_mappings" JSONB NOT NULL,
    "model_version" TEXT NOT NULL,
    "glossary_version" TEXT,
    "critical_findings" JSONB NOT NULL DEFAULT '[]',
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_translation_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_explanation_revisions" (
    "id" TEXT NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "translation_revision_id" TEXT,
    "content_hash" TEXT NOT NULL,
    "claims" JSONB NOT NULL,
    "simplified_text" TEXT NOT NULL,
    "omissions" JSONB NOT NULL DEFAULT '[]',
    "uncertainty_notes" JSONB NOT NULL DEFAULT '[]',
    "model_version" TEXT NOT NULL,
    "advice_disclaimer" TEXT NOT NULL,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_explanation_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_question_answers" (
    "id" TEXT NOT NULL,
    "source_revision_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answerability" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "claims" JSONB NOT NULL DEFAULT '[]',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "reason" TEXT,
    "model_version" TEXT NOT NULL,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_question_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_reply_revisions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "source_revision_id" TEXT,
    "parent_id" TEXT,
    "user_source_text" TEXT NOT NULL,
    "user_source_hash" TEXT NOT NULL,
    "target_text" TEXT NOT NULL,
    "target_hash" TEXT NOT NULL,
    "target_variety" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "critical_findings" JSONB NOT NULL DEFAULT '[]',
    "revision_number" INTEGER NOT NULL DEFAULT 1,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_reply_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_audio_variants" (
    "id" TEXT NOT NULL,
    "source_revision_id" TEXT,
    "translation_revision_id" TEXT,
    "explanation_revision_id" TEXT,
    "reply_revision_id" TEXT,
    "kind" TEXT NOT NULL,
    "text_hash" TEXT NOT NULL,
    "exact_text" TEXT NOT NULL,
    "storage_key" TEXT,
    "audio_hash" TEXT,
    "mime_type" TEXT,
    "duration_ms" INTEGER,
    "voice_id" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "native_review_status" TEXT NOT NULL DEFAULT 'unreviewed',
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_audio_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_reply_approvals" (
    "id" TEXT NOT NULL,
    "reply_revision_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_presentation_hash" TEXT NOT NULL,
    "target_presentation_hash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_reply_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_term_explanations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "source_revision_id" TEXT,
    "selected_span" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'document',
    "definition" TEXT NOT NULL,
    "evidence_block_ids" JSONB NOT NULL DEFAULT '[]',
    "uncertainty" TEXT,
    "model_version" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_term_explanations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "everyday_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "session_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "everyday_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "everyday_events_event_id_key" ON "everyday_events"("event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "everyday_events_session_id_sequence_key" ON "everyday_events"("session_id", "sequence");
CREATE UNIQUE INDEX IF NOT EXISTS "everyday_reply_approvals_reply_revision_id_action_source_presentation_hash_target_presentation_hash_key" ON "everyday_reply_approvals"("reply_revision_id", "action", "source_presentation_hash", "target_presentation_hash");

CREATE INDEX IF NOT EXISTS "everyday_sessions_organization_id_owner_user_id_created_at_idx" ON "everyday_sessions"("organization_id", "owner_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_sessions_organization_id_state_created_at_idx" ON "everyday_sessions"("organization_id", "state", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_document_assets_session_id_created_at_idx" ON "everyday_document_assets"("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_document_assets_organization_id_content_hash_idx" ON "everyday_document_assets"("organization_id", "content_hash");
CREATE INDEX IF NOT EXISTS "everyday_ocr_revisions_document_id_created_at_idx" ON "everyday_ocr_revisions"("document_id", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_source_revisions_document_id_is_active_idx" ON "everyday_source_revisions"("document_id", "is_active");
CREATE INDEX IF NOT EXISTS "everyday_source_revisions_content_hash_idx" ON "everyday_source_revisions"("content_hash");
CREATE INDEX IF NOT EXISTS "everyday_translation_revisions_source_revision_id_target_variety_created_at_idx" ON "everyday_translation_revisions"("source_revision_id", "target_variety", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_explanation_revisions_source_revision_id_created_at_idx" ON "everyday_explanation_revisions"("source_revision_id", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_question_answers_source_revision_id_created_at_idx" ON "everyday_question_answers"("source_revision_id", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_audio_variants_text_hash_kind_idx" ON "everyday_audio_variants"("text_hash", "kind");
CREATE INDEX IF NOT EXISTS "everyday_reply_revisions_session_id_created_at_idx" ON "everyday_reply_revisions"("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_reply_approvals_reply_revision_id_idx" ON "everyday_reply_approvals"("reply_revision_id");
CREATE INDEX IF NOT EXISTS "everyday_term_explanations_session_id_created_at_idx" ON "everyday_term_explanations"("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_events_session_id_idx" ON "everyday_events"("session_id");
CREATE INDEX IF NOT EXISTS "everyday_audit_events_organization_id_created_at_idx" ON "everyday_audit_events"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "everyday_audit_events_session_id_idx" ON "everyday_audit_events"("session_id");

ALTER TABLE "everyday_sessions" ADD CONSTRAINT "everyday_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_document_assets" ADD CONSTRAINT "everyday_document_assets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "everyday_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_ocr_revisions" ADD CONSTRAINT "everyday_ocr_revisions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "everyday_document_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_source_revisions" ADD CONSTRAINT "everyday_source_revisions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "everyday_document_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_translation_revisions" ADD CONSTRAINT "everyday_translation_revisions_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "everyday_source_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_explanation_revisions" ADD CONSTRAINT "everyday_explanation_revisions_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "everyday_source_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_explanation_revisions" ADD CONSTRAINT "everyday_explanation_revisions_translation_revision_id_fkey" FOREIGN KEY ("translation_revision_id") REFERENCES "everyday_translation_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "everyday_question_answers" ADD CONSTRAINT "everyday_question_answers_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "everyday_source_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_reply_revisions" ADD CONSTRAINT "everyday_reply_revisions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "everyday_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_audio_variants" ADD CONSTRAINT "everyday_audio_variants_source_revision_id_fkey" FOREIGN KEY ("source_revision_id") REFERENCES "everyday_source_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_audio_variants" ADD CONSTRAINT "everyday_audio_variants_translation_revision_id_fkey" FOREIGN KEY ("translation_revision_id") REFERENCES "everyday_translation_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_audio_variants" ADD CONSTRAINT "everyday_audio_variants_explanation_revision_id_fkey" FOREIGN KEY ("explanation_revision_id") REFERENCES "everyday_explanation_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_audio_variants" ADD CONSTRAINT "everyday_audio_variants_reply_revision_id_fkey" FOREIGN KEY ("reply_revision_id") REFERENCES "everyday_reply_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_reply_approvals" ADD CONSTRAINT "everyday_reply_approvals_reply_revision_id_fkey" FOREIGN KEY ("reply_revision_id") REFERENCES "everyday_reply_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_term_explanations" ADD CONSTRAINT "everyday_term_explanations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "everyday_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_events" ADD CONSTRAINT "everyday_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "everyday_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "everyday_audit_events" ADD CONSTRAINT "everyday_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
