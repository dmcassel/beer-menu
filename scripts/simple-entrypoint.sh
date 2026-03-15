#!/bin/sh
set -e

echo "🚀 Starting Beer Menu Application (Simple Mode)..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 5

# Just start the app without running migrations
echo "🎉 Starting application..."
exec npm start
