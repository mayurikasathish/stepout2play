-- Migration: Add missing entryFee, maxParticipants to Tournament and registrationFee to Event

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS "entryFee" DECIMAL(10,2);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS "maxParticipants" INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "registrationFee" DECIMAL(10,2);
