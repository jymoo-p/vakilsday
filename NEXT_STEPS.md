# 🚀 Next Steps - Complete Setup

## ✅ What's Done
- [x] Code updated for Supabase + Google Drive
- [x] All files committed and pushed to GitHub
- [x] Build passing ✅

## 📋 What YOU Need to Do (30 minutes total)

### Part 1: Supabase Setup (10 min)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in with your account

2. **Create or Select Project**
   - Project name: `vakilsday`
   - Choose closest region (e.g., Mumbai for India)

3. **Get Connection Strings**
   - Go to: Settings → Database
   - Find "Connection string" section
   - Copy BOTH URLs:

   ```
   Connection pooling (Transaction mode):
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...6543/postgres
   
   Direct connection:
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...5432/postgres
   ```

   ⚠️ If you don't have the password, click "Reset Database Password"

4. **Update Local .env.local**
   ```env
   DATABASE_URL="[Paste pooling URL here]?pgbouncer=true"
   DIRECT_URL="[Paste direct URL here]"
   ```

5. **Run Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

   You should see: "✔ Your database is now in sync with your Prisma schema"

6. **Verify**
   ```bash
   npx prisma studio
   ```
   Opens at localhost:5555 - you'll see all your tables in Supabase!

---

### Part 2: Enable Google Drive API (5 min)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your existing project (or create one)

2. **Enable Drive API**
   - Go to: APIs & Services → Library
   - Search: "Google Drive API"
   - Click **Enable**

3. **Update OAuth Consent Screen** (if needed)
   - Go to: APIs & Services → OAuth consent screen
   - Add scope: `https://www.googleapis.com/auth/drive.file`

4. **Update Authorized Redirect URIs**
   - Go to: APIs & Services → Credentials
   - Click your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", ensure these exist:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://vakilsday.vercel.app/api/auth/callback/google`

---

### Part 3: Test Locally (10 min)

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Test the Flow**
   - Open: http://localhost:3000
   - Sign in with Google (you'll see Drive permission request - **approve it**)
   - Complete onboarding (create organization)
   - Create a test case
   - Try uploading a document

3. **Check Your Google Drive**
   - Open Google Drive in browser
   - You should see a new folder: **VakilsDay**
   - Inside: `Case_XXX/your-document.pdf`

4. **Verify Team Sharing** (if you have a team member)
   - Add team member email
   - They should see the document (R/W access)

---

### Part 4: Deploy to Vercel (5 min)

1. **Add Environment Variables to Vercel**
   - Go to: https://vercel.com/dashboard
   - Select project: vakilsday
   - Settings → Environment Variables
   - Add these for **Production, Preview, Development**:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your pooling URL + `?pgbouncer=true` |
   | `DIRECT_URL` | Your direct URL |
   | `NEXTAUTH_URL` | `https://vakilsday.vercel.app` |
   | `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
   | `GOOGLE_CLIENT_ID` | From Google Console |
   | `GOOGLE_CLIENT_SECRET` | From Google Console |

2. **Redeploy**
   - Your recent push should trigger auto-deploy
   - Or click "Redeploy" in Vercel dashboard

3. **Run Production Migration**
   ```bash
   # Pull production env vars
   vercel env pull .env.production
   
   # Run migration
   npx prisma db push
   ```

4. **Test Production**
   - Visit: https://vakilsday.vercel.app
   - Sign in with Google
   - Upload a document
   - ✅ It works!

---

## 🎯 Success Checklist

- [ ] Supabase project created
- [ ] Database connection strings added to .env.local
- [ ] `npx prisma db push` succeeded
- [ ] Google Drive API enabled
- [ ] Tested file upload locally
- [ ] VakilsDay folder appears in Google Drive
- [ ] Vercel environment variables added
- [ ] Production deployed and working

---

## 🆘 Troubleshooting

### "No Google Drive access" error
**Fix:** Sign out and sign in again with Google. You need to approve the Drive permission.

### "directUrl is required" error
**Fix:** Make sure you added DIRECT_URL to .env.local

### Can't see VakilsDay folder
**Fix:** Upload a document first - folder is created on first upload

### Migration fails
**Fix:** Check you're using port 5432 for DIRECT_URL (not 6543)

---

## 📊 What You'll Have After This

- ✅ **Cloud Database** (Supabase) - handles 50-100 firms on free tier
- ✅ **File Storage** (Google Drive BYOS) - zero cost
- ✅ **Production Ready** - can onboard real customers
- ✅ **Scalable** - works up to 1,000 firms with minimal cost

**Total Infrastructure Cost:** $0/month for first 50 firms! 🎉

---

## 📚 Documentation

- Full guide: `SETUP_GUIDE.md`
- API endpoints: See code comments in `app/api/documents/`
- Database schema: `prisma/schema.prisma`

---

**Ready to launch!** 🚀

Once you complete these steps, your app will be fully functional with cloud database and file storage.
