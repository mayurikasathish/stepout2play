-- Add actualStartTime field to matches table for tracking when match actually started
ALTER TABLE "matches" ADD COLUMN "actualStartTime" TIMESTAMP(3);

-- Add index for querying live matches
CREATE INDEX "matches_actualStartTime_idx" ON "matches"("actualStartTime");
