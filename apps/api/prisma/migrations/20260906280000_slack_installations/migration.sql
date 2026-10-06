-- VL-082 Slack connector installations
CREATE TABLE "slack_installations" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "team_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "default_target_lang" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slack_installations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "slack_installations_team_id_key" ON "slack_installations"("team_id");
CREATE INDEX "slack_installations_organization_id_idx" ON "slack_installations"("organization_id");

ALTER TABLE "slack_installations" ADD CONSTRAINT "slack_installations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "slack_installations" ADD CONSTRAINT "slack_installations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
