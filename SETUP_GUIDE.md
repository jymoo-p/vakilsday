# VakilsDay Setup Guide

## Quick Start: Step-by-Step Guide to Run Locally After Downloading the Repo

This guide is written so **anyone (even with zero technical background)** can download the code onto a new computer and run it locally using the **exact same database as the live production website**, without breaking production when checking in files.

---

### Step 1: Open the Project in Your Terminal

1. Download or clone the repository onto your computer (for example, into `C:\Files\dev_projects\vakilsday` on Windows or `~/vakilsday` on Mac).
2. Open **VS Code** (or Cursor), click **File → Open Folder**, and select the `vakilsday` folder.
3. Open the built-in Terminal inside your editor:
   - **Windows:** Press `` Ctrl + ` `` (the key above Tab) or click **Terminal → New Terminal** in the top menu.
   - **Mac:** Press `` Cmd + ` `` or click **Terminal → New Terminal** in the top menu.

---

### Step 2: Install Required Software Packages

In the terminal window at the bottom of your screen, type the following command and press **Enter**:

```bash
npm install
```

- **What this does:** Downloads all the building blocks the app needs to run.
- **Wait until:** It finishes scrolling and gives you your typing prompt back (takes 1–2 minutes).

---

### Step 3: Get Your Database & Firebase Keys (Where to Find Them)

To connect your local computer to the live production database and Google Sign-In, you need the secret connection values. **Never type real passwords into files that get uploaded to GitHub.** Instead, grab them from your Vercel Dashboard (easiest — everything is in one place!):

#### Option A: Copy Everything from Vercel Dashboard (Recommended & Easiest)
1. Open your browser and go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and log in.
2. Click on your **`vakilsday`** project.
3. Click **Settings** (in the top navigation bar).
4. Click **Environment Variables** (in the left sidebar).
5. Here you will see all the keys already used by production. Click the **eye icon (👁️)** next to each one to reveal and copy its value:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Option B: If You Need the Database Password Directly from Supabase
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and log in.
2. Click on your Mumbai project (project ID: `ypcwimvdxjfzejmjfqcp`).
3. Click **Project Settings (⚙️ icon at the bottom left)** → **Database**.
4. Scroll down to **Connection string** → Select **URI**.
5. Copy the connection string.
   - *Forgot the database password?* Under **Database password** on that same page, you can view or reset it (note: resetting it in Supabase means you must also update `DATABASE_URL` in Vercel!).

#### ⚠️ Super Important Rule About Special Characters in Passwords (`@` → `%40`)
If your database password has an `@` symbol in it (for example, `MyPass@2026`), the computer gets confused because `@` is also used to separate the password from the server address.
- **You MUST replace `@` inside the password with `%40`** when pasting it into `DATABASE_URL` and `DIRECT_URL`.
- **Example:**
  - ❌ **Wrong:** `postgresql://postgres.ypcwimvdxjfzejmjfqcp:MyPass@2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`
  - ✅ **Right:** `postgresql://postgres.ypcwimvdxjfzejmjfqcp:MyPass%402026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`

---

### Step 4: Create File #1 — `.env.local` (Used by the Website Locally)

1. In the left sidebar of VS Code (the File Explorer), look for a file named **`.env.local`**.
   - If it does not exist, right-click in the empty space of the file list → click **New File** → name it exactly `.env.local` (keep the dot at the beginning!).
2. Open `.env.local`, delete anything inside it, and paste the following template:

```env
# 1. Supabase PostgreSQL Connection Strings (Mumbai Production DB)
# Notice port 6543 for DATABASE_URL, and port 5432 for DIRECT_URL.
# Replace [YOUR_URL_ENCODED_PASSWORD] with the real password (remember: change @ to %40!)
DATABASE_URL="postgresql://postgres.ypcwimvdxjfzejmjfqcp:[YOUR_URL_ENCODED_PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.ypcwimvdxjfzejmjfqcp:[YOUR_URL_ENCODED_PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# 2. Local Website URL (Keep this as localhost:3000 so local login stays on your computer)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-dev-secret-key-vakilsday-2026"

# 3. Firebase Client Configuration (for Google Sign-In)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyBvFO_f_iG-gGrxe9_EmSBX5cxBdmuIciQ"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="vakilsday-648d1.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="vakilsday-648d1"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="vakilsday-648d1.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="218036196937"
NEXT_PUBLIC_FIREBASE_APP_ID="1:218036196937:web:9eab88dcdc7f0a1ada1198"
```

3. Replace `[YOUR_URL_ENCODED_PASSWORD]` on both lines with your actual password (with `@` written as `%40`).
4. Save the file (**Ctrl + S** on Windows, **Cmd + S** on Mac).

---

### Step 5: Create File #2 — `.env` (Used by the Database Helper Tool)

Why a second file? The website (`Next.js`) reads `.env.local`, but the database helper tool (`Prisma`) only reads a file named `.env`. Having both ensures everything works smoothly.

1. In the left sidebar of VS Code, right-click in the file list → click **New File** → name it exactly **`.env`** (just `.env`, with the dot in front).
2. Paste the exact same two `DATABASE_URL` and `DIRECT_URL` lines from Step 4 into `.env`:

```env
DATABASE_URL="postgresql://postgres.ypcwimvdxjfzejmjfqcp:[YOUR_URL_ENCODED_PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.ypcwimvdxjfzejmjfqcp:[YOUR_URL_ENCODED_PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

3. Save the file (**Ctrl + S** on Windows, **Cmd + S** on Mac).

---

### Step 6: Prepare the Database Connector

In your terminal window, type this command and press **Enter**:

```bash
npx prisma generate
```

- **What you should see:** `✔ Generated Prisma Client`
- If it shows an error about `DATABASE_URL not found`, double-check that you saved the `.env` file in Step 5 in the main `vakilsday` folder.

---

### Step 7: Start the Website on Your Computer!

In your terminal window, type this command and press **Enter**:

```bash
npm run dev
```

1. Wait a few seconds until you see:
   `Ready in ...` and `Local: http://localhost:3000`
2. Open your web browser (Chrome, Edge, Safari) and go to:
   **[http://localhost:3000](http://localhost:3000)**
3. You are now running the app on your computer, connected live to the production database!
4. **To stop the server later:** Click inside the terminal and press **Ctrl + C**.

---

### Step 8: How Checking In Code Works Safely (Why Production Won't Break)

This project has a file called **`.gitignore`** which tells Git which files to **never upload** to GitHub.
- Both `.env` and `.env.local` are listed in `.gitignore` (under `.env*` and `.env*.local`).
- Notice in VS Code that `.env` and `.env.local` appear **grayed out** in the file list — that means Git is ignoring them!
- When you commit and push your code changes to GitHub:
  1. Your local `.env` and `.env.local` stay only on your computer.
  2. Vercel automatically builds your new code using the production settings stored in the Vercel Dashboard.
  3. Production continues running seamlessly without ever seeing your `localhost:3000` settings.

---

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
