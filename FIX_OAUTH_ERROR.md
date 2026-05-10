# Fix OAuth Error 401: invalid_client

**Error:** "The OAuth client was not found"  
**Cause:** `.env` still has placeholder values OR credentials are incorrect

---

## ✅ Solution: Update .env with Real Credentials

### Step 1: Get Your Credentials from Google Console

1. **Go to:** https://console.cloud.google.com/apis/credentials

2. **Find your OAuth 2.0 Client ID** (should look like):
   - Client ID: `123456789-abc123def456.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-AbCdEf123456789`

3. **Click on your OAuth client** to verify:
   - Authorized redirect URIs must include:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - **IMPORTANT:** No trailing slash, exact port 3000

---

### Step 2: Update Your .env File

**Open:** `/Users/jputhiyottil/personal/vakilsday/.env`

**Replace these lines:**
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**With your actual credentials:**
```env
GOOGLE_CLIENT_ID="123456789-abc123def456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-AbCdEf123456789"
```

**Also update NEXTAUTH_SECRET:**
```bash
# Run this command:
openssl rand -base64 32
```

Copy the output and update:
```env
NEXTAUTH_SECRET="paste-the-actual-generated-key-here"
```

---

### Step 3: Restart Dev Server

```bash
# Stop server (Ctrl+C or run):
pkill -f "next dev"

# Start again:
npm run dev
```

---

### Step 4: Clear Browser Cache

1. **Open incognito/private window** (recommended)
   - Chrome: Cmd+Shift+N (Mac) or Ctrl+Shift+N (Windows)
   - Safari: Cmd+Shift+N
   - Firefox: Cmd+Shift+P

2. **OR clear cookies:**
   - Chrome: Settings → Privacy → Clear browsing data
   - Clear cookies for `localhost` and `accounts.google.com`

---

### Step 5: Try Again

1. Open: http://localhost:3000 (in incognito)
2. Click "Sign in with Google"
3. Should redirect to Google successfully ✅

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Didn't Update .env
**Check:**
```bash
cat .env | grep GOOGLE
```

**Should show:**
```
GOOGLE_CLIENT_ID="actual-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-actualSecret"
```

**NOT:**
```
GOOGLE_CLIENT_ID="your-google-client-id"  ← WRONG!
```

---

### ❌ Mistake 2: Wrong Redirect URI

**In Google Console, your redirect URI must be EXACTLY:**
```
http://localhost:3000/api/auth/callback/google
```

**Common errors:**
- ❌ `http://localhost:3000/api/auth/callback/google/` (trailing slash)
- ❌ `https://localhost:3000/...` (https instead of http)
- ❌ `http://localhost:3001/...` (wrong port)
- ❌ Missing the `/google` at the end

**Fix:**
1. Go to Google Console → Credentials
2. Click your OAuth client
3. Edit Authorized redirect URIs
4. Make sure it's exactly: `http://localhost:3000/api/auth/callback/google`
5. Click SAVE
6. Wait 5 minutes for changes to propagate

---

### ❌ Mistake 3: Copied Wrong Credentials

**Make sure you're using:**
- OAuth 2.0 Client ID (NOT API key, NOT Service Account)
- From the correct project
- Client ID ends with `.apps.googleusercontent.com`
- Client Secret starts with `GOCSPX-`

---

### ❌ Mistake 4: Server Not Restarted

After updating `.env`, you MUST restart:
```bash
pkill -f "next dev"
npm run dev
```

---

### ❌ Mistake 5: Browser Cache

Old OAuth attempts are cached. Use incognito mode or clear cookies.

---

## Verify Your Setup

### 1. Check .env File
```bash
# Show your .env (credentials will be visible)
cat .env
```

Should show:
```env
DATABASE_URL="prisma+postgres://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="actual-long-random-string"
GOOGLE_CLIENT_ID="123456...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

### 2. Check Google Console
- Project exists
- APIs enabled (Google+ API, Calendar API)
- OAuth client created
- Redirect URI exactly matches

### 3. Check Server is Running
```bash
# Should show process on port 3000
lsof -i :3000
```

---

## Step-by-Step Checklist

- [ ] Got Client ID from Google Console
- [ ] Got Client Secret from Google Console
- [ ] Updated `.env` with real Client ID
- [ ] Updated `.env` with real Client Secret
- [ ] Generated and added NEXTAUTH_SECRET
- [ ] Verified redirect URI in Google Console
- [ ] Saved all changes
- [ ] Killed old dev server
- [ ] Started new dev server
- [ ] Cleared browser cache OR using incognito
- [ ] Tried signing in again

---

## Still Not Working?

### Debug Mode: Check What's Being Used

Create a test file: `test-env.js`
```javascript
require('dotenv').config()
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID)
console.log('Starts with real ID?', process.env.GOOGLE_CLIENT_ID?.includes('apps.googleusercontent.com'))
```

Run:
```bash
node test-env.js
```

Should show your ACTUAL client ID, not "your-google-client-id"

---

## Quick Commands

```bash
# View .env
cat .env

# Generate new secret
openssl rand -base64 32

# Restart server
pkill -f "next dev" && npm run dev

# Check what port server is on
lsof -i :3000

# Test in incognito
# Chrome: Cmd+Shift+N
# Safari: Cmd+Shift+N  
# Firefox: Cmd+Shift+P
```

---

## Expected Flow After Fix

1. Click "Sign in with Google"
2. → Redirects to Google sign-in page (accounts.google.com)
3. → Sign in with your Google account
4. → "VakilsDay wants to access your Google Account"
5. → Click "Allow"
6. → Redirects back to http://localhost:3000/dashboard
7. → ✅ You're logged in!

---

## My Complete .env Should Look Like

```env
# Database (from prisma dev)
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="j8k3h4g5f6d7s8a9..."  ← Real random string

# Google OAuth
GOOGLE_CLIENT_ID="123456789-abc123.apps.googleusercontent.com"  ← Real
GOOGLE_CLIENT_SECRET="GOCSPX-AbCdEf123456"  ← Real

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

---

**After fixing: Should work immediately! 🚀**

If still stuck, share the error message from:
1. Browser console (F12)
2. Server terminal
