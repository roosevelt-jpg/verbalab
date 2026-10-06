-- CreateEnum
CREATE TYPE "ApiKeyEnvironment" AS ENUM ('live', 'test');

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN "environment" "ApiKeyEnvironment" NOT NULL DEFAULT 'live';
