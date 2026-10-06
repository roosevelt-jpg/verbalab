-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "publisher_org_id" TEXT NOT NULL,
    "publisher_workspace_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'glossary',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "snapshot" JSONB NOT NULL,
    "term_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_installs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "installer_org_id" TEXT NOT NULL,
    "installer_workspace_id" TEXT NOT NULL,
    "terms_installed" INTEGER NOT NULL DEFAULT 0,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_installs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_listings_status_created_at_idx" ON "marketplace_listings"("status", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_listings_publisher_org_id_idx" ON "marketplace_listings"("publisher_org_id");

-- CreateIndex
CREATE INDEX "marketplace_installs_installer_org_id_idx" ON "marketplace_installs"("installer_org_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_installs_listing_id_installer_workspace_id_key" ON "marketplace_installs"("listing_id", "installer_workspace_id");

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_publisher_org_id_fkey" FOREIGN KEY ("publisher_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_publisher_workspace_id_fkey" FOREIGN KEY ("publisher_workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_installer_org_id_fkey" FOREIGN KEY ("installer_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_installer_workspace_id_fkey" FOREIGN KEY ("installer_workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
