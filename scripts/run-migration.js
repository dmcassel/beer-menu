#!/usr/bin/env node

/**
 * Simple migration runner for applying SQL migrations to the database
 * Usage: node scripts/run-migration.js <migration-file>
 * Example: node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql
 */

import { readFileSync } from "fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Client } = pg;

async function runMigration(migrationFile) {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log(`📦 Connecting to database...`);
    await client.connect();
    console.log(`✅ Connected to database`);

    console.log(`📄 Reading migration file: ${migrationFile}`);
    const sql = readFileSync(migrationFile, "utf-8");

    console.log(`🚀 Executing migration...`);
    await client.query(sql);
    console.log(`✅ Migration completed successfully!`);
  } catch (error) {
    console.error(`❌ Migration failed:`, error.message);
    if (error.code === "42710") {
      console.log(`ℹ️  This error usually means the migration was already applied.`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error("❌ Usage: node scripts/run-migration.js <migration-file>");
  console.error("   Example: node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql");
  process.exit(1);
}

runMigration(migrationFile);
