-- CreateTable
CREATE TABLE "locale_packs" (
    "id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "bcp47" TEXT,
    "date_notes" TEXT,
    "number_notes" TEXT,
    "currency_code" TEXT,
    "currency_notes" TEXT,
    "honorifics" JSONB,
    "do_not_translate" JSONB,
    "cultural_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locale_packs_language_code_key" ON "locale_packs"("language_code");

-- AddForeignKey
ALTER TABLE "locale_packs" ADD CONSTRAINT "locale_packs_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE CASCADE ON UPDATE CASCADE;
