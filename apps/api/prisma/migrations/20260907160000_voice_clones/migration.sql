-- CreateTable
CREATE TABLE "voice_clones" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "consent_attested" BOOLEAN NOT NULL,
    "consent_notes" TEXT NOT NULL,
    "consent_attested_at" TIMESTAMP(3) NOT NULL,
    "consent_attested_by" TEXT,
    "watermark_required" BOOLEAN NOT NULL DEFAULT true,
    "sample_storage_keys" JSONB NOT NULL,
    "sample_count" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL DEFAULT 'elevenlabs',
    "provider_voice_id" TEXT,
    "review_notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "disabled_reason" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_clones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voice_clones_organization_id_workspace_id_status_idx" ON "voice_clones"("organization_id", "workspace_id", "status");

-- AddForeignKey
ALTER TABLE "voice_clones" ADD CONSTRAINT "voice_clones_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_clones" ADD CONSTRAINT "voice_clones_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
