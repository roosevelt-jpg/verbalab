-- Lugemi Relay: interpreter profiles, slots, requests, offers, quotes, bookings,
-- context grants, sessions, usage, payments, disputes, feedback, events, audit

CREATE TABLE IF NOT EXISTS "relay_interpreter_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "supply_kind" TEXT NOT NULL DEFAULT 'reviewed_human',
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "identity_verification" TEXT NOT NULL DEFAULT 'unverified',
    "language_pairs" JSONB NOT NULL,
    "domains" JSONB NOT NULL,
    "directionality" TEXT NOT NULL DEFAULT 'bidirectional',
    "qualifications" JSONB NOT NULL DEFAULT '[]',
    "reviewer_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Accra',
    "confidentiality_accepted" BOOLEAN NOT NULL DEFAULT false,
    "service_limits" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "relay_interpreter_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_availability_slots" (
    "id" TEXT NOT NULL,
    "interpreter_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "display_timezone" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'open',
    "hold_expires_at" TIMESTAMP(3),
    "held_by_request_id" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "relay_availability_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "requester_user_id" TEXT NOT NULL,
    "corridor_id" TEXT NOT NULL,
    "source_language" TEXT NOT NULL,
    "target_language" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general_business',
    "preferred_start_at" TIMESTAMP(3) NOT NULL,
    "preferred_timezone" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "origin_product" TEXT,
    "origin_refs" JSONB,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "unmatched_reason" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "relay_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_offers" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "interpreter_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_quote_snapshots" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "amount_minor" INTEGER NOT NULL,
    "minimum_minutes" INTEGER NOT NULL,
    "billing_increment_min" INTEGER NOT NULL DEFAULT 15,
    "included_minutes" INTEGER NOT NULL,
    "overrun_ceiling_minor" INTEGER,
    "taxes_fees_minor" INTEGER NOT NULL DEFAULT 0,
    "cancellation_terms" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_quote_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_bookings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "interpreter_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "requester_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting_payment',
    "payment_mode" TEXT NOT NULL DEFAULT 'manual_invoice',
    "payment_state" TEXT NOT NULL DEFAULT 'unpaid',
    "reserved_start_at" TIMESTAMP(3) NOT NULL,
    "reserved_end_at" TIMESTAMP(3) NOT NULL,
    "cancellation_terms" TEXT NOT NULL,
    "extension_approved_minutes" INTEGER NOT NULL DEFAULT 0,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "cancelled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "relay_bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_context_grants" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "origin_product" TEXT,
    "scope_note" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_context_grants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_sessions" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'lobby',
    "media_mode" TEXT NOT NULL DEFAULT 'browser_audio',
    "recording_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "participants" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "relay_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_usage_ledgers" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "connected_seconds" INTEGER NOT NULL,
    "billable_seconds" INTEGER NOT NULL,
    "rate_snapshot_hash" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_usage_ledgers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_payment_records" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "provider_ref" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_payment_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_disputes" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "opened_by_id" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_staff_id" TEXT,
    "outcome" TEXT,
    "outcome_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "relay_disputes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_feedback" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_correction_records" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "grant_id" TEXT,
    "author_id" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "source_evidence_note" TEXT,
    "review_status" TEXT NOT NULL DEFAULT 'pending_review',
    "training_rights_granted" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_correction_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_events" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "relay_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "request_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "relay_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "relay_interpreter_profiles_organization_id_owner_user_id_key" ON "relay_interpreter_profiles"("organization_id", "owner_user_id");
CREATE INDEX IF NOT EXISTS "relay_interpreter_profiles_organization_id_status_idx" ON "relay_interpreter_profiles"("organization_id", "status");
CREATE INDEX IF NOT EXISTS "relay_availability_slots_interpreter_id_start_at_end_at_idx" ON "relay_availability_slots"("interpreter_id", "start_at", "end_at");
CREATE INDEX IF NOT EXISTS "relay_availability_slots_state_start_at_idx" ON "relay_availability_slots"("state", "start_at");
CREATE UNIQUE INDEX IF NOT EXISTS "relay_requests_organization_id_idempotency_key_key" ON "relay_requests"("organization_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "relay_requests_organization_id_requester_user_id_created_at_idx" ON "relay_requests"("organization_id", "requester_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "relay_requests_organization_id_status_created_at_idx" ON "relay_requests"("organization_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "relay_offers_request_id_state_idx" ON "relay_offers"("request_id", "state");
CREATE INDEX IF NOT EXISTS "relay_offers_interpreter_id_state_idx" ON "relay_offers"("interpreter_id", "state");
CREATE INDEX IF NOT EXISTS "relay_offers_expires_at_idx" ON "relay_offers"("expires_at");
CREATE INDEX IF NOT EXISTS "relay_quote_snapshots_request_id_created_at_idx" ON "relay_quote_snapshots"("request_id", "created_at");
CREATE INDEX IF NOT EXISTS "relay_bookings_organization_id_requester_user_id_created_at_idx" ON "relay_bookings"("organization_id", "requester_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "relay_bookings_organization_id_status_reserved_start_at_idx" ON "relay_bookings"("organization_id", "status", "reserved_start_at");
CREATE INDEX IF NOT EXISTS "relay_bookings_interpreter_id_reserved_start_at_idx" ON "relay_bookings"("interpreter_id", "reserved_start_at");
CREATE INDEX IF NOT EXISTS "relay_context_grants_booking_id_created_at_idx" ON "relay_context_grants"("booking_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "relay_sessions_room_id_key" ON "relay_sessions"("room_id");
CREATE INDEX IF NOT EXISTS "relay_sessions_booking_id_idx" ON "relay_sessions"("booking_id");
CREATE INDEX IF NOT EXISTS "relay_usage_ledgers_booking_id_idx" ON "relay_usage_ledgers"("booking_id");
CREATE UNIQUE INDEX IF NOT EXISTS "relay_payment_records_booking_id_idempotency_key_key" ON "relay_payment_records"("booking_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "relay_payment_records_booking_id_created_at_idx" ON "relay_payment_records"("booking_id", "created_at");
CREATE INDEX IF NOT EXISTS "relay_disputes_booking_id_status_idx" ON "relay_disputes"("booking_id", "status");
CREATE INDEX IF NOT EXISTS "relay_feedback_booking_id_idx" ON "relay_feedback"("booking_id");
CREATE INDEX IF NOT EXISTS "relay_correction_records_booking_id_created_at_idx" ON "relay_correction_records"("booking_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "relay_events_event_id_key" ON "relay_events"("event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "relay_events_request_id_sequence_key" ON "relay_events"("request_id", "sequence");
CREATE INDEX IF NOT EXISTS "relay_events_request_id_idx" ON "relay_events"("request_id");
CREATE INDEX IF NOT EXISTS "relay_audit_events_organization_id_created_at_idx" ON "relay_audit_events"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "relay_audit_events_booking_id_idx" ON "relay_audit_events"("booking_id");

DO $$ BEGIN
  ALTER TABLE "relay_interpreter_profiles" ADD CONSTRAINT "relay_interpreter_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_availability_slots" ADD CONSTRAINT "relay_availability_slots_interpreter_id_fkey" FOREIGN KEY ("interpreter_id") REFERENCES "relay_interpreter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_requests" ADD CONSTRAINT "relay_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_offers" ADD CONSTRAINT "relay_offers_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "relay_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_offers" ADD CONSTRAINT "relay_offers_interpreter_id_fkey" FOREIGN KEY ("interpreter_id") REFERENCES "relay_interpreter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_offers" ADD CONSTRAINT "relay_offers_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "relay_availability_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_quote_snapshots" ADD CONSTRAINT "relay_quote_snapshots_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "relay_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_quote_snapshots" ADD CONSTRAINT "relay_quote_snapshots_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "relay_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_bookings" ADD CONSTRAINT "relay_bookings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_bookings" ADD CONSTRAINT "relay_bookings_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "relay_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_bookings" ADD CONSTRAINT "relay_bookings_interpreter_id_fkey" FOREIGN KEY ("interpreter_id") REFERENCES "relay_interpreter_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_bookings" ADD CONSTRAINT "relay_bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "relay_availability_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_bookings" ADD CONSTRAINT "relay_bookings_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "relay_quote_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_context_grants" ADD CONSTRAINT "relay_context_grants_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "relay_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_sessions" ADD CONSTRAINT "relay_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "relay_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_usage_ledgers" ADD CONSTRAINT "relay_usage_ledgers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "relay_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_payment_records" ADD CONSTRAINT "relay_payment_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "relay_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_disputes" ADD CONSTRAINT "relay_disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "relay_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_feedback" ADD CONSTRAINT "relay_feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "relay_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_correction_records" ADD CONSTRAINT "relay_correction_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "relay_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_events" ADD CONSTRAINT "relay_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "relay_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "relay_audit_events" ADD CONSTRAINT "relay_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
