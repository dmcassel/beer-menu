-- Remove 'state' from location_type enum
-- PostgreSQL doesn't support removing enum values directly, so we need to:
-- 1. Create a new enum type without 'state'
-- 2. Alter the column to use the new type
-- 3. Drop the old enum type
-- 4. Rename the new enum to the original name

-- Step 1: Create new enum without 'state'
CREATE TYPE "public"."location_type_new" AS ENUM('country', 'area', 'vineyard');--> statement-breakpoint

-- Step 2: Update the location table to use the new enum
-- This works because all existing values ('country', 'area', 'vineyard') are valid in the new enum
ALTER TABLE "location" 
  ALTER COLUMN "type" TYPE "location_type_new" 
  USING "type"::text::"location_type_new";--> statement-breakpoint

-- Step 3: Drop the old enum type
DROP TYPE "public"."location_type";--> statement-breakpoint

-- Step 4: Rename the new enum to the original name
ALTER TYPE "location_type_new" RENAME TO "location_type";
