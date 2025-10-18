#!/bin/bash

echo "🚀 Starting deployment process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Pushing database schema..."
npx prisma db push

# Seed database if needed
echo "🌱 Seeding database..."
npx ts-node prisma/seed.ts

echo "✅ Deployment completed successfully!"
