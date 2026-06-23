-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN "sportType" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "sports" TEXT[];

-- Set default values for existing tournaments (single sport, using existing sport field)
UPDATE "tournaments" SET "sportType" = 'single' WHERE "sportType" IS NULL;
UPDATE "tournaments" SET "sports" = ARRAY['badminton'] WHERE "sports" IS NULL OR array_length("sports", 1) IS NULL;
