#!/bin/bash

echo "🚀 Starting Employee Attendance System..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Fix database schema issues
echo "🔧 Fixing database schema..."
npx ts-node scripts/fix-database.ts || echo "⚠️ Database fix failed, continuing..."

# Try to run migration first (for existing databases)
echo "🔄 Attempting department migration..."
npx ts-node scripts/migrate-departments.ts || echo "⚠️ Migration skipped or failed, continuing..."

# Push database schema with data loss acceptance
echo "🗄️ Setting up database schema..."
npx prisma db push --accept-data-loss

# Seed database with initial data
echo "🌱 Seeding database with initial data..."
npx ts-node prisma/seed.ts

# Start the application
echo "🎯 Starting the application..."
node dist/index.js



