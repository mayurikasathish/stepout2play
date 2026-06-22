-- Apply round robin changes directly to database

-- 1. Add SNAKE to SeedingMethod enum (skip if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'SeedingMethod' AND e.enumlabel = 'SNAKE'
    ) THEN
        ALTER TYPE "SeedingMethod" ADD VALUE 'SNAKE';
    END IF;
END $$;

-- 2. Add columns to events table (skip if exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='groupSize') THEN
        ALTER TABLE events ADD COLUMN "groupSize" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='groupCount') THEN
        ALTER TABLE events ADD COLUMN "groupCount" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='advanceCount') THEN
        ALTER TABLE events ADD COLUMN "advanceCount" INTEGER DEFAULT 2;
    END IF;
END $$;

-- 3. Create groups table
CREATE TABLE IF NOT EXISTS "groups" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- Add foreign key if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_eventId_fkey') THEN
        ALTER TABLE "groups" ADD CONSTRAINT "groups_eventId_fkey"
            FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS "groups_eventId_idx" ON "groups"("eventId");

-- 4. Create group_standings table
CREATE TABLE IF NOT EXISTS "group_standings" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_standings_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_standings_groupId_fkey') THEN
        ALTER TABLE "group_standings" ADD CONSTRAINT "group_standings_groupId_fkey"
            FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_standings_registrationId_fkey') THEN
        ALTER TABLE "group_standings" ADD CONSTRAINT "group_standings_registrationId_fkey"
            FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_standings_groupId_registrationId_key') THEN
        ALTER TABLE "group_standings" ADD CONSTRAINT "group_standings_groupId_registrationId_key"
            UNIQUE ("groupId", "registrationId");
    END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS "group_standings_groupId_idx" ON "group_standings"("groupId");

-- 5. Add groupId to matches table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='groupId') THEN
        ALTER TABLE matches ADD COLUMN "groupId" TEXT;
        ALTER TABLE matches ADD CONSTRAINT "matches_groupId_fkey"
            FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        CREATE INDEX "matches_groupId_idx" ON "matches"("groupId");
    END IF;
END $$;
