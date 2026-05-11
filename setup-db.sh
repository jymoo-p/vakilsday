#!/bin/bash

# Simple PostgreSQL setup for local development
echo "Setting up local PostgreSQL database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first:"
    echo "  brew install postgresql@14"
    exit 1
fi

# Start PostgreSQL service if not running
brew services start postgresql@14 2>/dev/null || brew services start postgresql

# Create database
psql postgres -c "CREATE DATABASE vakilsday;" 2>/dev/null || echo "Database already exists"

# Create a simple .env.local file
cat > .env.local << 'ENVFILE'
DATABASE_URL="postgresql://postgres@localhost:5432/vakilsday?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
ENVFILE

echo "✓ Database created"
echo "✓ .env.local created"
echo ""
echo "Now run: npx prisma db push"
