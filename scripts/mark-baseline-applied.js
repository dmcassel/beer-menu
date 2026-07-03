#!/usr/bin/env node

/**
 * One-time script to mark the baseline migration as applied
 * Use this when your database already has the schema but no migration tracking
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Client } = pg;

async function markBaselineApplied() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("📦 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to database");

    // Create tracking table
    console.log("📊 Creating migration tracking table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if baseline is already marked
    const check = await client.query("SELECT 1 FROM __drizzle_migrations WHERE migration_name = $1", ["0000_baseline"]);

    if (check.rows.length > 0) {
      console.log("ℹ️  Baseline migration already marked as applied");
    } else {
      // Mark baseline as applied
      await client.query("INSERT INTO __drizzle_migrations (migration_name) VALUES ($1)", ["0000_baseline"]);
      console.log("✅ Marked baseline migration as applied");
    }

    // Show all applied migrations
    const result = await client.query("SELECT migration_name, applied_at FROM __drizzle_migrations ORDER BY id");

    console.log("\n📋 Applied migrations:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.migration_name} (${row.applied_at.toISOString()})`);
    });

    console.log("\n✅ Done! You can now apply new migrations.");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

markBaselineApplied();
