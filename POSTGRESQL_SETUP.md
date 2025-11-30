# Beer Catalog - PostgreSQL Setup Guide

This guide explains how to set up the Beer Catalog application with your existing PostgreSQL database.

## Prerequisites

- PostgreSQL database already installed and running
- Node.js 18+ installed
- The beer catalog application extracted and ready

## Step 1: Update Database Connection String

Edit your `.env.local` file (create it if it doesn't exist) and add your PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@localhost:5432/beer_catalog"
```

Replace the following:

- `username` - Your PostgreSQL username (default: `postgres`)
- `password` - Your PostgreSQL password
- `localhost:5432` - Your PostgreSQL server address and port (default: localhost:5432)
- `beer_catalog` - Your database name

### Example with default PostgreSQL settings:

```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/beer_catalog"
```

## Step 2: Create the Database (if needed)

If you haven't created the `beer_catalog` database yet, run:

```powershell
# On Windows PowerShell
psql -U postgres -c "CREATE DATABASE beer_catalog;"
```

Or use your preferred PostgreSQL client to create the database.

## Step 3: Update Database Schema

The application uses Drizzle ORM to manage the database schema. Since you have an existing PostgreSQL database, you have two options:

### Option A: Use Existing Tables (Recommended if you already have data)

If your PostgreSQL database already has the required tables with the same structure, you can skip the migration step and proceed directly to running the application.

### Option B: Apply the Schema (Fresh Database)

If your database is empty or you want to use the application's schema, run:

```powershell
npm run db:push
```

This command will:

1. Generate the Drizzle ORM migration files
2. Apply the schema to your PostgreSQL database
3. Create all necessary tables

**Warning:** If you have existing tables with different structures, this may cause conflicts. Back up your database first.

## Step 4: Install Dependencies

```powershell
npm install
```

The `.npmrc` file automatically handles peer dependency conflicts.

## Step 5: Start the Development Server

```powershell
npm run dev
```

The application will start on `http://localhost:3000`

## Database Schema

The application expects the following tables in your PostgreSQL database:

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role VARCHAR(10) DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### BJCP Category Table

```sql
CREATE TABLE bjcp_category (
  bjcpId SERIAL PRIMARY KEY,
  label VARCHAR(10) NOT NULL,
  name TEXT NOT NULL
);
```

### Style Table

```sql
CREATE TABLE style (
  styleId SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  bjcpId INTEGER REFERENCES bjcp_category(bjcpId) ON DELETE CASCADE
);
```

### Brewery Table

```sql
CREATE TABLE brewery (
  breweryId SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT
);
```

### Beer Table

```sql
CREATE TABLE beer (
  beerId SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  breweryId INTEGER REFERENCES brewery(breweryId) ON DELETE CASCADE,
  styleId INTEGER REFERENCES style(styleId) ON DELETE CASCADE,
  abv VARCHAR(10),
  ibu INTEGER
);
```

### Menu Category Table

```sql
CREATE TABLE menu_category (
  menuCatId SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);
```

### Menu Category Beer Association Table

```sql
CREATE TABLE menu_category_beer (
  menuCatId INTEGER REFERENCES menu_category(menuCatId) ON DELETE CASCADE,
  beerId INTEGER REFERENCES beer(beerId) ON DELETE CASCADE,
  PRIMARY KEY (menuCatId, beerId)
);
```

## Troubleshooting

### Connection Refused Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

1. Verify PostgreSQL is running
2. Check your connection string in `.env.local`
3. Ensure the correct port is specified (default: 5432)

### Authentication Failed

```
Error: password authentication failed for user "postgres"
```

**Solution:**

1. Verify your PostgreSQL username and password
2. Check that the user has permission to access the database
3. Make sure there are no typos in the `.env.local` file

### Database Does Not Exist

```
Error: database "beer_catalog" does not exist
```

**Solution:**

1. Create the database:
   ```powershell
   psql -U postgres -c "CREATE DATABASE beer_catalog;"
   ```

### Table Does Not Exist

```
Error: relation "beer" does not exist
```

**Solution:**

1. Run the schema migration:
   ```powershell
   npm run db:push
   ```

### Port 3000 Already in Use

```powershell
# Set a different port
$env:PORT = 3001
npm run dev
```

## Migrating from MySQL to PostgreSQL

If you're migrating from MySQL to PostgreSQL, you'll need to:

1. Export your MySQL data
2. Convert the schema to PostgreSQL syntax
3. Import the data into PostgreSQL
4. Update the `DATABASE_URL` in `.env.local`

Tools that can help:

- **pgloader** - Automated migration tool
- **DBeaver** - Visual database migration tool
- **MySQL Workbench** - Export and import functionality

## Performance Tips

1. **Add indexes** for frequently queried columns:

   ```sql
   CREATE INDEX idx_beer_name ON beer(name);
   CREATE INDEX idx_brewery_name ON brewery(name);
   ```

2. **Monitor query performance** using PostgreSQL's EXPLAIN:

   ```sql
   EXPLAIN ANALYZE SELECT * FROM beer WHERE name LIKE '%IPA%';
   ```

3. **Regular backups**:
   ```powershell
   pg_dump -U postgres beer_catalog > backup.sql
   ```

## Next Steps

1. Start the development server: `npm run dev`
2. Open the application at `http://localhost:3000`
3. Click "Open Dashboard" to manage your beer catalog
4. Add your beer data through the UI

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [psql Command Line Tool](https://www.postgresql.org/docs/current/app-psql.html)
