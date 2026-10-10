-- CreateTable
CREATE TABLE "dialects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_native" TEXT,
    "region" TEXT,
    "cue_terms" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dialects_code_key" ON "dialects"("code");

-- CreateIndex
CREATE INDEX "dialects_language_code_idx" ON "dialects"("language_code");

-- AddForeignKey
ALTER TABLE "dialects" ADD CONSTRAINT "dialects_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE CASCADE ON UPDATE CASCADE;
