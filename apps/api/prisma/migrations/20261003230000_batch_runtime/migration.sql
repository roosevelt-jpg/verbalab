-- CreateTable
CREATE TABLE "batch_runs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "priority_weight" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "label" TEXT NOT NULL DEFAULT '',
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "checkpoint_index" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 2,
    "job_id" TEXT,
    "run_at" TIMESTAMP(3),
    "error" TEXT,
    "result" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "batch_runs_organization_id_workspace_id_status_idx" ON "batch_runs"("organization_id", "workspace_id", "status");

-- CreateIndex
CREATE INDEX "batch_runs_workspace_id_kind_priority_weight_idx" ON "batch_runs"("workspace_id", "kind", "priority_weight");

-- AddForeignKey
ALTER TABLE "batch_runs" ADD CONSTRAINT "batch_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_runs" ADD CONSTRAINT "batch_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
