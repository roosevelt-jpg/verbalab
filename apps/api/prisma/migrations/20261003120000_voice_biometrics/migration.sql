-- Voice Biometrics governance fields (VL-176 / Phase 33)
ALTER TABLE "speaker_profiles" ADD COLUMN "fingerprint_encrypted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "speaker_profiles" ADD COLUMN "auth_factor_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "speaker_profiles" ADD COLUMN "deleted_at" TIMESTAMP(3);
