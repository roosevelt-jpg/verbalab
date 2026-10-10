-- Person / org identity residency (registration origin).
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "residency_country" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "residency_region" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "registered_from" TEXT;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "residency_country" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "residency_region" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "registered_from" TEXT;

CREATE INDEX IF NOT EXISTS "organizations_residency_country_idx" ON "organizations"("residency_country");
CREATE INDEX IF NOT EXISTS "users_residency_country_idx" ON "users"("residency_country");

-- Model / LLM hosting residency (data-center host).
ALTER TABLE "model_registry" ADD COLUMN IF NOT EXISTS "hosted_residency" TEXT;
ALTER TABLE "model_registry" ADD COLUMN IF NOT EXISTS "data_center" TEXT;
ALTER TABLE "model_registry" ADD COLUMN IF NOT EXISTS "hosted_region" TEXT;

CREATE INDEX IF NOT EXISTS "model_registry_hosted_region_idx" ON "model_registry"("hosted_region");
CREATE INDEX IF NOT EXISTS "model_registry_data_center_idx" ON "model_registry"("data_center");
