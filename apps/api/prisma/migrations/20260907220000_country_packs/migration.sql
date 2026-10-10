-- CreateTable
CREATE TABLE "country_packs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "region" TEXT,
    "currency_code" TEXT,
    "primary_languages" JSONB NOT NULL DEFAULT '[]',
    "bcp47_tags" JSONB NOT NULL DEFAULT '[]',
    "related_dialect_codes" JSONB NOT NULL DEFAULT '[]',
    "related_accent_codes" JSONB NOT NULL DEFAULT '[]',
    "date_notes" TEXT,
    "number_notes" TEXT,
    "currency_notes" TEXT,
    "cultural_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_packs_code_key" ON "country_packs"("code");

-- CreateIndex
CREATE INDEX "country_packs_region_idx" ON "country_packs"("region");
