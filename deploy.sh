#!/bin/bash

# JourneyBoard Deployment Script
echo "🚀 JourneyBoard Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the JourneyBoard root directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found. Please create it with your environment variables."
    exit 1
fi

echo "✅ Environment file found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run build
echo "🔨 Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Push your code to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Ready for deployment'"
    echo "   git push origin main"
    echo ""
    echo "2. Deploy to Vercel:"
    echo "   - Go to https://vercel.com"
    echo "   - Import your GitHub repository"
    echo "   - Add environment variables from .env.local"
    echo "   - Click Deploy"
    echo ""
    echo "3. Configure Firebase:"
    echo "   - Add your Vercel domain to Firebase Auth"
    echo "   - Update Firestore rules if needed"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Build failed. Please fix the errors above."
    exit 1
fi 