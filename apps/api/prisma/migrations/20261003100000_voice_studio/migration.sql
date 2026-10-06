-- Voice Studio (VL-174 / Phase 31)
CREATE TABLE "voice_studio_projects" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_studio_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_studio_lexemes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "grapheme" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "language" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_studio_lexemes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_studio_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "language" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_studio_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "voice_studio_projects_organization_id_workspace_id_idx" ON "voice_studio_projects"("organization_id", "workspace_id");
CREATE INDEX "voice_studio_lexemes_organization_id_workspace_id_idx" ON "voice_studio_lexemes"("organization_id", "workspace_id");
CREATE UNIQUE INDEX "voice_studio_lexemes_workspace_id_grapheme_key" ON "voice_studio_lexemes"("workspace_id", "grapheme");
CREATE INDEX "voice_studio_profiles_organization_id_workspace_id_idx" ON "voice_studio_profiles"("organization_id", "workspace_id");

ALTER TABLE "voice_studio_projects" ADD CONSTRAINT "voice_studio_projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_studio_projects" ADD CONSTRAINT "voice_studio_projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_studio_lexemes" ADD CONSTRAINT "voice_studio_lexemes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_studio_lexemes" ADD CONSTRAINT "voice_studio_lexemes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_studio_profiles" ADD CONSTRAINT "voice_studio_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_studio_profiles" ADD CONSTRAINT "voice_studio_profiles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
