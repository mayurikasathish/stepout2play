-- Add SNAKE to SeedingMethod enum if it doesn't exist
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
