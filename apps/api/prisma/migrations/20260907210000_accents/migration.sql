-- CreateTable
CREATE TABLE "accents" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_native" TEXT,
    "region" TEXT,
    "related_dialect_code" TEXT,
    "cue_terms" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accents_code_key" ON "accents"("code");

-- CreateIndex
CREATE INDEX "accents_language_code_idx" ON "accents"("language_code");

-- AddForeignKey
ALTER TABLE "accents" ADD CONSTRAINT "accents_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE CASCADE ON UPDATE CASCADE;
