# Beer Catalog - Quick Start Script for Windows PowerShell
# This script automates the setup process for Windows users

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Beer Catalog - Windows Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($null -eq $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from: https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green

$npmVersion = npm --version 2>$null
Write-Host "✓ npm $npmVersion found" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Check for .env.local
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    Write-Host "WARNING: .env.local file not found" -ForegroundColor Yellow
    Write-Host "You need to create .env.local with your database connection string" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example .env.local:" -ForegroundColor Cyan
    Write-Host 'DATABASE_URL="mysql://root:password@localhost:3306/beer_catalog"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please create the .env.local file and try again." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ .env.local file found" -ForegroundColor Green
Write-Host ""

# Run database migrations
Write-Host "Setting up database..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Database setup may have failed" -ForegroundColor Yellow
    Write-Host "Please check your DATABASE_URL in .env.local" -ForegroundColor Yellow
}
Write-Host "✓ Database setup complete" -ForegroundColor Green
Write-Host ""

# Start development server
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server is starting..." -ForegroundColor Cyan
Write-Host "Open your browser and go to: http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
