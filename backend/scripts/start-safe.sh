#!/bin/bash

echo "🚀 Starting Employee Attendance System (Safe Mode)..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Reset database and push schema (for fresh deployments)
echo "🗄️ Resetting and setting up database schema..."
npx prisma db push --force-reset

# Seed database with initial data
echo "🌱 Seeding database with initial data..."
npx ts-node prisma/seed.ts

# Start the application
echo "🎯 Starting the application..."
node dist/index.js

