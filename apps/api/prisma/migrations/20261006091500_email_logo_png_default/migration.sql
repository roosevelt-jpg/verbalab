-- Point email branding default logo at the PNG wordmark (email-client friendly).
ALTER TABLE "platform_branding" ALTER COLUMN "logo_url" SET DEFAULT '/brand/lugemi-email-logo.png';

UPDATE "platform_branding"
SET "logo_url" = '/brand/lugemi-email-logo.png'
WHERE "logo_url" = '/brand/lugemi-symbol-teal.svg' OR "logo_url" = '';
