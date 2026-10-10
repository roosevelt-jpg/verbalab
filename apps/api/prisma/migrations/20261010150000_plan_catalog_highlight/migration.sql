-- Admin-editable "Popular" highlight on plan catalog cards
ALTER TABLE "plan_catalog_entries" ADD COLUMN "highlight" BOOLEAN NOT NULL DEFAULT false;
