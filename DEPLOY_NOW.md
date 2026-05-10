# 🚀 Deploy VakilsDay to Vercel Now

## Quick Start (20 minutes to live site)

You're ready to deploy! Follow these steps exactly.

---

## Step 1: Push to GitHub (2 minutes)

```bash
# Add all files
git add .

# Commit
git commit -m "Add multi-tenant architecture and Vercel deployment"

# Push
git push origin main
```

**Verify:** Check GitHub - all files should be there

---

## Step 2: Deploy to Vercel (3 minutes)

1. **Go to:** https://vercel.com/new
2. **Sign in** with GitHub
3. **Import repository:** Find `vakilsday` and click Import
4. **Configure:**
   - Framework: Next.js (auto-detected) ✅
   - Root Directory: `./` (default) ✅
   - Build Command: `npm run build` (default) ✅
5. **Click Deploy** (will fail - that's okay!)
6. **Note your URL:** `https://vakilsday-abc123.vercel.app`

---

## Step 3: Create Database (3 minutes)

1. In Vercel dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Configure:
   - Name: `vakilsday-db`
   - Region: `sin1` (Singapore - closest to India)
5. Click **Create**
6. Click **Connect Project** → Select your project → Connect

**Result:** Environment variables auto-added ✅

---

## Step 4: Add Environment Variables (4 minutes)

Go to: **Settings → Environment Variables**

### Add These One by One:

#### 1. DATABASE_URL
```
Name: DATABASE_URL
Value: ${POSTGRES_PRISMA_URL}
Environments: Production ✅ Preview ✅ Development ✅
```

#### 2. NEXTAUTH_SECRET
Generate first:
```bash
openssl rand -base64 32
```

Then add:
```
Name: NEXTAUTH_SECRET
Value: <paste-generated-secret-here>
Environments: Production ✅ Preview ✅ Development ✅
```

#### 3. NEXTAUTH_URL
```
Name: NEXTAUTH_URL
Value: https://your-app-name.vercel.app
Environments: Production ✅ Preview ✅ Development ✅
```
(Use the URL from Step 2)

#### 4. GOOGLE_CLIENT_ID (Placeholder)
```
Name: GOOGLE_CLIENT_ID
Value: placeholder
Environments: Production ✅ Preview ✅ Development ✅
```

#### 5. GOOGLE_CLIENT_SECRET (Placeholder)
```
Name: GOOGLE_CLIENT_SECRET
Value: placeholder
Environments: Production ✅ Preview ✅ Development ✅
```

**Click Save** after each variable

---

## Step 5: Redeploy (2 minutes)

1. Go to **Deployments** tab
2. Click **"..."** menu on latest deployment
3. Click **Redeploy**
4. **Uncheck** "Use existing Build Cache"
5. Click **Redeploy**
6. Wait for build to complete (~2 min)

**Result:** Build should succeed now ✅

---

## Step 6: Set Up Database (3 minutes)

### Install Vercel CLI:
```bash
npm install -g vercel
```

### Login and pull environment:
```bash
vercel login
# Follow the prompts

cd /Users/jputhiyottil/personal/vakilsday
vercel env pull .env.production
```

### Run migrations:
```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy
```

**Result:** Database tables created ✅

---

## Step 7: Configure Google OAuth (5 minutes)

### 7.1 Get Your Credentials

Go to: https://console.cloud.google.com/apis/credentials

**Option A: Use Existing OAuth Client**
- Click your existing OAuth client
- Note your Client ID and Secret

**Option B: Create New OAuth Client**
1. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
2. Application type: **Web application**
3. Name: **VakilsDay Production**
4. Authorized redirect URIs:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
5. Click **CREATE**
6. Copy Client ID and Secret

### 7.2 Update Vercel Environment Variables

Go to: **Settings → Environment Variables**

Update these two:
```
GOOGLE_CLIENT_ID = <your-actual-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-<your-actual-secret>
```

Click **Save** for each

### 7.3 Redeploy One More Time
Go to **Deployments** → Click **"..."** → **Redeploy**

---

## Step 8: Test! 🎉 (3 minutes)

Visit: `https://your-app-name.vercel.app`

### Test Flow:
1. ✅ See landing page (not redirect)
2. ✅ Click "Sign In with Google"
3. ✅ Complete Google OAuth
4. ✅ See onboarding form
5. ✅ Fill: Firm name "Test Law Firm"
6. ✅ Click "Create My Workspace"
7. ✅ Land on Dashboard as ADMIN
8. ✅ Sign out
9. ✅ Sign back in
10. ✅ Should skip onboarding → Go to dashboard

**If all 10 steps work: You're LIVE! 🚀**

---

## Verify Database

Check data was created:

```bash
# Connect to production database
vercel postgres connect

# Or use Prisma Studio
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma studio
```

Look for:
- Organizations table has your test firm
- Users table has your account with organizationId
- Your role is ADMIN

---

## 🎯 You're Done!

### Your Live App:
```
https://your-app-name.vercel.app
```

### Share with Others:
Anyone can now:
1. Visit your URL
2. Sign in with Google
3. Create their own law firm
4. Start using VakilsDay

### Next Steps:

**Later (when ready):**
- Add custom domain (see VERCEL_DEPLOYMENT.md)
- Update OAuth redirect for custom domain
- Share with beta users

**For now:**
- Test all features
- Create some cases
- Verify everything works

---

## 🐛 Quick Troubleshooting

### Build fails?
- Check: `postinstall` script in package.json ✅ (already added)
- Try: Redeploy without cache

### OAuth error?
- Check: Redirect URI in Google Console matches exactly
- Format: `https://your-app.vercel.app/api/auth/callback/google`
- No trailing slash
- Wait 5 minutes after changes

### Can't connect to database?
- Use: `${POSTGRES_PRISMA_URL}` not `${POSTGRES_URL}`
- Check: DATABASE_URL variable exists

### Tables don't exist?
- Run: `npx prisma migrate deploy` (Step 6)
- Or: Run SQL manually in Vercel Storage → Query

---

## 📁 Files You Created

All ready for deployment:
- ✅ Multi-tenant architecture
- ✅ Public landing page
- ✅ Onboarding flow
- ✅ Organization isolation
- ✅ Updated package.json
- ✅ Vercel-ready database schema

---

## 💰 Cost

**Free Tier Includes:**
- ✅ Hosting (unlimited)
- ✅ Postgres (256 MB / ~5,000 rows)
- ✅ SSL certificate
- ✅ 100 GB bandwidth/month
- ✅ 1 custom domain (when you add it)

**Perfect for testing and MVP! 🎉**

---

## Commands Reference

```bash
# Deploy to Vercel
git push origin main  # Auto-deploys

# Pull environment variables
vercel env pull .env.production

# Run migrations on production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma migrate deploy

# View production database
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma studio

# View logs
vercel logs

# Deploy manually
vercel --prod
```

---

## ✅ Deployment Checklist

- [ ] Step 1: Pushed to GitHub
- [ ] Step 2: Imported to Vercel
- [ ] Step 3: Created Postgres DB
- [ ] Step 4: Added environment variables
- [ ] Step 5: Redeployed with env vars
- [ ] Step 6: Ran database migrations
- [ ] Step 7: Configured Google OAuth
- [ ] Step 8: Tested successfully
- [ ] 🎉 App is LIVE!

---

**Ready? Start with Step 1! 🚀**

Each step takes 2-5 minutes. You'll have a live app in ~20 minutes!

---

**Need help?** Check these docs:
- `deploy-checklist.md` - Quick reference
- `VERCEL_DEPLOYMENT.md` - Detailed guide
- `GETTING_STARTED.md` - Full setup guide

**Questions?** Let me know at which step you are!
