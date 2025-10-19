#!/bin/bash

# Backend-only build script
echo "Building backend only..."

# Clean previous build
rm -rf dist/

# Compile only backend TypeScript files
npx tsc --project tsconfig.json

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful!"
    echo "📁 Compiled files:"
    find dist/ -name "*.js" | head -10
else
    echo "❌ Backend build failed!"
    exit 1
fi
