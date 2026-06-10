-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('BRACKET', 'ROUND_ROBIN', 'KNOCKOUT', 'LEAGUE');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" TEXT,
ADD COLUMN     "gender" TEXT;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "format" "TournamentFormat" NOT NULL DEFAULT 'BRACKET';
