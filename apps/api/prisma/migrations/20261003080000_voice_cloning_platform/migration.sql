-- AlterTable: Voice Cloning Platform governance fields (VL-172)
ALTER TABLE "voice_clones" ADD COLUMN "clone_mode" TEXT NOT NULL DEFAULT 'instant';
ALTER TABLE "voice_clones" ADD COLUMN "ownership_attested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "voice_clones" ADD COLUMN "ownership_notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "voice_clones" ADD COLUMN "owner_user_id" TEXT;
ALTER TABLE "voice_clones" ADD COLUMN "license_type" TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE "voice_clones" ADD COLUMN "license_notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "voice_clones" ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '{"canSynthesize":true,"canShare":false,"canExport":false,"allowedRoles":["owner","admin"]}';
ALTER TABLE "voice_clones" ADD COLUMN "enrollment_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "voice_clones" ADD COLUMN "enrollment_verified_at" TIMESTAMP(3);
ALTER TABLE "voice_clones" ADD COLUMN "enrollment_verify_notes" TEXT;

CREATE INDEX "voice_clones_organization_id_workspace_id_clone_mode_idx" ON "voice_clones"("organization_id", "workspace_id", "clone_mode");
