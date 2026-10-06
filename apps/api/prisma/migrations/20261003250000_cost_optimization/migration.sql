-- CreateTable
CREATE TABLE "cost_budgets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "daily_cap_usd" DOUBLE PRECISION NOT NULL,
    "monthly_cap_usd" DOUBLE PRECISION NOT NULL,
    "enforce" BOOLEAN NOT NULL DEFAULT true,
    "prefer_spot" BOOLEAN NOT NULL DEFAULT true,
    "reserved_capacity_units" INTEGER NOT NULL DEFAULT 0,
    "optimize_routing" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_spend_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount_usd" DOUBLE PRECISION NOT NULL,
    "feature" TEXT NOT NULL DEFAULT '',
    "provider_id" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_spend_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cost_budgets_organization_id_workspace_id_key" ON "cost_budgets"("organization_id", "workspace_id");

-- CreateIndex
CREATE INDEX "cost_spend_events_organization_id_workspace_id_created_at_idx" ON "cost_spend_events"("organization_id", "workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "cost_spend_events_workspace_id_category_idx" ON "cost_spend_events"("workspace_id", "category");

-- AddForeignKey
ALTER TABLE "cost_budgets" ADD CONSTRAINT "cost_budgets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_budgets" ADD CONSTRAINT "cost_budgets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_spend_events" ADD CONSTRAINT "cost_spend_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_spend_events" ADD CONSTRAINT "cost_spend_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
