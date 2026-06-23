-- AlterTable
ALTER TABLE "events" ADD COLUMN "sportId" TEXT;
ALTER TABLE "events" ADD COLUMN "scoringType" TEXT;
ALTER TABLE "events" ADD COLUMN "scoringRules" JSONB;
