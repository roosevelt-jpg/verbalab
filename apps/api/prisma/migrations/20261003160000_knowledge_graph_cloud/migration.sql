-- Knowledge Graph Cloud (VL-184 / Phase 51) — bounded entity/relationship layer over Postgres
CREATE TABLE "kg_entities" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'concept',
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "document_id" TEXT,
    "domain" TEXT NOT NULL DEFAULT 'general',
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kg_entities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kg_relationships" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "from_entity_id" TEXT NOT NULL,
    "to_entity_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'related_to',
    "label" TEXT NOT NULL DEFAULT '',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kg_relationships_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "kg_entities_organization_id_workspace_id_name_idx" ON "kg_entities"("organization_id", "workspace_id", "name");
CREATE INDEX "kg_entities_workspace_id_type_idx" ON "kg_entities"("workspace_id", "type");
CREATE INDEX "kg_entities_workspace_id_domain_idx" ON "kg_entities"("workspace_id", "domain");
CREATE INDEX "kg_entities_document_id_idx" ON "kg_entities"("document_id");

CREATE INDEX "kg_relationships_organization_id_workspace_id_idx" ON "kg_relationships"("organization_id", "workspace_id");
CREATE INDEX "kg_relationships_from_entity_id_idx" ON "kg_relationships"("from_entity_id");
CREATE INDEX "kg_relationships_to_entity_id_idx" ON "kg_relationships"("to_entity_id");
CREATE INDEX "kg_relationships_workspace_id_type_idx" ON "kg_relationships"("workspace_id", "type");

ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_from_entity_id_fkey" FOREIGN KEY ("from_entity_id") REFERENCES "kg_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_to_entity_id_fkey" FOREIGN KEY ("to_entity_id") REFERENCES "kg_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
