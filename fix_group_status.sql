-- Create GroupStatus enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupStatus') THEN
        CREATE TYPE "GroupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
    END IF;
END $$;

-- Fix the groups table status column
DO $$
BEGIN
    -- Check if groups table exists and status is TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' 
        AND column_name = 'status' 
        AND data_type = 'text'
    ) THEN
        -- Step 1: Drop the default
        ALTER TABLE groups ALTER COLUMN status DROP DEFAULT;
        
        -- Step 2: Convert to enum type
        ALTER TABLE groups 
        ALTER COLUMN status TYPE "GroupStatus" 
        USING status::"GroupStatus";
        
        -- Step 3: Add back the default as enum
        ALTER TABLE groups 
        ALTER COLUMN status SET DEFAULT 'PENDING'::"GroupStatus";
    END IF;
END $$;
