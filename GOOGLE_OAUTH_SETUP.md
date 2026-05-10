# Google OAuth Setup Guide

**Issue:** Sign-in button processing indefinitely  
**Cause:** Google OAuth credentials not configured  
**Time to Fix:** 5 minutes

---

## Quick Setup Steps

### 1. Generate NEXTAUTH_SECRET (1 minute)

```bash
openssl rand -base64 32
```

Copy the output and update `.env`:
```env
NEXTAUTH_SECRET="paste-the-generated-key-here"
```

### 2. Set Up Google OAuth (4 minutes)

#### Step 1: Go to Google Cloud Console
Open: https://console.cloud.google.com/

#### Step 2: Create a Project
1. Click on the project dropdown (top left)
2. Click "New Project"
3. Name: **VakilsDay Dev**
4. Click "Create"

#### Step 3: Enable APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - **Google+ API** (or People API)
   - **Google Calendar API**

#### Step 4: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **VakilsDay**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** (skip scopes, test users)

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **VakilsDay Local Dev**
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **CREATE**

5. **Copy the credentials:**
   - Client ID: `123456789-abc...googleusercontent.com`
   - Client Secret: `GOCSPX-...`

#### Step 5: Update .env
```env
GOOGLE_CLIENT_ID="123456789-abc...googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

---

## Complete .env Example

Your `.env` should look like this:

```env
# Database (already set by prisma dev)
DATABASE_URL="prisma+postgres://localhost:51213/..."

# NextAuth (UPDATE THESE)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-from-openssl"

# Google OAuth (UPDATE THESE)
GOOGLE_CLIENT_ID="your-actual-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-actual-client-secret"

# Supabase (optional for now)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

---

## After Updating .env

### Restart the Dev Server

```bash
# Stop the server (Ctrl+C in the terminal)
# Or kill it:
pkill -f "next dev"

# Restart:
npm run dev
```

### Test Again

1. Open: http://localhost:3000
2. Click "Sign in with Google"
3. Should redirect to Google sign-in page
4. Sign in with your Google account
5. Grant permissions
6. Should redirect back to /dashboard

---

## Troubleshooting

### Issue: "redirect_uri_mismatch"
**Solution:** 
- Go back to Google Console
- Credentials → Your OAuth client
- Make sure redirect URI is EXACTLY: `http://localhost:3000/api/auth/callback/google`
- No trailing slash, correct port

### Issue: "Access blocked: This app's request is invalid"
**Solution:**
- Go to OAuth consent screen
- Add your email to "Test users"
- Or publish the app (for testing, keeping it in Testing mode is fine)

### Issue: Still processing
**Solution:**
1. Clear browser cache and cookies for localhost
2. Try in incognito mode
3. Check browser console for errors (F12)
4. Check server terminal for errors

---

## Quick Commands

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Restart dev server
pkill -f "next dev" && npm run dev

# Check if .env is loaded
grep GOOGLE .env
```

---

## What You'll Need

From Google Cloud Console:
- ✅ Google Cloud account (free)
- ✅ New project created
- ✅ Google+ API enabled
- ✅ Calendar API enabled
- ✅ OAuth 2.0 Client ID
- ✅ OAuth 2.0 Client Secret

---

## Security Notes

- ✅ `.env` is in `.gitignore` (won't be committed)
- ✅ Secrets stay on your machine
- ✅ For production, use different credentials
- ✅ Never share your Client Secret publicly

---

## After Setup Works

Once sign-in works:
1. ✅ You'll land on /dashboard
2. ✅ Your user record will be in database
3. ✅ Check with: `npx prisma studio`
4. ✅ Your role will be: ASSOCIATE (default)
5. ✅ To become ADMIN: Update role in Prisma Studio

---

## Visual Guide

### What Google Console Should Look Like:

**OAuth Client:**
```
Name: VakilsDay Local Dev
Type: Web application
Authorized redirect URIs:
  http://localhost:3000/api/auth/callback/google
```

**Scopes (should auto-select):**
- email
- profile
- openid
- calendar (for hearing sync)

---

**Time Required:** 5 minutes  
**Once Done:** Sign-in will work instantly  
**Next:** Start testing the app features!

---

## Need Help?

If stuck:
1. Check browser console (F12)
2. Check server logs in terminal
3. Verify redirect URI exactly matches
4. Try incognito mode
5. Clear cookies and retry

---

**Let's get you signed in! 🚀**
