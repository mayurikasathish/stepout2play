-- Update existing LEAGUE and BRACKET tournaments to ROUND_ROBIN
UPDATE "tournaments" SET format = 'ROUND_ROBIN' WHERE format IN ('LEAGUE', 'BRACKET');

-- Recreate the TournamentFormat enum with only ROUND_ROBIN and KNOCKOUT
ALTER TYPE "TournamentFormat" RENAME TO "TournamentFormat_old";
CREATE TYPE "TournamentFormat" AS ENUM ('ROUND_ROBIN', 'KNOCKOUT');
ALTER TABLE "tournaments" ALTER COLUMN format TYPE "TournamentFormat" USING format::text::"TournamentFormat";
DROP TYPE "TournamentFormat_old";
