-- CreateTable
CREATE TABLE "vertical_glossary_installs" (
    "id" TEXT NOT NULL,
    "pack_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "terms_installed" INTEGER NOT NULL DEFAULT 0,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vertical_glossary_installs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vertical_glossary_installs_organization_id_idx" ON "vertical_glossary_installs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "vertical_glossary_installs_pack_id_workspace_id_key" ON "vertical_glossary_installs"("pack_id", "workspace_id");

-- AddForeignKey
ALTER TABLE "vertical_glossary_installs" ADD CONSTRAINT "vertical_glossary_installs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vertical_glossary_installs" ADD CONSTRAINT "vertical_glossary_installs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
