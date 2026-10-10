-- CreateTable
CREATE TABLE "cache_entries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "cache_key" TEXT NOT NULL,
    "value_json" JSONB NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "misses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cache_entries_organization_id_workspace_id_namespace_idx" ON "cache_entries"("organization_id", "workspace_id", "namespace");

-- CreateIndex
CREATE INDEX "cache_entries_expires_at_idx" ON "cache_entries"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "cache_entries_organization_id_workspace_id_namespace_cache_key_key" ON "cache_entries"("organization_id", "workspace_id", "namespace", "cache_key");

-- AddForeignKey
ALTER TABLE "cache_entries" ADD CONSTRAINT "cache_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cache_entries" ADD CONSTRAINT "cache_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
