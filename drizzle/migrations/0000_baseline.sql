-- Baseline migration: Create complete database schema
-- This creates all tables, types, and constraints from scratch

-- Create ENUM types
CREATE TYPE "public"."role" AS ENUM('user', 'curator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."beer_status" AS ENUM('on_tap', 'bottle_can', 'out');--> statement-breakpoint

-- Create tables
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_id" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" text,
	"picture" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);--> statement-breakpoint

CREATE TABLE "bjcp_category" (
	"bjcp_id" serial PRIMARY KEY NOT NULL,
	"label" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL
);--> statement-breakpoint

CREATE TABLE "style" (
	"style_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"bjcp_id" integer,
	"bjcp_link" varchar(255)
);--> statement-breakpoint

CREATE TABLE "brewery" (
	"brewery_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255)
);--> statement-breakpoint

CREATE TABLE "beer" (
	"beer_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"brewery_id" integer,
	"style_id" integer,
	"abv" numeric(4, 2),
	"ibu" integer,
	"status" "beer_status" DEFAULT 'out' NOT NULL
);--> statement-breakpoint

CREATE TABLE "menu_category" (
	"menu_cat_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);--> statement-breakpoint

CREATE TABLE "menu_category_beer" (
	"menu_cat_id" integer NOT NULL,
	"beer_id" integer NOT NULL,
	PRIMARY KEY("menu_cat_id", "beer_id")
);--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "style" ADD CONSTRAINT "style_bjcp_id_bjcp_category_bjcp_id_fk" FOREIGN KEY ("bjcp_id") REFERENCES "public"."bjcp_category"("bjcp_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beer" ADD CONSTRAINT "beer_brewery_id_brewery_brewery_id_fk" FOREIGN KEY ("brewery_id") REFERENCES "public"."brewery"("brewery_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beer" ADD CONSTRAINT "beer_style_id_style_style_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."style"("style_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category_beer" ADD CONSTRAINT "menu_category_beer_menu_cat_id_menu_category_menu_cat_id_fk" FOREIGN KEY ("menu_cat_id") REFERENCES "public"."menu_category"("menu_cat_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category_beer" ADD CONSTRAINT "menu_category_beer_beer_id_beer_beer_id_fk" FOREIGN KEY ("beer_id") REFERENCES "public"."beer"("beer_id") ON DELETE cascade ON UPDATE no action;
