-- CreateTable
CREATE TABLE "language_passports" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'active',
    "personalization_enabled" BOOLEAN NOT NULL DEFAULT true,
    "preferences_revision" INTEGER NOT NULL DEFAULT 1,
    "preferred_varieties" JSONB NOT NULL DEFAULT '[]',
    "preferred_voice_ids" JSONB NOT NULL DEFAULT '[]',
    "retention_days" INTEGER NOT NULL DEFAULT 365,
    "training_consent" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_passport_entries" (
    "id" TEXT NOT NULL,
    "passport_id" TEXT NOT NULL,
    "entry_key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting_user_approval',
    "current_revision" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_passport_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_passport_entry_revisions" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "source_form" TEXT NOT NULL,
    "language_variety" TEXT NOT NULL,
    "source_lang" TEXT,
    "target_lang" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'bidirectional',
    "approved_value" JSONB NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "examples" JSONB NOT NULL DEFAULT '[]',
    "provenance" JSONB NOT NULL DEFAULT '{}',
    "training_permission" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_passport_entry_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_passport_snapshots" (
    "id" TEXT NOT NULL,
    "passport_id" TEXT NOT NULL,
    "resolver_version" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "entry_revisions" JSONB NOT NULL,
    "preferences_revision" INTEGER NOT NULL,
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_passport_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_passport_share_grants" (
    "id" TEXT NOT NULL,
    "passport_id" TEXT NOT NULL,
    "grantee_user_id" TEXT,
    "grantee_resource" TEXT,
    "purpose" TEXT NOT NULL,
    "permitted_products" JSONB NOT NULL,
    "entry_ids" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_passport_share_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_passport_resolutions" (
    "id" TEXT NOT NULL,
    "passport_id" TEXT NOT NULL,
    "snapshot_id" TEXT,
    "product" TEXT NOT NULL,
    "request_key" TEXT NOT NULL,
    "matched" JSONB NOT NULL DEFAULT '[]',
    "conflicts" JSONB NOT NULL DEFAULT '[]',
    "outcome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_passport_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_passport_import_previews" (
    "id" TEXT NOT NULL,
    "passport_id" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "conflicts" JSONB NOT NULL DEFAULT '[]',
    "selected_changes" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "language_passport_import_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_passport_audit_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "passport_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_passport_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "language_passports_organization_id_owner_user_id_key" ON "language_passports"("organization_id", "owner_user_id");

-- CreateIndex
CREATE INDEX "language_passports_organization_id_workspace_id_idx" ON "language_passports"("organization_id", "workspace_id");

-- CreateIndex
CREATE INDEX "language_passports_owner_user_id_state_idx" ON "language_passports"("owner_user_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "language_passport_entries_passport_id_entry_key_key" ON "language_passport_entries"("passport_id", "entry_key");

-- CreateIndex
CREATE INDEX "language_passport_entries_passport_id_type_status_idx" ON "language_passport_entries"("passport_id", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "language_passport_entry_revisions_entry_id_revision_key" ON "language_passport_entry_revisions"("entry_id", "revision");

-- CreateIndex
CREATE INDEX "language_passport_entry_revisions_entry_id_created_at_idx" ON "language_passport_entry_revisions"("entry_id", "created_at");

-- CreateIndex
CREATE INDEX "language_passport_snapshots_passport_id_created_at_idx" ON "language_passport_snapshots"("passport_id", "created_at");

-- CreateIndex
CREATE INDEX "language_passport_snapshots_content_hash_idx" ON "language_passport_snapshots"("content_hash");

-- CreateIndex
CREATE INDEX "language_passport_share_grants_passport_id_expires_at_idx" ON "language_passport_share_grants"("passport_id", "expires_at");

-- CreateIndex
CREATE INDEX "language_passport_share_grants_grantee_user_id_idx" ON "language_passport_share_grants"("grantee_user_id");

-- CreateIndex
CREATE INDEX "language_passport_share_grants_grantee_resource_idx" ON "language_passport_share_grants"("grantee_resource");

-- CreateIndex
CREATE INDEX "language_passport_resolutions_passport_id_created_at_idx" ON "language_passport_resolutions"("passport_id", "created_at");

-- CreateIndex
CREATE INDEX "language_passport_resolutions_product_request_key_idx" ON "language_passport_resolutions"("product", "request_key");

-- CreateIndex
CREATE INDEX "language_passport_import_previews_passport_id_status_idx" ON "language_passport_import_previews"("passport_id", "status");

-- CreateIndex
CREATE INDEX "language_passport_audit_events_organization_id_created_at_idx" ON "language_passport_audit_events"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "language_passport_audit_events_passport_id_created_at_idx" ON "language_passport_audit_events"("passport_id", "created_at");

-- AddForeignKey
ALTER TABLE "language_passports" ADD CONSTRAINT "language_passports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_entries" ADD CONSTRAINT "language_passport_entries_passport_id_fkey" FOREIGN KEY ("passport_id") REFERENCES "language_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_entry_revisions" ADD CONSTRAINT "language_passport_entry_revisions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "language_passport_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_snapshots" ADD CONSTRAINT "language_passport_snapshots_passport_id_fkey" FOREIGN KEY ("passport_id") REFERENCES "language_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_share_grants" ADD CONSTRAINT "language_passport_share_grants_passport_id_fkey" FOREIGN KEY ("passport_id") REFERENCES "language_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_resolutions" ADD CONSTRAINT "language_passport_resolutions_passport_id_fkey" FOREIGN KEY ("passport_id") REFERENCES "language_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_resolutions" ADD CONSTRAINT "language_passport_resolutions_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "language_passport_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_import_previews" ADD CONSTRAINT "language_passport_import_previews_passport_id_fkey" FOREIGN KEY ("passport_id") REFERENCES "language_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_audit_events" ADD CONSTRAINT "language_passport_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_passport_audit_events" ADD CONSTRAINT "language_passport_audit_events_passport_id_fkey" FOREIGN KEY ("passport_id") REFERENCES "language_passports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
