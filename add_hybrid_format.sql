-- Add League-cum-Knockout hybrid format support

-- 1. Add LEAGUE_CUM_KNOCKOUT to BracketFormat enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'BracketFormat' AND e.enumlabel = 'LEAGUE_CUM_KNOCKOUT'
    ) THEN
        ALTER TYPE "BracketFormat" ADD VALUE 'LEAGUE_CUM_KNOCKOUT';
    END IF;
END $$;

-- 2. Add hasBronzeMatch column to events table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='hasBronzeMatch') THEN
        ALTER TABLE events ADD COLUMN "hasBronzeMatch" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Update advanceCount to remove default (so NULL is allowed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='events' AND column_name='advanceCount'
    ) THEN
        ALTER TABLE events ALTER COLUMN "advanceCount" DROP DEFAULT;
    END IF;
END $$;
