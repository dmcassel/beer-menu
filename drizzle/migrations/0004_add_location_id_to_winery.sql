-- Add location_id foreign key column to winery table
-- This adds a structured relationship between winery and location
-- The existing 'location' varchar field will remain for backward compatibility

-- Add the location_id column (nullable, since existing wineries won't have this set initially)
ALTER TABLE "winery" ADD COLUMN "location_id" integer;--> statement-breakpoint

-- Add foreign key constraint to location table
ALTER TABLE "winery" ADD CONSTRAINT "winery_location_id_location_location_id_fk" 
  FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;
