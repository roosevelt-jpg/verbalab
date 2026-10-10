-- VL-081 admin suspend org
ALTER TABLE "organizations" ADD COLUMN "disabled_at" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN "disabled_reason" TEXT;
