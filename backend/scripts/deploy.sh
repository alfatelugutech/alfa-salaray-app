#!/bin/bash

echo "🚀 Starting backend deployment build..."

# Ensure we're in the backend directory
cd "$(dirname "$0")/.."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build TypeScript (backend only)
echo "🔨 Building TypeScript (backend only)..."
npx tsc --project tsconfig.json

# Check build success
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful!"
    echo "📁 Compiled files:"
    find dist/ -name "*.js" | head -5
    echo "🎉 Ready for deployment!"
else
    echo "❌ Backend build failed!"
    exit 1
fi
