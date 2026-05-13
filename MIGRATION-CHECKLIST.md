# Migration Checklist: Tokyo → Mumbai

## ✅ Pre-Migration Checklist

- [ ] Supabase Mumbai project created
- [ ] Mumbai connection strings obtained
- [ ] Backup script configured with Mumbai details
- [ ] Users notified (if any are using the app)

---

## 📋 Migration Steps

### Step 1: Create Mumbai Supabase Project

1. Go to: https://supabase.com/dashboard
2. Click: **New Project**
3. Fill in:
   - Name: `vakilsday-mumbai`
   - Password: (Choose strong password - SAVE IT!)
   - Region: **Mumbai (ap-south-1)** ⚠️
4. Click: **Create new project**
5. Wait 2-3 minutes

✅ **Mark complete when done:** _________________

---

### Step 2: Get Mumbai Connection Strings

1. Go to: **Project Settings** → **Database**
2. Find: **Connection String**
3. Select: **Transaction pooler** (port 6543)
4. Copy the full string, it looks like:
   ```
   postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

**Save these values:**
```
MUMBAI_HOST: aws-0-ap-south-1.pooler.supabase.com
MUMBAI_USER: postgres.[PROJECT_ID]
MUMBAI_PASS: [YOUR_PASSWORD]
```

✅ **Mark complete when done:** _________________

---

### Step 3: Update Migration Script

1. Open: `migration-to-mumbai.sh`
2. Replace these lines (around line 22-26):
   ```bash
   MUMBAI_HOST="YOUR_MUMBAI_HOST"
   MUMBAI_USER="YOUR_MUMBAI_USER"
   MUMBAI_PASS="YOUR_MUMBAI_PASSWORD"
   ```
   
   With your actual Mumbai values:
   ```bash
   MUMBAI_HOST="aws-0-ap-south-1.pooler.supabase.com"
   MUMBAI_USER="postgres.YOUR_PROJECT_ID"
   MUMBAI_PASS="your_actual_password"
   ```

3. Save the file

✅ **Mark complete when done:** _________________

---

### Step 4: Create Schema in Mumbai

1. Go to: Mumbai Supabase → **SQL Editor**
2. Run the **DROP** script first:

```sql
-- Drop all existing tables
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS research_bookmarks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS hearing_notes CASCADE;
DROP TABLE IF EXISTS hearings CASCADE;
DROP TABLE IF EXISTS case_assignments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS case_types CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS custom_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "AppointmentType" CASCADE;
DROP TYPE IF EXISTS "DocumentType" CASCADE;
DROP TYPE IF EXISTS "AppearingFor" CASCADE;
DROP TYPE IF EXISTS "CaseStatus" CASCADE;
DROP TYPE IF EXISTS "Gender" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
```

3. Then copy **ALL** content from `supabase-migration.sql` and run it

4. Then run the performance indexes:

```sql
CREATE INDEX IF NOT EXISTS "case_assignments_userId_idx" ON "case_assignments"("userId");
CREATE INDEX IF NOT EXISTS "case_assignments_caseId_idx" ON "case_assignments"("caseId");
CREATE INDEX IF NOT EXISTS "hearings_hearingDate_idx" ON "hearings"("hearingDate");
CREATE INDEX IF NOT EXISTS "cases_organizationId_status_idx" ON "cases"("organizationId", "status");
```

✅ **Mark complete when done:** _________________

---

### Step 5: Run Migration Script

1. Open Terminal
2. Navigate to project: `cd ~/personal/vakilsday`
3. Run: `./migration-to-mumbai.sh`
4. The script will:
   - Backup Tokyo data
   - Wait for you to confirm schema is ready
   - Restore data to Mumbai

✅ **Mark complete when done:** _________________

---

### Step 6: Update Environment Variables

**Local (.env.local):**

Update these values:
```env
DATABASE_URL="postgresql://postgres.[MUMBAI_ID]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

DIRECT_URL="postgresql://postgres.[MUMBAI_ID]:[PASSWORD]@db.[MUMBAI_ID].supabase.co:5432/postgres"
```

**Vercel Production:**

1. Go to: https://vercel.com/dashboard
2. Select: **vakilsday** project
3. Go to: **Settings** → **Environment Variables**
4. Update:
   - `DATABASE_URL` (new Mumbai pooler URL)
   - `DIRECT_URL` (new Mumbai direct URL)

✅ **Mark complete when done:** _________________

---

### Step 7: Deploy & Test

1. Commit changes:
   ```bash
   git add .env.local
   git commit -m "Update to Mumbai database connection"
   ```

2. Trigger Vercel redeployment (it will auto-deploy)

3. Wait 2 minutes

4. Test the app:
   - [ ] Login works
   - [ ] Dashboard loads fast
   - [ ] Cases load quickly
   - [ ] Calendar works
   - [ ] Can create new case
   - [ ] Can add hearing

✅ **Mark complete when done:** _________________

---

## 🎉 Post-Migration

- [ ] Speed test: Should be <1 second (vs 7-9 seconds before)
- [ ] Keep Tokyo backup file for 1 week
- [ ] Monitor for any issues for 24 hours
- [ ] Can delete Tokyo project after 1 week

---

## 🆘 Rollback Plan (If Needed)

If something goes wrong:

1. Change `.env.local` back to Tokyo connection
2. Update Vercel env vars back to Tokyo
3. Redeploy
4. App will work with Tokyo database again

---

## 📞 Support

If you encounter issues:
- Check Supabase logs: Mumbai project → Logs
- Check Vercel logs: Deployment → Runtime Logs
- Verify connection strings are correct
- Ensure password has special characters URL-encoded

---

**Current Status:** Ready to start migration

**Next Step:** Create Mumbai Supabase project (Step 1)
