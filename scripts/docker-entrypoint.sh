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

# Initialize migration tracking
echo "📊 Initializing migration tracking..."
node -e "
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  async function initMigrations() {
    await client.connect();
    
    // Create migrations tracking table if it doesn't exist
    await client.query(\`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`);
    
    // Check if baseline schema exists by looking for the 'role' enum
    const enumCheck = await client.query(\`
      SELECT 1 FROM pg_type WHERE typname = 'role'
    \`);
    
    const hasBaselineSchema = enumCheck.rows.length > 0;
    
    if (hasBaselineSchema) {
      // Schema exists, mark baseline as applied if not already marked
      await client.query(\`
        INSERT INTO __drizzle_migrations (migration_name) 
        VALUES ('0000_baseline') 
        ON CONFLICT (migration_name) DO NOTHING
      \`);
      console.log('✅ Detected existing schema, marked baseline as applied');
    }
    
    // Show applied migrations
    const result = await client.query('SELECT migration_name FROM __drizzle_migrations ORDER BY id');
    const appliedMigrations = result.rows.map(r => r.migration_name);
    console.log('Applied migrations:', appliedMigrations.join(', ') || 'none');
    
    await client.end();
  }
  
  initMigrations().catch(err => {
    console.error('❌ Error initializing migrations:', err.message);
    process.exit(1);
  });
"

# Run pending migrations
echo "🔄 Checking for pending migrations..."

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
  echo "✅ All migrations processed"
else
  echo "⚠️  No migrations directory found, skipping migrations"
fi

echo "🎉 Starting application..."

# Start the application
exec pnpm start
