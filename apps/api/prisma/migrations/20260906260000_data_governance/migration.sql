-- VL-073 data governance settings on organizations
ALTER TABLE "organizations" ADD COLUMN "retention_days" INTEGER;
ALTER TABLE "organizations" ADD COLUMN "persist_source_text" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "organizations" ADD COLUMN "allow_vendor_training" BOOLEAN NOT NULL DEFAULT false;
