-- CreateTable
CREATE TABLE "model_serving_deployments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "model_slug" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "strategy" TEXT NOT NULL DEFAULT 'rolling',
    "traffic_percent" INTEGER NOT NULL DEFAULT 100,
    "slot" TEXT NOT NULL DEFAULT 'none',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "label" TEXT NOT NULL DEFAULT '',
    "previous_version" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_serving_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "model_serving_deployments_organization_id_workspace_id_status_idx" ON "model_serving_deployments"("organization_id", "workspace_id", "status");

-- CreateIndex
CREATE INDEX "model_serving_deployments_workspace_id_kind_model_slug_idx" ON "model_serving_deployments"("workspace_id", "kind", "model_slug");

-- AddForeignKey
ALTER TABLE "model_serving_deployments" ADD CONSTRAINT "model_serving_deployments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_serving_deployments" ADD CONSTRAINT "model_serving_deployments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
