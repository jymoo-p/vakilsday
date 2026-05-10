#!/bin/bash

echo "🚀 Starting VakilsDay Local Development"
echo "======================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found!"
    echo "   Run: cp .env.local.example .env.local"
    echo "   Then edit .env.local with your Google credentials"
    exit 1
fi

# Check if Google credentials are set
if grep -q "PASTE_YOUR_CLIENT_ID_HERE" .env.local; then
    echo "⚠️  Warning: Google OAuth credentials not set in .env.local"
    echo ""
    echo "📋 Follow these steps:"
    echo "   1. Go to: https://console.cloud.google.com/apis/credentials"
    echo "   2. Copy your Client ID and Client Secret"
    echo "   3. Edit .env.local and paste the values"
    echo "   4. Add http://localhost:3000/api/auth/callback/google to redirect URIs"
    echo ""
    read -p "Press Enter once you've updated .env.local (or Ctrl+C to exit)..."
fi

echo "✅ Environment check passed"
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🌐 Starting Next.js development server..."
echo "   App will be available at: http://localhost:3000"
echo ""
echo "📊 Watch this terminal for detailed error logs!"
echo "======================================="
echo ""

npm run dev
