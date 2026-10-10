-- CreateTable
CREATE TABLE "ai_router_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "optimize" TEXT NOT NULL DEFAULT 'balanced',
    "max_retries" INTEGER NOT NULL DEFAULT 1,
    "prefer_region" TEXT NOT NULL DEFAULT 'af-south-1',
    "allow_fallback" BOOLEAN NOT NULL DEFAULT true,
    "prefer_configured_only" BOOLEAN NOT NULL DEFAULT true,
    "streaming_preferred" BOOLEAN NOT NULL DEFAULT false,
    "prefer_provider" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_router_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_router_decisions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "optimize" TEXT NOT NULL,
    "selected_provider" TEXT NOT NULL,
    "selected_model" TEXT NOT NULL,
    "chain_json" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_router_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_router_policies_organization_id_workspace_id_key" ON "ai_router_policies"("organization_id", "workspace_id");

-- CreateIndex
CREATE INDEX "ai_router_decisions_organization_id_workspace_id_created_at_idx" ON "ai_router_decisions"("organization_id", "workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_router_decisions_workspace_id_feature_idx" ON "ai_router_decisions"("workspace_id", "feature");

-- AddForeignKey
ALTER TABLE "ai_router_policies" ADD CONSTRAINT "ai_router_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_router_policies" ADD CONSTRAINT "ai_router_policies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_router_decisions" ADD CONSTRAINT "ai_router_decisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_router_decisions" ADD CONSTRAINT "ai_router_decisions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
