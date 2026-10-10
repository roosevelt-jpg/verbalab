-- Plan catalog entries and quota top-up purchases
CREATE TABLE "plan_catalog_entries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "character_quota" INTEGER NOT NULL DEFAULT 2000000,
    "stt_minutes_quota" INTEGER NOT NULL DEFAULT 120,
    "tts_chars_quota" INTEGER NOT NULL DEFAULT 2000000,
    "translate_chars_quota" INTEGER NOT NULL DEFAULT 2000000,
    "chat_tokens_quota" INTEGER NOT NULL DEFAULT 500000,
    "ocr_pages_quota" INTEGER NOT NULL DEFAULT 500,
    "workspace_limit" INTEGER NOT NULL DEFAULT 1,
    "price_monthly_usd" DOUBLE PRECISION,
    "price_label" TEXT NOT NULL DEFAULT '$99',
    "blurb" TEXT NOT NULL DEFAULT '',
    "features" JSONB NOT NULL DEFAULT '[]',
    "stripe_price_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_catalog_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "top_up_purchases" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "pack_id" TEXT NOT NULL,
    "product_kind" TEXT NOT NULL,
    "units_granted" INTEGER NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "stripe_payment_intent_id" TEXT,
    "stripe_session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_up_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "top_up_purchases_stripe_payment_intent_id_key" ON "top_up_purchases"("stripe_payment_intent_id");
CREATE UNIQUE INDEX "top_up_purchases_stripe_session_id_key" ON "top_up_purchases"("stripe_session_id");
CREATE INDEX "top_up_purchases_organization_id_status_idx" ON "top_up_purchases"("organization_id", "status");
CREATE INDEX "top_up_purchases_organization_id_product_kind_idx" ON "top_up_purchases"("organization_id", "product_kind");

ALTER TABLE "top_up_purchases" ADD CONSTRAINT "top_up_purchases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
