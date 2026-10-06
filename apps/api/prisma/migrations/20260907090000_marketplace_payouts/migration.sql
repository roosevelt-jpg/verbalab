-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "stripe_connect_account_id" TEXT;
ALTER TABLE "organizations" ADD COLUMN "stripe_connect_charges_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_connect_account_id_key" ON "organizations"("stripe_connect_account_id");

-- AlterTable
ALTER TABLE "marketplace_listings" ADD COLUMN "price_cents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "marketplace_listings" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'usd';

-- CreateTable
CREATE TABLE "marketplace_sales" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_org_id" TEXT NOT NULL,
    "publisher_org_id" TEXT NOT NULL,
    "install_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "application_fee_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripe_checkout_session_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_sales_install_id_key" ON "marketplace_sales"("install_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_sales_stripe_checkout_session_id_key" ON "marketplace_sales"("stripe_checkout_session_id");

-- CreateIndex
CREATE INDEX "marketplace_sales_publisher_org_id_created_at_idx" ON "marketplace_sales"("publisher_org_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_sales_buyer_org_id_idx" ON "marketplace_sales"("buyer_org_id");

-- AddForeignKey
ALTER TABLE "marketplace_sales" ADD CONSTRAINT "marketplace_sales_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_sales" ADD CONSTRAINT "marketplace_sales_buyer_org_id_fkey" FOREIGN KEY ("buyer_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_sales" ADD CONSTRAINT "marketplace_sales_publisher_org_id_fkey" FOREIGN KEY ("publisher_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_sales" ADD CONSTRAINT "marketplace_sales_install_id_fkey" FOREIGN KEY ("install_id") REFERENCES "marketplace_installs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
