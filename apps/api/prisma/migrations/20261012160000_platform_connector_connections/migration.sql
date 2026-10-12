-- CreateTable
CREATE TABLE "platform_connector_connections" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "credentials_enc" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "auth_provider" TEXT NOT NULL,
    "verify_note" TEXT,
    "verified_at" TIMESTAMP(3) NOT NULL,
    "last_verified_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_connector_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_connector_connections_organization_id_connector_id_idx" ON "platform_connector_connections"("organization_id", "connector_id");

-- CreateIndex
CREATE INDEX "platform_connector_connections_status_idx" ON "platform_connector_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_connector_connections_workspace_id_connector_id_key" ON "platform_connector_connections"("workspace_id", "connector_id");

-- AddForeignKey
ALTER TABLE "platform_connector_connections" ADD CONSTRAINT "platform_connector_connections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_connector_connections" ADD CONSTRAINT "platform_connector_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
