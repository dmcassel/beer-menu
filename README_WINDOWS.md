# Beer Catalog - Windows Quick Setup

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites
- **Node.js 18+** - Download from https://nodejs.org/
- **MySQL Server** - Download from https://dev.mysql.com/downloads/mysql/

### 2. Extract and Open
```powershell
# Extract the zip file to your desired location
# Then open PowerShell in the beer_catalog_app folder
cd C:\path\to\beer_catalog_app
```

### 3. Create Database Configuration
Create a `.env.local` file in the project root:
```powershell
New-Item -Path .env.local -ItemType File
```

Edit `.env.local` and add:
```
DATABASE_URL="mysql://root:your_password@localhost:3306/beer_catalog"
```

Create the database:
```powershell
mysql -u root -p -e "CREATE DATABASE beer_catalog;"
```

### 4. Install and Run
```powershell
# Install dependencies (handles peer dependency conflicts automatically)
npm install

# Set up database tables
npm run db:push

# Start the development server
npm run dev
```

Open your browser to: **http://localhost:3000**

## 📖 Full Documentation

See `WINDOWS_SETUP.md` for detailed setup instructions and troubleshooting.

## 🎯 Quick Commands

```powershell
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run tests
npm run db:push  # Update database schema
```

## ⚙️ Automated Setup (Optional)

If you prefer an automated setup, run the PowerShell script:

```powershell
# First, create your .env.local file (see step 3 above)
# Then run:
.\QUICK_START.ps1
```

## 🆘 Troubleshooting

**Port 3000 already in use?**
```powershell
$env:PORT = 3001
npm run dev
```

**npm install fails?**
```powershell
npm install --legacy-peer-deps
```

**Database connection error?**
- Verify MySQL is running
- Check your `.env.local` file
- Ensure the `beer_catalog` database exists

## 📁 What's Included

- **Full-stack application** with React frontend and Express backend
- **Database schema** for managing beers, breweries, styles, and menus
- **Complete CRUD API** with tRPC
- **Responsive UI** with Tailwind CSS and shadcn/ui components
- **Comprehensive tests** (29 passing tests)
- **No authentication required** - ready to use immediately

## 🎨 Features

- ✅ Manage beer inventory with detailed information (ABV, IBU, style)
- ✅ Organize beers by brewery and BJCP style categories
- ✅ Create custom menu categories
- ✅ Associate beers with menu categories
- ✅ Fully responsive design
- ✅ Real-time updates with hot module reloading

## 📝 Next Steps

1. Add your beer data through the dashboard
2. Customize the UI in `client/src/index.css`
3. Extend the database schema in `drizzle/schema.ts`
4. Deploy to production when ready

## 🔗 Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

**Need help?** Check `WINDOWS_SETUP.md` for detailed troubleshooting and FAQs.
