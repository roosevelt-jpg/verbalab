-- Ensure clone provider default is Lugemi vendor_clone.
ALTER TABLE "voice_clones" ALTER COLUMN "provider" SET DEFAULT 'vendor_clone';
