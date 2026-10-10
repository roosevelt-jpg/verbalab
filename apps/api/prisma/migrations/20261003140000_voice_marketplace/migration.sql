-- Voice Marketplace (VL-177 / Phase 34) — distinct from localization marketplace
CREATE TABLE "voice_listings" (
    "id" TEXT NOT NULL,
    "publisher_org_id" TEXT NOT NULL,
    "publisher_workspace_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'voice',
    "source_type" TEXT NOT NULL,
    "source_voice_id" TEXT NOT NULL,
    "voice_clone_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "language" TEXT,
    "gender" TEXT,
    "license_type" TEXT NOT NULL DEFAULT 'personal',
    "license_notes" TEXT NOT NULL DEFAULT '',
    "rights_attested" BOOLEAN NOT NULL DEFAULT false,
    "celebrity_claim" BOOLEAN NOT NULL DEFAULT false,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "subscription_interval" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "rating_sum" INTEGER NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_listing_installs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "installer_org_id" TEXT NOT NULL,
    "installer_workspace_id" TEXT NOT NULL,
    "license_type" TEXT NOT NULL,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_listing_installs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_listing_reviews" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_listing_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_listing_sales" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_org_id" TEXT NOT NULL,
    "publisher_org_id" TEXT NOT NULL,
    "install_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "application_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_listing_sales_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "voice_listings_status_kind_created_at_idx" ON "voice_listings"("status", "kind", "created_at");
CREATE INDEX "voice_listings_publisher_org_id_idx" ON "voice_listings"("publisher_org_id");
CREATE UNIQUE INDEX "voice_listing_installs_listing_id_installer_workspace_id_key" ON "voice_listing_installs"("listing_id", "installer_workspace_id");
CREATE INDEX "voice_listing_installs_installer_org_id_idx" ON "voice_listing_installs"("installer_org_id");
CREATE UNIQUE INDEX "voice_listing_reviews_listing_id_organization_id_key" ON "voice_listing_reviews"("listing_id", "organization_id");
CREATE INDEX "voice_listing_reviews_listing_id_idx" ON "voice_listing_reviews"("listing_id");
CREATE UNIQUE INDEX "voice_listing_sales_install_id_key" ON "voice_listing_sales"("install_id");
CREATE INDEX "voice_listing_sales_publisher_org_id_created_at_idx" ON "voice_listing_sales"("publisher_org_id", "created_at");
CREATE INDEX "voice_listing_sales_buyer_org_id_idx" ON "voice_listing_sales"("buyer_org_id");

ALTER TABLE "voice_listings" ADD CONSTRAINT "voice_listings_publisher_org_id_fkey" FOREIGN KEY ("publisher_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listings" ADD CONSTRAINT "voice_listings_publisher_workspace_id_fkey" FOREIGN KEY ("publisher_workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_installs" ADD CONSTRAINT "voice_listing_installs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "voice_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_installs" ADD CONSTRAINT "voice_listing_installs_installer_org_id_fkey" FOREIGN KEY ("installer_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_installs" ADD CONSTRAINT "voice_listing_installs_installer_workspace_id_fkey" FOREIGN KEY ("installer_workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_reviews" ADD CONSTRAINT "voice_listing_reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "voice_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_reviews" ADD CONSTRAINT "voice_listing_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_sales" ADD CONSTRAINT "voice_listing_sales_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "voice_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_sales" ADD CONSTRAINT "voice_listing_sales_buyer_org_id_fkey" FOREIGN KEY ("buyer_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_sales" ADD CONSTRAINT "voice_listing_sales_publisher_org_id_fkey" FOREIGN KEY ("publisher_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_listing_sales" ADD CONSTRAINT "voice_listing_sales_install_id_fkey" FOREIGN KEY ("install_id") REFERENCES "voice_listing_installs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
