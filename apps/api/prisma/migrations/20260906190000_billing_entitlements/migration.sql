-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "organizations" ADD COLUMN "character_quota" INTEGER NOT NULL DEFAULT 50000;
ALTER TABLE "organizations" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "organizations" ADD COLUMN "stripe_subscription_id" TEXT;
ALTER TABLE "organizations" ADD COLUMN "billing_status" TEXT NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_customer_id_key" ON "organizations"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_subscription_id_key" ON "organizations"("stripe_subscription_id");
