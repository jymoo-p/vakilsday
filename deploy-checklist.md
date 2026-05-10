# Quick Vercel Deployment Checklist

## ✅ Pre-Deployment (5 minutes)

### 1. Commit and Push Code
```bash
git status
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## 🚀 Vercel Setup (10 minutes)

### 2. Deploy to Vercel
1. Go to: https://vercel.com/new
2. Import your GitHub repository: `vakilsday`
3. Click **Deploy** (it will fail - that's okay!)

### 3. Create Postgres Database
1. Go to: https://vercel.com/dashboard
2. Select your project → **Storage** tab
3. Click **Create Database** → Choose **Postgres**
4. Name: `vakilsday-db`
5. Region: Choose closest (e.g., `sin1` for Singapore)
6. Click **Create** → Click **Connect Project**

---

## 🔧 Environment Variables (5 minutes)

Go to: **Project Settings → Environment Variables**

### Add These Variables:

#### 1. Database (Should Auto-Populate)
✅ `POSTGRES_PRISMA_URL` - Already added by Vercel
✅ Add: `DATABASE_URL` = `${POSTGRES_PRISMA_URL}`

#### 2. NextAuth Secret
Generate:
```bash
openssl rand -base64 32
```
Add:
- Name: `NEXTAUTH_SECRET`
- Value: `<paste generated secret>`

#### 3. NextAuth URL (Update After First Deploy)
- Name: `NEXTAUTH_URL`
- Value: `https://your-app-name.vercel.app` (Get this from deployment)

#### 4. Google OAuth (Placeholder for Now)
- Name: `GOOGLE_CLIENT_ID`
- Value: `placeholder`

- Name: `GOOGLE_CLIENT_SECRET`
- Value: `placeholder`

**For all variables:** Select Production + Preview + Development

---

## 🔄 Redeploy with Variables

1. Go to: **Deployments** tab
2. Click **"..."** on latest deployment → **Redeploy**
3. Uncheck "Use existing Build Cache"
4. Click **Redeploy**

---

## 🗄️ Run Database Migrations

### Option A: Using Vercel CLI (Recommended)

Install CLI:
```bash
npm install -g vercel
```

Login and pull env:
```bash
vercel login
vercel env pull .env.production
```

Run migrations:
```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy
```

### Option B: Manual SQL in Vercel Dashboard

1. Go to: **Storage → Your Postgres DB → Query**
2. Run this SQL:

```sql
-- Create organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "subscriptionTier" TEXT DEFAULT 'FREE',
  "maxUsers" INTEGER DEFAULT 5,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMP,
  "image" TEXT,
  "role" TEXT DEFAULT 'ASSOCIATE',
  "organizationId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create cases table (if not exists)
CREATE TABLE IF NOT EXISTS "cases" (
  "id" TEXT PRIMARY KEY,
  "caseNumber" TEXT NOT NULL,
  "courtName" TEXT NOT NULL,
  "courtNumber" TEXT,
  "petitionerName" TEXT NOT NULL,
  "respondentName" TEXT NOT NULL,
  "judgeName" TEXT,
  "opposingCounselName" TEXT,
  "opposingCounselPhone" TEXT,
  "status" TEXT DEFAULT 'ACTIVE',
  "filingDate" TIMESTAMP NOT NULL,
  "nextHearingDate" TIMESTAMP,
  "synopsis" TEXT,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Add organizationId columns if missing
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_organizationId_idx" ON "users"("organizationId");
CREATE INDEX IF NOT EXISTS "cases_organizationId_idx" ON "cases"("organizationId");
CREATE INDEX IF NOT EXISTS "cases_nextHearingDate_idx" ON "cases"("nextHearingDate");
CREATE INDEX IF NOT EXISTS "cases_status_idx" ON "cases"("status");

-- Update case number constraint
ALTER TABLE "cases" DROP CONSTRAINT IF EXISTS "cases_caseNumber_key";
ALTER TABLE "cases" ADD CONSTRAINT "cases_caseNumber_organizationId_key" 
  UNIQUE ("caseNumber", "organizationId");

-- Create other tables (accounts, sessions, etc.)
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  UNIQUE("provider", "providerAccountId")
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  UNIQUE("identifier", "token")
);
```

3. Click **Execute**

---

## 🔐 Set Up Google OAuth

### 1. Get Your Vercel URL
After deployment, note your URL (e.g., `vakilsday-abc123.vercel.app`)

### 2. Update Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth Client ID (or create new one)
3. Add redirect URI:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
4. Save and wait 5 minutes

### 3. Update Vercel Environment Variables
Go back to Vercel → Settings → Environment Variables

Update these:
- `GOOGLE_CLIENT_ID` = `<your-id>.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET` = `GOCSPX-<your-secret>`
- `NEXTAUTH_URL` = `https://your-app-name.vercel.app`

### 4. Redeploy Again
Go to Deployments → Redeploy

---

## ✅ Test Your Deployment

Visit: `https://your-app-name.vercel.app`

Test:
- [ ] Landing page loads
- [ ] Click "Sign In with Google"
- [ ] Complete Google OAuth
- [ ] See onboarding form
- [ ] Fill: Firm name "Test Law Firm"
- [ ] Submit and reach dashboard
- [ ] Sign out and sign back in
- [ ] Should skip onboarding (go to dashboard)

---

## 🔍 Verify Database

### Check Tables Exist
In Vercel Dashboard → Storage → Query:
```sql
SELECT * FROM organizations;
SELECT * FROM users;
```

Should show your test data.

---

## 🐛 Troubleshooting

### Build fails
- Check build logs in Vercel
- Ensure `postinstall` script in package.json
- Try: Redeploy without build cache

### OAuth error "redirect_uri_mismatch"
- Exact URL in Google Console
- No trailing slash
- HTTPS (not HTTP)
- Wait 5 minutes after changes

### Database connection error
- Use `POSTGRES_PRISMA_URL` not `POSTGRES_URL`
- Ensure DATABASE_URL references it correctly

### "Cannot find tables"
- Run migrations (see step above)
- Check SQL executed successfully

---

## 📊 Summary

| Step | Status |
|------|--------|
| Code pushed to GitHub | ⬜ |
| Imported to Vercel | ⬜ |
| Postgres database created | ⬜ |
| Environment variables added | ⬜ |
| Redeployed with env vars | ⬜ |
| Migrations run | ⬜ |
| Google OAuth configured | ⬜ |
| Vercel env vars updated | ⬜ |
| Final redeploy | ⬜ |
| Tested successfully | ⬜ |

---

## 🎯 After Deployment

Your app will be live at:
```
https://your-app-name.vercel.app
```

### Add Custom Domain Later:
1. Buy domain
2. Go to Vercel → Domains → Add
3. Configure DNS
4. Update NEXTAUTH_URL and Google OAuth

---

**Estimated Time:** 20 minutes total
**Cost:** $0 (Free tier)

Good luck! 🚀
