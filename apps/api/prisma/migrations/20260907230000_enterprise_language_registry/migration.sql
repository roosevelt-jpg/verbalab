-- CreateEnum
CREATE TYPE "LinguisticRuleKind" AS ENUM ('pronunciation', 'grammar', 'phonetic', 'morphology');

-- CreateEnum
CREATE TYPE "WritingSystemKind" AS ENUM ('alphabet', 'abjad', 'abugida', 'syllabary', 'logographic', 'other');

-- CreateTable
CREATE TABLE "language_families" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "parent_code" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_systems" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "kind" "WritingSystemKind" NOT NULL DEFAULT 'alphabet',
    "rtl" BOOLEAN NOT NULL DEFAULT false,
    "sample_chars" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linguistic_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "LinguisticRuleKind" NOT NULL,
    "language_code" TEXT,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pattern" TEXT,
    "examples" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linguistic_rules_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "languages" ADD COLUMN "family_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "language_families_code_key" ON "language_families"("code");

-- CreateIndex
CREATE UNIQUE INDEX "writing_systems_code_key" ON "writing_systems"("code");

-- CreateIndex
CREATE INDEX "writing_systems_kind_idx" ON "writing_systems"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "linguistic_rules_code_key" ON "linguistic_rules"("code");

-- CreateIndex
CREATE INDEX "linguistic_rules_kind_idx" ON "linguistic_rules"("kind");

-- CreateIndex
CREATE INDEX "linguistic_rules_language_code_idx" ON "linguistic_rules"("language_code");

-- CreateIndex
CREATE INDEX "languages_family_code_idx" ON "languages"("family_code");

-- AddForeignKey
ALTER TABLE "languages" ADD CONSTRAINT "languages_family_code_fkey" FOREIGN KEY ("family_code") REFERENCES "language_families"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linguistic_rules" ADD CONSTRAINT "linguistic_rules_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;
