#!/bin/bash

# VakilsDay - Migration from Tokyo to Mumbai
# This script will backup Tokyo data and restore to Mumbai

echo "🚀 VakilsDay Migration: Tokyo → Mumbai"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Tokyo Database (OLD)
TOKYO_HOST="aws-1-ap-northeast-1.pooler.supabase.com"
TOKYO_PORT="6543"
TOKYO_USER="postgres.taempsyeiibwobtkqjxd"
TOKYO_PASS="JuryActive@2026"
TOKYO_DB="postgres"

# Mumbai Database (NEW)
MUMBAI_HOST="aws-1-ap-south-1.pooler.supabase.com"
MUMBAI_PORT="6543"
MUMBAI_USER="postgres.ypcwimvdxjfzejmjfqcp"
MUMBAI_PASS="JuryActive@2026"
MUMBAI_DB="postgres"

echo -e "${BLUE}Step 1: Checking Mumbai connection details...${NC}"
if [[ "$MUMBAI_HOST" == "YOUR_MUMBAI_HOST" ]]; then
    echo -e "${RED}❌ Please update MUMBAI_HOST, MUMBAI_USER, and MUMBAI_PASS in this script first!${NC}"
    echo ""
    echo "To get these values:"
    echo "1. Go to Supabase Dashboard → Your Mumbai project"
    echo "2. Settings → Database → Connection String (Transaction pooler)"
    echo "3. Copy the values and update this script"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Mumbai details configured${NC}"
echo ""

# Step 2: Backup Tokyo data
echo -e "${BLUE}Step 2: Backing up Tokyo database...${NC}"
BACKUP_FILE="vakilsday-backup-$(date +%Y%m%d-%H%M%S).sql"

# Use PostgreSQL 17 tools
PGPASSWORD="$TOKYO_PASS" /opt/homebrew/opt/postgresql@17/bin/pg_dump \
    -h "$TOKYO_HOST" \
    -p "$TOKYO_PORT" \
    -U "$TOKYO_USER" \
    -d "$TOKYO_DB" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "  Size: $BACKUP_SIZE"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

echo ""

# Step 3: Create schema in Mumbai (without data)
echo -e "${BLUE}Step 3: Creating schema in Mumbai...${NC}"
echo "This will run the schema migration SQL..."
echo ""
echo -e "${GREEN}✓ Schema SQL ready (you'll run this in Supabase SQL Editor)${NC}"
echo ""

# Step 4: Restore data to Mumbai
echo -e "${BLUE}Step 4: Ready to restore data to Mumbai${NC}"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "1. Go to Supabase SQL Editor (Mumbai project)"
echo "2. Run the schema creation SQL (from supabase-migration.sql)"
echo "3. Run the performance indexes SQL"
echo "4. Then come back and press ENTER to restore data"
echo ""
read -p "Press ENTER when schema is ready in Mumbai..."

echo ""
echo -e "${BLUE}Restoring data to Mumbai...${NC}"

# Use PostgreSQL 17 tools
PGPASSWORD="$MUMBAI_PASS" /opt/homebrew/opt/postgresql@17/bin/psql \
    -h "$MUMBAI_HOST" \
    -p "$MUMBAI_PORT" \
    -U "$MUMBAI_USER" \
    -d "$MUMBAI_DB" \
    < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Data restored successfully!${NC}"
else
    echo -e "${RED}❌ Restore failed! Check errors above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.local with Mumbai connection string"
echo "2. Update Vercel environment variables"
echo "3. Test the application"
echo "4. Keep backup file: $BACKUP_FILE"
echo ""
