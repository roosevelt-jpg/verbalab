-- CreateTable
CREATE TABLE "streaming_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "transport" TEXT NOT NULL DEFAULT 'sse',
    "status" TEXT NOT NULL DEFAULT 'open',
    "label" TEXT NOT NULL DEFAULT '',
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaming_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "streaming_sessions_organization_id_workspace_id_status_idx" ON "streaming_sessions"("organization_id", "workspace_id", "status");

-- CreateIndex
CREATE INDEX "streaming_sessions_workspace_id_kind_idx" ON "streaming_sessions"("workspace_id", "kind");

-- AddForeignKey
ALTER TABLE "streaming_sessions" ADD CONSTRAINT "streaming_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaming_sessions" ADD CONSTRAINT "streaming_sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
