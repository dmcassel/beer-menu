# Beer Catalog - Windows Setup Guide

This guide will help you set up and run the Beer Catalog application on your Windows laptop using PowerShell.

## Prerequisites

Before you begin, ensure you have the following installed on your Windows machine:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation by opening PowerShell and running:
     ```powershell
     node --version
     npm --version
     ```

2. **Git** (optional, but recommended)
   - Download from: https://git-scm.com/download/win
   - Verify installation:
     ```powershell
     git --version
     ```

3. **MySQL Server** (required for database)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - During installation, note your root password and port (default: 3306)
   - Verify installation:
     ```powershell
     mysql --version
     ```

## Step 1: Extract the Project

1. Extract the `beer_catalog_app.zip` file to your desired location (e.g., `C:\Users\YourName\Projects\`)
2. Open PowerShell and navigate to the project directory:
   ```powershell
   cd C:\Users\YourName\Projects\beer_catalog_app
   ```

## Step 2: Install Dependencies

Run the following command in PowerShell to install all project dependencies:

```powershell
npm install
```

The `.npmrc` file in the project automatically handles peer dependency conflicts, so you should not see any errors. If you do encounter issues, the `legacy-peer-deps` setting will resolve them.

## Step 3: Configure Database Connection

1. Create a `.env.local` file in the project root with your database configuration:
   ```powershell
   New-Item -Path .env.local -ItemType File
   ```

2. Edit the `.env.local` file and add your database connection string. The format should be:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/beer_catalog"
   ```

   Replace:
   - `username` with your MySQL username (default: `root`)
   - `password` with your MySQL password
   - `localhost:3306` with your MySQL server address and port if different

3. Create the database in MySQL:
   ```powershell
   mysql -u root -p
   ```
   Then in the MySQL prompt:
   ```sql
   CREATE DATABASE beer_catalog;
   EXIT;
   ```

## Step 4: Initialize the Database

Run the database migration to create all tables:

```powershell
npm run db:push
```

This command will:
- Generate the Drizzle ORM schema
- Run migrations to create all database tables

## Step 5: Start the Development Server

Run the development server:

```powershell
npm run dev
```

You should see output similar to:
```
Server running on http://localhost:3000/
```

Open your browser and navigate to: `http://localhost:3000`

## Step 6: Access the Application

1. The home page will load with the Beer Catalog welcome screen
2. Click "Open Dashboard" to access the management interface
3. You can now:
   - Add, edit, and delete beers
   - Manage breweries and beer styles
   - Organize menu categories
   - Associate beers with menu categories

## Common Commands

Here are the most useful commands you'll use:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the development server (http://localhost:3000) |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run test` | Run all tests |
| `npm run check` | Check TypeScript for errors |
| `npm run format` | Format code with Prettier |
| `npm run db:push` | Push database schema changes |

## Troubleshooting

### "npm install" fails with peer dependency errors

If you still encounter peer dependency errors despite the `.npmrc` file:

```powershell
npm install --legacy-peer-deps
```

### Port 3000 is already in use

If port 3000 is already in use, you can change it by modifying the `server/_core/index.ts` file or by setting an environment variable:

```powershell
$env:PORT = 3001
npm run dev
```

### Database connection fails

1. Verify MySQL is running:
   ```powershell
   mysql -u root -p
   ```

2. Check your `.env.local` file has the correct connection string

3. Ensure the `beer_catalog` database exists:
   ```powershell
   mysql -u root -p -e "SHOW DATABASES;"
   ```

### Cannot find module errors

Clear the node_modules and reinstall:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

## Project Structure

```
beer_catalog_app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   └── App.tsx        # Main app routing
│   └── index.html
├── server/                # Express backend
│   ├── db.ts             # Database queries
│   ├── routers.ts        # tRPC API procedures
│   └── _core/            # Framework internals
├── drizzle/              # Database schema
│   └── schema.ts         # Table definitions
├── package.json          # Dependencies
├── .npmrc               # npm configuration (legacy-peer-deps)
└── vite.config.ts       # Vite configuration
```

## Development Tips

1. **Hot Module Replacement (HMR)**: Changes to frontend code will automatically reload in the browser
2. **Database Changes**: After modifying `drizzle/schema.ts`, run `npm run db:push` to apply changes
3. **Type Safety**: Run `npm run check` to verify TypeScript types before committing
4. **Testing**: Run `npm run test` to execute the test suite

## Next Steps

- Add more beer data to the catalog
- Customize the UI styling in `client/src/index.css`
- Extend the database schema in `drizzle/schema.ts`
- Add new features by creating new pages in `client/src/pages/`

## Support

If you encounter any issues:

1. Check the error message in the PowerShell console
2. Verify all prerequisites are installed
3. Ensure your `.env.local` file is correctly configured
4. Try clearing node_modules and reinstalling: `Remove-Item -Recurse -Force node_modules && npm install`

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [tRPC Documentation](https://trpc.io/)
