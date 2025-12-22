#!/bin/sh
set -e

echo "🚀 Starting Beer Menu Application..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until node -e "
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  client.connect()
    .then(() => { console.log('✅ Database is ready'); client.end(); process.exit(0); })
    .catch(() => { console.log('⏳ Database not ready yet...'); process.exit(1); });
" 2>/dev/null; do
  sleep 2
done

# Check if migrations table exists and create if needed
echo "📊 Checking migration status..."
node -e "
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  async function checkMigrations() {
    await client.connect();
    
    // Create migrations tracking table if it doesn't exist
    await client.query(\`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`);
    
    // Check which migrations have been applied
    const result = await client.query('SELECT migration_name FROM __drizzle_migrations');
    const appliedMigrations = result.rows.map(r => r.migration_name);
    
    console.log('Applied migrations:', appliedMigrations.join(', ') || 'none');
    
    await client.end();
  }
  
  checkMigrations().catch(err => {
    console.error('Error checking migrations:', err.message);
    process.exit(1);
  });
"

# Run pending migrations
echo "🔄 Applying pending migrations..."

# Function to apply a migration if not already applied
apply_migration() {
  MIGRATION_FILE=$1
  MIGRATION_NAME=$(basename "$MIGRATION_FILE" .sql)
  
  node -e "
    const fs = require('fs');
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    
    async function applyMigration() {
      await client.connect();
      
      // Check if migration was already applied
      const check = await client.query(
        'SELECT 1 FROM __drizzle_migrations WHERE migration_name = \$1',
        ['$MIGRATION_NAME']
      );
      
      if (check.rows.length > 0) {
        console.log('⏭️  Skipping $MIGRATION_NAME (already applied)');
        await client.end();
        return;
      }
      
      console.log('📝 Applying $MIGRATION_NAME...');
      
      try {
        // Read and execute migration
        const sql = fs.readFileSync('$MIGRATION_FILE', 'utf-8');
        await client.query('BEGIN');
        await client.query(sql);
        
        // Record migration as applied
        await client.query(
          'INSERT INTO __drizzle_migrations (migration_name) VALUES (\$1)',
          ['$MIGRATION_NAME']
        );
        
        await client.query('COMMIT');
        console.log('✅ Applied $MIGRATION_NAME');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to apply $MIGRATION_NAME:', err.message);
        throw err;
      } finally {
        await client.end();
      }
    }
    
    applyMigration().catch(err => {
      console.error('Migration failed:', err.message);
      process.exit(1);
    });
  "
}

# Apply migrations in order
if [ -d "drizzle/migrations" ]; then
  for migration in drizzle/migrations/*.sql; do
    if [ -f "$migration" ]; then
      apply_migration "$migration"
    fi
  done
else
  echo "⚠️  No migrations directory found, skipping migrations"
fi

echo "✅ All migrations applied successfully"
echo "🎉 Starting application..."

# Start the application
exec pnpm start
