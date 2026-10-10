-- Organization invites for RBAC team sharing
CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invited_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_invites_token_key" ON "organization_invites"("token");
CREATE INDEX "organization_invites_organization_id_status_idx" ON "organization_invites"("organization_id", "status");
CREATE INDEX "organization_invites_email_status_idx" ON "organization_invites"("email", "status");

ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Platform branding for system email templates
CREATE TABLE "platform_branding" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "company_name" TEXT NOT NULL DEFAULT 'Lugemi',
    "logo_url" TEXT NOT NULL DEFAULT '/brand/lugemi-email-logo.png',
    "address_line1" TEXT NOT NULL DEFAULT '',
    "address_line2" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "postal_code" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "social_x" TEXT NOT NULL DEFAULT '',
    "social_linkedin" TEXT NOT NULL DEFAULT '',
    "social_github" TEXT NOT NULL DEFAULT '',
    "social_website" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_branding_pkey" PRIMARY KEY ("id")
);

INSERT INTO "platform_branding" ("id", "company_name", "logo_url", "updated_at")
VALUES ('default', 'Lugemi', '/brand/lugemi-email-logo.png', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
