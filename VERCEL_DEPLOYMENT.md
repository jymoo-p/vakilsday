# Deploy VakilsDay to Vercel

## Overview

This guide will help you deploy VakilsDay to Vercel with:
- ✅ Vercel Postgres (managed database)
- ✅ Vercel hosting
- ✅ Temporary Vercel URL (your-app.vercel.app)
- ✅ Custom domain support (add later)

**Time:** 15-20 minutes

---

## Prerequisites

- GitHub account
- Vercel account (free: https://vercel.com/signup)
- Google Cloud Console access (for OAuth)

---

## Step 1: Prepare Your Repository

### 1.1 Commit All Changes

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Add multi-tenant architecture with onboarding"

# Push to GitHub
git push origin main
```

### 1.2 Create `.vercelignore` (Optional)

Create file to exclude from deployment:
```bash
cat > .vercelignore << 'EOF'
.env
.env.*
!.env.example
node_modules
*.log
.next
EOF
```

---

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `vakilsday` repository
4. Click **"Import"**

### 2.2 Configure Project Settings

**Framework Preset:** Next.js (auto-detected)
**Root Directory:** `./` (leave default)
**Build Command:** `npm run build` (default)
**Output Directory:** `.next` (default)

Click **"Deploy"** (without environment variables for now - it will fail, that's okay)

---

## Step 3: Set Up Vercel Postgres

### 3.1 Create Database

1. Go to your project dashboard on Vercel
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Database name: `vakilsday-db`
6. Region: Choose closest to your users (e.g., `us-east-1` for India: Singapore `sin1`)
7. Click **"Create"**

### 3.2 Connect Database to Project

1. Vercel will show connection details
2. Click **"Connect Project"**
3. Select your `vakilsday` project
4. Click **"Connect"**

This automatically adds these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` ← Use this one
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

---

## Step 4: Update Environment Variables

### 4.1 In Vercel Dashboard

Go to: **Settings → Environment Variables**

Add these variables:

#### 4.1.1 Database (Already Added by Vercel)
```
POSTGRES_PRISMA_URL = postgres://default:xxx@xxx.vercel-storage.com:5432/verceldb
```
**Note:** This is automatically added when you connected the database

#### 4.1.2 Update DATABASE_URL
Vercel adds `POSTGRES_PRISMA_URL` but Prisma needs `DATABASE_URL`:

**Option A:** Add new variable
```
DATABASE_URL = ${POSTGRES_PRISMA_URL}
```

**Option B:** Copy the POSTGRES_PRISMA_URL value directly

#### 4.1.3 NextAuth Configuration

**NEXTAUTH_URL**
```
NEXTAUTH_URL = https://your-app.vercel.app
```
(Replace `your-app` with your actual Vercel URL - you'll see this after first deploy)

**NEXTAUTH_SECRET**
Generate a new secret:
```bash
openssl rand -base64 32
```
Copy the output and add as environment variable:
```
NEXTAUTH_SECRET = <paste-generated-secret>
```

#### 4.1.4 Google OAuth (Temporary - Update After Deploy)
For now, add placeholder values:
```
GOOGLE_CLIENT_ID = placeholder
GOOGLE_CLIENT_SECRET = placeholder
```

**We'll update these after getting the Vercel URL**

#### 4.1.5 Supabase (Optional)
```
NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-key
```

### 4.2 Environment Variable Scopes

For each variable, select:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## Step 5: Update Prisma Schema for Vercel

Your schema already uses `@prisma/adapter-pg` which works with Vercel Postgres. No changes needed! ✅

---

## Step 6: Update Build Settings

### 6.1 Add Build Command to package.json

Ensure your `package.json` has:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  }
}
```

This ensures Prisma client is generated during build.

### 6.2 Create `vercel.json` (Optional)

Create file for custom config:
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

This runs migrations automatically on deploy.

---

## Step 7: Redeploy

1. Go to Vercel dashboard → Deployments
2. Click **"Redeploy"** on the latest deployment
3. Check "Use existing Build Cache" = OFF (first time)
4. Click **"Redeploy"**

The build should succeed now!

---

## Step 8: Run Database Migrations

### Option A: Using Vercel CLI (Recommended)

Install Vercel CLI:
```bash
npm i -g vercel
```

Login:
```bash
vercel login
```

Pull environment variables:
```bash
vercel env pull .env.production
```

Run migrations:
```bash
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### Option B: Using Dashboard SQL Editor

1. Go to Vercel Dashboard → Storage → Your Postgres DB
2. Click **"Query"** tab
3. Run this SQL manually:

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

-- Alter users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
CREATE INDEX IF NOT EXISTS "users_organizationId_idx" ON "users"("organizationId");

-- Alter cases table
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
CREATE INDEX IF NOT EXISTS "cases_organizationId_idx" ON "cases"("organizationId");

-- Update case number constraint
ALTER TABLE "cases" DROP CONSTRAINT IF EXISTS "cases_caseNumber_key";
ALTER TABLE "cases" ADD CONSTRAINT "cases_caseNumber_organizationId_key" 
  UNIQUE ("caseNumber", "organizationId");
```

---

## Step 9: Configure Google OAuth for Vercel

### 9.1 Get Your Vercel URL

After deployment, your URL will be:
```
https://vakilsday.vercel.app
```
(Or whatever name Vercel assigned)

### 9.2 Update Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, add:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
4. Click **"Save"**
5. Wait 5 minutes for changes to propagate

### 9.3 Update Vercel Environment Variables

Go back to Vercel → Settings → Environment Variables:

Update these:
```
GOOGLE_CLIENT_ID = <your-actual-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-<your-actual-secret>
NEXTAUTH_URL = https://your-app.vercel.app
```

### 9.4 Redeploy

Click **"Redeploy"** to apply new environment variables.

---

## Step 10: Test Your Deployment

### 10.1 Visit Your App
```
https://your-app.vercel.app
```

You should see:
- ✅ Landing page loads
- ✅ "Sign In with Google" button
- ✅ Can sign in with Google
- ✅ Onboarding form appears
- ✅ Can create organization
- ✅ Dashboard loads

### 10.2 Check Database

Using Vercel CLI:
```bash
vercel postgres connect
```

Or use Prisma Studio locally:
```bash
# Pull production DATABASE_URL
vercel env pull .env.production

# Connect to production DB
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma studio
```

---

## Step 11: Add Custom Domain (Optional - Do Later)

### When You're Ready:

1. **Buy domain** (e.g., from Namecheap, GoDaddy, Google Domains)

2. **Add to Vercel:**
   - Go to Project Settings → Domains
   - Click **"Add Domain"**
   - Enter: `vakilsday.com`
   - Follow DNS configuration instructions

3. **Update DNS Records:**
   Add these records at your domain registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Update Environment Variables:**
   ```
   NEXTAUTH_URL = https://vakilsday.com
   ```

5. **Update Google OAuth:**
   Add redirect URI:
   ```
   https://vakilsday.com/api/auth/callback/google
   ```

6. **Redeploy**

---

## Deployment Checklist

### Pre-Deploy
- [ ] Code committed to GitHub
- [ ] `.gitignore` includes `.env`
- [ ] `package.json` has build scripts

### Vercel Setup
- [ ] Repository imported to Vercel
- [ ] Postgres database created
- [ ] Database connected to project
- [ ] Environment variables added
- [ ] Initial deployment successful

### Database
- [ ] Migrations run successfully
- [ ] Tables created (organizations, users, cases)
- [ ] Can connect to database

### OAuth
- [ ] Vercel URL obtained
- [ ] Google redirect URI updated
- [ ] Google credentials added to Vercel
- [ ] Redeployed with new credentials

### Testing
- [ ] Landing page loads
- [ ] Google sign-in works
- [ ] Onboarding flow works
- [ ] Can create organization
- [ ] Dashboard accessible
- [ ] Database has data

### Custom Domain (Later)
- [ ] Domain purchased
- [ ] Added to Vercel
- [ ] DNS configured
- [ ] SSL certificate issued
- [ ] Environment variables updated
- [ ] OAuth redirect URI updated

---

## Common Issues

### Issue: Build fails with "Prisma generate error"
**Solution:** Make sure `postinstall` script is in package.json:
```json
"postinstall": "prisma generate"
```

### Issue: "Can't reach database server"
**Solution:** 
- Use `POSTGRES_PRISMA_URL` not `POSTGRES_URL`
- Make sure DATABASE_URL is set correctly

### Issue: OAuth redirect mismatch
**Solution:**
- Exact URL in Google Console: `https://your-app.vercel.app/api/auth/callback/google`
- No trailing slash
- HTTPS not HTTP
- Wait 5 minutes after changing

### Issue: "No organization" error
**Solution:** Run migrations on production database:
```bash
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy
```

---

## Useful Commands

```bash
# Vercel CLI
vercel login
vercel --prod                    # Deploy to production
vercel env pull                  # Pull environment variables
vercel logs                      # View logs
vercel domains                   # Manage domains

# Connect to production DB
vercel postgres connect

# Run migrations on production
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy

# View production database
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma studio
```

---

## Environment Variables Summary

Your production `.env` (stored in Vercel):

```env
# Database (auto-added by Vercel)
POSTGRES_PRISMA_URL="postgres://default:xxx@xxx.vercel-storage.com/verceldb"
DATABASE_URL="${POSTGRES_PRISMA_URL}"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="<generated-secret>"

# Google OAuth
GOOGLE_CLIENT_ID="<your-id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-<your-secret>"

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"
SUPABASE_SERVICE_ROLE_KEY="xxx"
```

---

## Migration Path

### Current: Local Development
```
Local Postgres (prisma dev) → localhost:3000
```

### Next: Vercel Production
```
Vercel Postgres → https://your-app.vercel.app
```

### Future: Custom Domain
```
Vercel Postgres → https://vakilsday.com
```

---

## Cost Estimate

### Vercel Free Tier (Hobby)
- ✅ Hosting: Free for personal projects
- ✅ Postgres: 256 MB free (5,000 rows approx)
- ✅ Bandwidth: 100 GB/month
- ✅ Custom domain: Free (SSL included)

### When to Upgrade (Pro: $20/month)
- More than 1 custom domain
- More database storage needed
- Team collaboration features
- Priority support

**For testing/MVP: Free tier is perfect! ✅**

---

## Next Steps

1. **Now:** Deploy to Vercel with temporary URL
2. **Test:** Verify all features work in production
3. **Later:** Add custom domain when ready
4. **Monitor:** Check Vercel analytics and logs

---

**Ready to deploy?** Follow the steps above and let me know if you hit any issues!
