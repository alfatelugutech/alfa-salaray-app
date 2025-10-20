#!/bin/bash

# Employee Management System - Vercel Deployment Script
echo "🚀 Employee Management System - Vercel Deployment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI"
        exit 1
    fi
fi

# Check Vercel authentication
echo "🔐 Checking Vercel authentication..."
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "🔑 Please login to Vercel..."
    vercel login
    if [ $? -ne 0 ]; then
        echo "❌ Vercel login failed"
        exit 1
    fi
fi

# Build the project
echo "🔨 Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --yes
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel Dashboard"
echo "2. Add environment variable: VITE_API_URL = https://alfa-salaray-app.onrender.com/api"
echo "3. Redeploy if needed"
echo "4. Test your live application!"
echo ""
echo "🎉 Your Employee Management System is now live on Vercel!"
echo "🔗 Check your Vercel dashboard for the deployment URL"




