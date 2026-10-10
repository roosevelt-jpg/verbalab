-- CreateTable
CREATE TABLE "dataset_assets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "license_tag" TEXT NOT NULL,
    "consent_notes" TEXT NOT NULL,
    "contains_pii" BOOLEAN NOT NULL DEFAULT false,
    "source_lang" TEXT,
    "target_lang" TEXT,
    "partner_org_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dataset_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_versions" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum_sha256" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dataset_assets_organization_id_created_at_idx" ON "dataset_assets"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "dataset_assets_workspace_id_status_idx" ON "dataset_assets"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "dataset_versions_asset_id_version_idx" ON "dataset_versions"("asset_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "dataset_versions_asset_id_version_key" ON "dataset_versions"("asset_id", "version");

-- AddForeignKey
ALTER TABLE "dataset_assets" ADD CONSTRAINT "dataset_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_assets" ADD CONSTRAINT "dataset_assets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_versions" ADD CONSTRAINT "dataset_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "dataset_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
