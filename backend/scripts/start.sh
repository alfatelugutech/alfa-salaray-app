#!/bin/bash

echo "🚀 Starting Employee Attendance System..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Setting up database schema..."
npx prisma db push

# Seed database with initial data
echo "🌱 Seeding database with initial data..."
npx ts-node prisma/seed.ts

# Start the application
echo "🎯 Starting the application..."
node dist/index.js


