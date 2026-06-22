-- Create GroupStatus enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupStatus') THEN
        CREATE TYPE "GroupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
    END IF;
END $$;

-- Update groups table to use the enum (if the column already exists as TEXT)
DO $$
BEGIN
    -- Check if status column is TEXT type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' 
        AND column_name = 'status' 
        AND data_type = 'text'
    ) THEN
        -- Convert TEXT to enum
        ALTER TABLE groups 
        ALTER COLUMN status TYPE "GroupStatus" 
        USING status::"GroupStatus";
    END IF;
END $$;
