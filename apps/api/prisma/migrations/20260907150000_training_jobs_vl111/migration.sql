-- AlterTable
ALTER TABLE "fine_tune_jobs" ADD COLUMN "dataset_asset_id" TEXT;
ALTER TABLE "fine_tune_jobs" ADD COLUMN "callback_token" TEXT;
ALTER TABLE "fine_tune_jobs" ADD COLUMN "provider_meta" JSONB;
ALTER TABLE "fine_tune_jobs" ADD COLUMN "started_at" TIMESTAMP(3);
ALTER TABLE "fine_tune_jobs" ADD COLUMN "finished_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "fine_tune_jobs_callback_token_idx" ON "fine_tune_jobs"("callback_token");

-- AddForeignKey
ALTER TABLE "fine_tune_jobs" ADD CONSTRAINT "fine_tune_jobs_dataset_asset_id_fkey" FOREIGN KEY ("dataset_asset_id") REFERENCES "dataset_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
