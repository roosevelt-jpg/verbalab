-- CreateTable
CREATE TABLE "gpu_allocations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "instances" INTEGER NOT NULL DEFAULT 1,
    "estimated_hourly_usd" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "purpose" TEXT NOT NULL DEFAULT '',
    "reservation_until" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gpu_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gpu_allocations_organization_id_workspace_id_status_idx" ON "gpu_allocations"("organization_id", "workspace_id", "status");

-- CreateIndex
CREATE INDEX "gpu_allocations_workspace_id_vendor_idx" ON "gpu_allocations"("workspace_id", "vendor");

-- AddForeignKey
ALTER TABLE "gpu_allocations" ADD CONSTRAINT "gpu_allocations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpu_allocations" ADD CONSTRAINT "gpu_allocations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
