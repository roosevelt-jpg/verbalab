-- Pilot requests from the public /organizations page.
CREATE TABLE "pilot_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "org_type" TEXT NOT NULL,
    "country" TEXT,
    "languages" TEXT,
    "use_case" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pilot_requests_status_created_at_idx" ON "pilot_requests"("status", "created_at");
