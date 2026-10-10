-- AccessLine: native-language telephone logistics MVP

CREATE TABLE IF NOT EXISTS "accessline_business_lines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inbound_number" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'KE',
    "time_zone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "enabled_languages" JSONB NOT NULL DEFAULT '["sw-KE","en"]',
    "greeting_notice_version" TEXT NOT NULL DEFAULT 'al-notice-v1',
    "recording_enabled" BOOLEAN NOT NULL DEFAULT false,
    "transfer_destinations" JSONB NOT NULL DEFAULT '[]',
    "registered_contacts" JSONB NOT NULL DEFAULT '[]',
    "opening_hours" JSONB NOT NULL DEFAULT '{}',
    "knowledge_snippet" TEXT NOT NULL DEFAULT '',
    "feature_flag" TEXT NOT NULL DEFAULT 'accessLine',
    "max_concurrent_calls" INTEGER NOT NULL DEFAULT 5,
    "max_call_duration_sec" INTEGER NOT NULL DEFAULT 900,
    "delivery_freshness_minutes" INTEGER NOT NULL DEFAULT 30,
    "integration_mode" TEXT NOT NULL DEFAULT 'simulated',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_business_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accessline_business_lines_organization_id_inbound_number_key"
  ON "accessline_business_lines"("organization_id", "inbound_number");
CREATE INDEX IF NOT EXISTS "accessline_business_lines_workspace_id_idx" ON "accessline_business_lines"("workspace_id");
CREATE INDEX IF NOT EXISTS "accessline_business_lines_inbound_number_idx" ON "accessline_business_lines"("inbound_number");

CREATE TABLE IF NOT EXISTS "accessline_call_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "line_id" TEXT NOT NULL,
    "provider_call_id" TEXT,
    "state" TEXT NOT NULL DEFAULT 'ringing',
    "selected_variety" TEXT,
    "active_turn_generation" INTEGER NOT NULL DEFAULT 0,
    "auth_state" TEXT NOT NULL DEFAULT 'none',
    "customer_scope" TEXT,
    "order_reference" TEXT,
    "last_delivery_status" TEXT,
    "last_delivery_freshness" TEXT,
    "policy_version" TEXT NOT NULL DEFAULT 'accessline-policy-v1',
    "model_versions" JSONB NOT NULL DEFAULT '{}',
    "is_simulator" BOOLEAN NOT NULL DEFAULT true,
    "caller_id_masked" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_call_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accessline_call_sessions_provider_call_id_key" ON "accessline_call_sessions"("provider_call_id");
CREATE INDEX IF NOT EXISTS "accessline_call_sessions_organization_id_started_at_idx" ON "accessline_call_sessions"("organization_id", "started_at");
CREATE INDEX IF NOT EXISTS "accessline_call_sessions_workspace_id_state_idx" ON "accessline_call_sessions"("workspace_id", "state");
CREATE INDEX IF NOT EXISTS "accessline_call_sessions_line_id_state_idx" ON "accessline_call_sessions"("line_id", "state");

CREATE TABLE IF NOT EXISTS "accessline_call_turns" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "transcript" TEXT NOT NULL DEFAULT '',
    "language" TEXT,
    "stage" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "generation" INTEGER NOT NULL DEFAULT 0,
    "dtmf_digits_masked" TEXT,
    "audio_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_call_turns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accessline_call_turns_call_id_sequence_key" ON "accessline_call_turns"("call_id", "sequence");
CREATE INDEX IF NOT EXISTS "accessline_call_turns_call_id_generation_idx" ON "accessline_call_turns"("call_id", "generation");

CREATE TABLE IF NOT EXISTS "accessline_auth_attempts" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'registered_otp_dtmf',
    "secret_hash" TEXT,
    "customer_scope" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_auth_attempts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "accessline_auth_attempts_call_id_idx" ON "accessline_auth_attempts"("call_id");

CREATE TABLE IF NOT EXISTS "accessline_tool_invocations" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "turn_id" TEXT,
    "tool" TEXT NOT NULL,
    "authorized_scope" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "result_state" TEXT NOT NULL,
    "freshness" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL,
    "result_summary" JSONB NOT NULL DEFAULT '{}',
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_tool_invocations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "accessline_tool_invocations_call_id_idempotency_key_key"
  ON "accessline_tool_invocations"("call_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "accessline_tool_invocations_call_id_tool_idx" ON "accessline_tool_invocations"("call_id", "tool");

CREATE TABLE IF NOT EXISTS "accessline_confirmations" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "turn_id" TEXT,
    "field" TEXT NOT NULL,
    "value_repr" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_confirmations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "accessline_confirmations_call_id_idx" ON "accessline_confirmations"("call_id");

CREATE TABLE IF NOT EXISTS "accessline_handoffs" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "auth_level" TEXT NOT NULL,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "idempotency_key" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_handoffs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "accessline_handoffs_idempotency_key_key" ON "accessline_handoffs"("idempotency_key");
CREATE INDEX IF NOT EXISTS "accessline_handoffs_call_id_idx" ON "accessline_handoffs"("call_id");

CREATE TABLE IF NOT EXISTS "accessline_support_cases" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "case_reference" TEXT NOT NULL,
    "customer_scope" TEXT,
    "language" TEXT,
    "summary" TEXT NOT NULL,
    "permission_state" TEXT NOT NULL DEFAULT 'requires_reauth',
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_support_cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "accessline_support_cases_idempotency_key_key" ON "accessline_support_cases"("idempotency_key");
CREATE INDEX IF NOT EXISTS "accessline_support_cases_organization_id_case_reference_idx"
  ON "accessline_support_cases"("organization_id", "case_reference");
CREATE INDEX IF NOT EXISTS "accessline_support_cases_call_id_idx" ON "accessline_support_cases"("call_id");

CREATE TABLE IF NOT EXISTS "accessline_consent_events" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "notice_version" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_consent_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "accessline_consent_events_call_id_idx" ON "accessline_consent_events"("call_id");

CREATE TABLE IF NOT EXISTS "accessline_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "call_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "policy_revision" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "accessline_audit_events_organization_id_created_at_idx"
  ON "accessline_audit_events"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "accessline_audit_events_call_id_idx" ON "accessline_audit_events"("call_id");

CREATE TABLE IF NOT EXISTS "accessline_provider_events" (
    "id" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "call_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessline_provider_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "accessline_provider_events_provider_event_id_key"
  ON "accessline_provider_events"("provider_event_id");
CREATE INDEX IF NOT EXISTS "accessline_provider_events_call_id_idx" ON "accessline_provider_events"("call_id");

ALTER TABLE "accessline_business_lines"
  ADD CONSTRAINT "accessline_business_lines_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "accessline_call_sessions"
  ADD CONSTRAINT "accessline_call_sessions_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessline_call_sessions"
  ADD CONSTRAINT "accessline_call_sessions_line_id_fkey"
  FOREIGN KEY ("line_id") REFERENCES "accessline_business_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "accessline_call_turns"
  ADD CONSTRAINT "accessline_call_turns_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "accessline_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessline_auth_attempts"
  ADD CONSTRAINT "accessline_auth_attempts_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "accessline_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessline_tool_invocations"
  ADD CONSTRAINT "accessline_tool_invocations_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "accessline_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessline_confirmations"
  ADD CONSTRAINT "accessline_confirmations_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "accessline_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessline_handoffs"
  ADD CONSTRAINT "accessline_handoffs_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "accessline_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessline_support_cases"
  ADD CONSTRAINT "accessline_support_cases_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "accessline_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessline_consent_events"
  ADD CONSTRAINT "accessline_consent_events_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "accessline_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessline_audit_events"
  ADD CONSTRAINT "accessline_audit_events_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
