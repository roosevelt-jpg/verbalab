-- AlterTable
ALTER TABLE "model_registry" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'finetune';
ALTER TABLE "model_registry" ADD COLUMN "provider" TEXT;
ALTER TABLE "model_registry" ADD COLUMN "external_url" TEXT;
ALTER TABLE "model_registry" ADD COLUMN "notes" TEXT;

ALTER TABLE "model_registry" ALTER COLUMN "source_lang" DROP NOT NULL;
ALTER TABLE "model_registry" ALTER COLUMN "target_lang" DROP NOT NULL;
ALTER TABLE "model_registry" ALTER COLUMN "artifact_kind" DROP NOT NULL;
ALTER TABLE "model_registry" ALTER COLUMN "artifact_uri" DROP NOT NULL;

UPDATE "model_registry" SET "provider" = 'finetune', "kind" = 'finetune' WHERE "provider" IS NULL;

CREATE INDEX "model_registry_feature_status_idx" ON "model_registry"("feature", "status");
