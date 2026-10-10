-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "feature_overrides" JSONB;

CREATE INDEX IF NOT EXISTS "organizations_plan_idx" ON "organizations"("plan");
CREATE INDEX IF NOT EXISTS "organizations_billing_status_idx" ON "organizations"("billing_status");
CREATE INDEX IF NOT EXISTS "organizations_data_region_idx" ON "organizations"("data_region");
CREATE INDEX IF NOT EXISTS "organizations_disabled_at_idx" ON "organizations"("disabled_at");

CREATE TABLE IF NOT EXISTS "admin_audit_events" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "target_organization_id" TEXT,
    "route" TEXT,
    "ip" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_audit_events_created_at_idx" ON "admin_audit_events"("created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_events_target_organization_id_created_at_idx" ON "admin_audit_events"("target_organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_events_actor_user_id_created_at_idx" ON "admin_audit_events"("actor_user_id", "created_at");
