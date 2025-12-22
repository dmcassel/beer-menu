# Deployment Guide

This guide explains how to deploy database migrations and code updates to both local and production environments.

## Understanding the Migration System

### How Drizzle Migrations Work

Drizzle Kit uses two commands:
- **`drizzle-kit generate`**: Generates migration files by comparing your schema with the database
- **`drizzle-kit migrate`**: Applies pending migrations to the database

The current `db:push` script runs both commands, which can cause issues:
```json
"db:push": "drizzle-kit generate && drizzle-kit migrate"
```

### Why Your Local Database Had Issues

When you ran `npm run db:push`, Drizzle tried to:
1. Generate new migrations (comparing schema to DB)
2. Apply ALL migrations in the `drizzle/migrations/` folder

If your database already had the `role` enum from a previous migration, it failed when trying to create it again. **Drizzle doesn't track which migrations have been applied** - it just runs all `.sql` files in order.

### The Problem with the Current Setup

Drizzle Kit doesn't have built-in migration tracking like other ORMs (e.g., no `migrations` table in the database). It relies on you to:
- Only run migrations once
- Manually track what's been applied
- Use `drizzle-kit push` for schema sync (which bypasses migrations entirely)

---

## Local Development

### Option 1: Apply Single Migration (Recommended)

For the current PR (#22), apply just the new migration:

```bash
# Make sure you're in the project root
cd /path/to/beer-menu

# Apply the specific migration
node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql
```

This script:
- Reads the SQL file
- Connects to your local database
- Executes the migration
- Handles errors gracefully (e.g., if already applied)

### Option 2: Reset Database (Nuclear Option)

If your local database is in a bad state:

```bash
# Drop and recreate the database
psql -U your_user -c "DROP DATABASE beer_menu;"
psql -U your_user -c "CREATE DATABASE beer_menu;"

# Apply baseline migration
node scripts/run-migration.js drizzle/migrations/0000_baseline.sql

# Apply the new migration
node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql
```

### Option 3: Use Drizzle Push (Schema Sync)

Instead of migrations, you can use Drizzle's push mode to sync the schema:

```bash
# This compares schema.ts with the database and applies changes
pnpm drizzle-kit push
```

⚠️ **Warning**: This bypasses migrations and directly modifies the database. Only use in development.

---

## Production Deployment

### Prerequisites

1. **Database Access**: You need to be able to connect to the production database
2. **Code Deployment**: Updated code needs to be in the container
3. **Environment Variables**: `DATABASE_URL` must be set correctly

### Step-by-Step Production Deployment

#### Step 1: Deploy Code Changes

```bash
# On your local machine, push the latest code
git push origin main  # or merge the PR first

# On the production server, pull the latest code
cd /path/to/beer-menu
git pull origin main

# Rebuild the Docker container with updated code
docker-compose build

# Restart the container
docker-compose up -d
```

#### Step 2: Apply Database Migration

**Option A: Run Migration from Host (Recommended)**

If you have `node` and the database is accessible from the host:

```bash
# On the production server (outside container)
cd /path/to/beer-menu

# Make sure DATABASE_URL is set
export DATABASE_URL="postgresql://user:password@host:port/database"

# Install dependencies if needed
npm install

# Run the migration
node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql
```

**Option B: Run Migration Inside Container**

If the database is only accessible from inside the container:

```bash
# Copy the migration script into the running container
docker cp scripts/run-migration.js <container-name>:/app/scripts/
docker cp drizzle/migrations/0001_add_menu_category_to_style.sql <container-name>:/app/drizzle/migrations/

# Execute the migration inside the container
docker exec <container-name> node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql
```

**Option C: Use Docker Compose Exec**

```bash
# Run migration inside the container using docker-compose
docker-compose exec app node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql
```

#### Step 3: Verify Deployment

```bash
# Check if the column was added
docker-compose exec db psql -U your_user -d beer_menu -c "\d style"

# You should see menu_category_id in the style table
```

---

## Troubleshooting

### "drizzle-kit: command not found"

This happens when:
- You're running outside the container and `node_modules` isn't installed
- You're inside the container and dependencies weren't copied

**Solution**: Use the `scripts/run-migration.js` script instead, which uses `pg` directly.

### "role enum already exists"

This means the migration was partially applied or run multiple times.

**Solution**: 
- Check what's in your database: `\dT` in psql
- Either skip that migration or reset the database

### "Cannot connect to database"

**Solution**: 
- Verify `DATABASE_URL` is set: `echo $DATABASE_URL`
- Check database is running: `docker-compose ps`
- Test connection: `psql $DATABASE_URL`

---

## Best Practices

### For Future Migrations

1. **Always create migrations in the `drizzle/migrations/` folder**
2. **Use sequential numbering**: `0001_`, `0002_`, etc.
3. **Update the journal**: Add entries to `drizzle/migrations/meta/_journal.json`
4. **Test locally first**: Apply migration to local DB before production
5. **Keep migrations idempotent**: Use `IF NOT EXISTS` where possible

### Recommended Workflow

```bash
# 1. Make schema changes in drizzle/schema.ts

# 2. Generate migration (this creates files in drizzle/ root)
pnpm drizzle-kit generate

# 3. Move to migrations folder and rename
mv drizzle/0002_*.sql drizzle/migrations/0002_descriptive_name.sql

# 4. Update the journal file manually

# 5. Test locally
node scripts/run-migration.js drizzle/migrations/0002_descriptive_name.sql

# 6. Commit and deploy
git add drizzle/
git commit -m "Add migration for X"
git push
```

---

## Alternative: Drizzle Studio

For visual database management:

```bash
# Start Drizzle Studio
pnpm drizzle-kit studio

# Opens a web interface at http://localhost:4983
```

This lets you:
- View all tables and data
- Run queries
- See schema changes
- But it doesn't help with migrations

---

## Summary

**For Local (PR #22)**:
```bash
node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql
```

**For Production**:
```bash
# 1. Deploy code
git pull && docker-compose build && docker-compose up -d

# 2. Run migration
docker-compose exec app node scripts/run-migration.js drizzle/migrations/0001_add_menu_category_to_style.sql
```

**For Future Migrations**:
- Use the migration runner script
- Keep migrations in `drizzle/migrations/`
- Test locally before production
- Consider using a proper migration tracking system (like adding a `migrations` table)
