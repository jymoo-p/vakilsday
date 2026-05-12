# VakilsDay Setup Guide

## Part 1: Supabase PostgreSQL Setup (5 minutes)

### Step 1: Get Supabase Connection Strings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select or create project: `vakilsday`
3. Navigate to: **Settings** (⚙️) → **Database**
4. Scroll to **Connection string** section
5. Copy both URLs:

   **a) Connection pooling** (for runtime):
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

   **b) Direct connection** (for migrations):
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

6. If you don't have the password, click **"Reset Database Password"**

### Step 2: Update Local Environment

1. Open `.env.local` in your editor
2. Update these lines:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...5432/postgres"
   ```

### Step 3: Run Migration

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema to Supabase (creates all tables)
npx prisma db push
```

### Step 4: Verify

```bash
# Open Prisma Studio to see your cloud database
npx prisma studio
```

You should see all tables in your Supabase database!

---

## Part 2: Google Drive Integration Setup (10 minutes)

### Step 1: Update Google OAuth Scopes

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Navigate to: **APIs & Services** → **Credentials**
4. Click your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, ensure you have:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://vakilsday.vercel.app/api/auth/callback/google` (production)

### Step 2: Enable Google Drive API

1. In Google Cloud Console
2. Go to: **APIs & Services** → **Library**
3. Search for "Google Drive API"
4. Click **Enable**

### Step 3: Test Locally

```bash
# Start dev server
npm run dev
```

### Step 4: Test Upload Flow

1. Sign in with Google (you'll see Drive permission request)
2. Create a test case
3. Upload a document
4. Check your Google Drive → You'll see a "VakilsDay" folder!

---

## Part 3: Deploy to Vercel

### Step 1: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to: **Settings** → **Environment Variables**
4. Add these variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `DATABASE_URL` | Your pooling URL | Production, Preview, Development |
   | `DIRECT_URL` | Your direct URL | Production, Preview, Development |
   | `NEXTAUTH_URL` | `https://vakilsday.vercel.app` | Production |
   | `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | All |
   | `GOOGLE_CLIENT_ID` | From Google Console | All |
   | `GOOGLE_CLIENT_SECRET` | From Google Console | All |

### Step 2: Deploy

```bash
# Commit changes
git add .
git commit -m "Add Supabase database and Google Drive integration"

# Push to GitHub (triggers Vercel deploy)
git push origin main
```

### Step 3: Run Migration on Production

After deployment, run migration on your production database:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.production
npx prisma migrate deploy
```

Or simply use the DIRECT_URL in your production environment and run:
```bash
npx prisma db push
```

---

## Architecture Overview

### Database (Supabase PostgreSQL)
- **Stores:** User accounts, cases, hearings, clients, metadata
- **Size:** ~5 MB per 200 cases
- **Cost:** FREE (500 MB limit)

### File Storage (Google Drive BYOS)
- **Stores:** PDF documents, evidence files, scanned documents
- **Location:** Admin's Google Drive
- **Structure:** `VakilsDay/Case_XXX/documents...`
- **Sharing:** Auto-shared with all team members (R/W access)
- **Cost:** FREE (uses admin's Drive quota)

### How It Works

1. **Admin signs in** → Google OAuth with Drive permission
2. **Admin uploads document** → Saved to admin's Drive
3. **Folder created:** `Google Drive/VakilsDay/Case_001_RamVsShyam/`
4. **Auto-shared** with all team members
5. **Team can access** via app or directly in Google Drive
6. **Database stores:** Only metadata (file ID, name, size)

---

## Testing Checklist

- [ ] Sign in with Google
- [ ] Create organization
- [ ] Add team member
- [ ] Create case
- [ ] Upload document (check Google Drive)
- [ ] Team member can view document
- [ ] Download document
- [ ] Delete document (check Google Drive)

---

## Troubleshooting

### "No Google Drive access" error
- **Fix:** Sign out and sign in again to grant Drive permission

### "Organization admin not found"
- **Fix:** Ensure you created an organization during onboarding

### Migration fails
- **Fix:** Check DIRECT_URL is correct (port 5432, not 6543)

### Document upload fails
- **Fix:** Ensure Google Drive API is enabled in Google Cloud Console

---

## Next Steps

1. ✅ Database → Cloud (Supabase)
2. ✅ Files → Google Drive (BYOS)
3. 🎯 Test with real users
4. 📈 Monitor usage
5. 💰 Start charging customers!

---

## Support

- **Database Issues:** Check Supabase logs
- **Drive Issues:** Check Google Cloud Console logs
- **Deployment Issues:** Check Vercel logs

---

**You're all set!** 🎉

Your app now:
- Stores data in the cloud (Supabase)
- Uses Google Drive for files (zero storage cost)
- Scales to 1,000+ law firms
- Costs $0/month to run
