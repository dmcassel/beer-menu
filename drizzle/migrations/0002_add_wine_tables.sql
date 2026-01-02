-- Add wine-related tables and enums

-- Create location type enum
CREATE TYPE "public"."location_type" AS ENUM('country', 'state', 'area', 'vineyard');

-- Create location table (hierarchical)
CREATE TABLE "location" (
	"location_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "location_type" NOT NULL,
	"parent_id" integer
);

-- Create winery table
CREATE TABLE "winery" (
	"winery_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255)
);

-- Create varietal table
CREATE TABLE "varietal" (
	"varietal_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "varietal_name_unique" UNIQUE("name")
);

-- Create wine table
CREATE TABLE "wine" (
	"wine_id" serial PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"winery_id" integer,
	"vintage" integer,
	"location_id" integer,
	"refrigerated" integer DEFAULT 0 NOT NULL,
	"cellared" integer DEFAULT 0 NOT NULL,
	"description" text
);

-- Create wine_varietal junction table
CREATE TABLE "wine_varietal" (
	"wine_id" integer NOT NULL,
	"varietal_id" integer NOT NULL,
	CONSTRAINT "wine_varietal_wine_id_varietal_id_pk" PRIMARY KEY("wine_id","varietal_id")
);

-- Add foreign key constraints
ALTER TABLE "location" ADD CONSTRAINT "location_parent_id_location_location_id_fk" 
  FOREIGN KEY ("parent_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "wine" ADD CONSTRAINT "wine_winery_id_winery_winery_id_fk" 
  FOREIGN KEY ("winery_id") REFERENCES "public"."winery"("winery_id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wine" ADD CONSTRAINT "wine_location_id_location_location_id_fk" 
  FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "wine_varietal" ADD CONSTRAINT "wine_varietal_wine_id_wine_wine_id_fk" 
  FOREIGN KEY ("wine_id") REFERENCES "public"."wine"("wine_id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wine_varietal" ADD CONSTRAINT "wine_varietal_varietal_id_varietal_varietal_id_fk" 
  FOREIGN KEY ("varietal_id") REFERENCES "public"."varietal"("varietal_id") ON DELETE cascade ON UPDATE no action;
