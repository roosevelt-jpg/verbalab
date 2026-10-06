-- CreateTable
CREATE TABLE "model_registry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "feature" TEXT NOT NULL DEFAULT 'translate',
    "source_lang" TEXT NOT NULL,
    "target_lang" TEXT NOT NULL,
    "base_model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "artifact_kind" TEXT NOT NULL,
    "artifact_uri" TEXT NOT NULL,
    "metrics_json" JSONB,
    "fine_tune_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fine_tune_jobs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "source_lang" TEXT NOT NULL,
    "target_lang" TEXT NOT NULL,
    "base_model" TEXT NOT NULL DEFAULT 'nllb-200-distilled-600M',
    "launcher" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "training_pack_path" TEXT,
    "external_job_id" TEXT,
    "error_message" TEXT,
    "artifact_kind" TEXT,
    "artifact_uri" TEXT,
    "metrics_json" JSONB,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fine_tune_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "model_registry_slug_key" ON "model_registry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "model_registry_fine_tune_job_id_key" ON "model_registry"("fine_tune_job_id");

-- CreateIndex
CREATE INDEX "model_registry_feature_source_lang_target_lang_status_idx" ON "model_registry"("feature", "source_lang", "target_lang", "status");

-- CreateIndex
CREATE INDEX "fine_tune_jobs_organization_id_status_idx" ON "fine_tune_jobs"("organization_id", "status");

-- CreateIndex
CREATE INDEX "fine_tune_jobs_source_lang_target_lang_idx" ON "fine_tune_jobs"("source_lang", "target_lang");

-- AddForeignKey
ALTER TABLE "fine_tune_jobs" ADD CONSTRAINT "fine_tune_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_registry" ADD CONSTRAINT "model_registry_fine_tune_job_id_fkey" FOREIGN KEY ("fine_tune_job_id") REFERENCES "fine_tune_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
