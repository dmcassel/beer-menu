#!/usr/bin/env node

/**
 * Local migration script
 * Applies pending migrations to the local database with tracking
 * This mimics the behavior of docker-entrypoint.sh for local development
 */

import { readFileSync, readdirSync } from "fs";
import { join, basename } from "path";
import pg from "pg";
import dotenv from "dotenv";

const { Client } = pg;

// Load environment variables from .env.compose.local
dotenv.config({ path: ".env.compose.local" });

// Build DATABASE_URL for localhost
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes("@postgres:")) {
  connectionString = connectionString.replace("@postgres:", "@localhost:");
} else if (process.env.POSTGRES_USER) {
  connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;
}

if (!connectionString) {
  console.error("❌ DATABASE_URL could not be determined");
  process.exit(1);
}

console.log("🚀 Starting local database migration...");
console.log(`📡 Connecting to: ${connectionString.replace(/:[^:@]+@/, ":****@")}`);

async function initMigrationTracking(client) {
  console.log("📊 Initializing migration tracking...");

  // Create migrations tracking table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if baseline schema exists
  const enumCheck = await client.query(`
    SELECT 1 FROM pg_type WHERE typname = 'role'
  `);

  const hasBaselineSchema = enumCheck.rows.length > 0;

  if (hasBaselineSchema) {
    // Mark baseline as applied if not already marked
    await client.query(`
      INSERT INTO __drizzle_migrations (migration_name) 
      VALUES ('0000_baseline') 
      ON CONFLICT (migration_name) DO NOTHING
    `);
    console.log("✅ Detected existing schema, marked baseline as applied");
  }

  // Show applied migrations
  const result = await client.query("SELECT migration_name FROM __drizzle_migrations ORDER BY id");
  const appliedMigrations = result.rows.map((r) => r.migration_name);
  console.log("📋 Applied migrations:", appliedMigrations.join(", ") || "none");
}

async function applyMigration(client, migrationFile) {
  const migrationName = basename(migrationFile, ".sql");

  // Check if migration was already applied
  const check = await client.query("SELECT 1 FROM __drizzle_migrations WHERE migration_name = $1", [migrationName]);

  if (check.rows.length > 0) {
    console.log(`⏭️  Skipping ${migrationName} (already applied)`);
    return;
  }

  console.log(`📝 Applying ${migrationName}...`);

  try {
    // Read and execute migration
    const sql = readFileSync(migrationFile, "utf-8");

    await client.query("BEGIN");

    // Split by statement-breakpoint and execute each statement
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s);

    for (const statement of statements) {
      if (statement) {
        await client.query(statement);
      }
    }

    // Record migration as applied
    await client.query("INSERT INTO __drizzle_migrations (migration_name) VALUES ($1)", [migrationName]);

    await client.query("COMMIT");
    console.log(`✅ Applied ${migrationName}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`❌ Failed to apply ${migrationName}:`, err.message);
    throw err;
  }
}

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Initialize migration tracking
    await initMigrationTracking(client);

    // Get all migration files
    const migrationsDir = join(process.cwd(), "drizzle", "migrations");
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => join(migrationsDir, f));

    if (files.length === 0) {
      console.log("⚠️  No migration files found");
      return;
    }

    // Apply migrations in order
    for (const file of files) {
      await applyMigration(client, file);
    }

    console.log("✅ All migrations processed");
    console.log("🎉 Migration complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
