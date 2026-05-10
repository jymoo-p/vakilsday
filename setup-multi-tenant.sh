#!/bin/bash

echo "🚀 Setting up Multi-Tenant Architecture..."
echo ""

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma client with new schema..."
npx prisma generate

if [ $? -ne 0 ]; then
  echo "❌ Prisma generate failed. Please check the schema."
  exit 1
fi

echo "✅ Prisma client generated"
echo ""

# Step 2: Create Migration
echo "🗄️  Creating database migration..."
npx prisma migrate dev --name add_organizations

if [ $? -ne 0 ]; then
  echo "❌ Migration failed. Please check the schema and database connection."
  exit 1
fi

echo "✅ Migration created successfully"
echo ""

# Step 3: Success message
echo "🎉 Multi-tenant setup complete!"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Sign in with Google"
echo "4. Create your law firm workspace"
echo ""
echo "Check MULTI_TENANT_IMPLEMENTATION.md for full details."
