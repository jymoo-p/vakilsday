# Local Development Setup

## Quick Start (5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID (the one you created for VakilsDay)
3. Copy the **Client ID** and **Client secret**

### Step 2: Add Localhost Redirect URI

While in Google Console:
1. Under "Authorized redirect URIs", click **+ ADD URI**
2. Add: `http://localhost:3000/api/auth/callback/google`
3. Click **SAVE**

### Step 3: Update .env.local

Open `.env.local` and replace the placeholder values:

```bash
GOOGLE_CLIENT_ID="your-actual-client-id-from-google"
GOOGLE_CLIENT_SECRET="your-actual-client-secret-from-google"
```

### Step 4: Start the App

```bash
# Install dependencies (if not already done)
npm install

# Generate Prisma client
npx prisma generate

# Start the development server
npm run dev
```

### Step 5: Test Sign In

1. Open http://localhost:3000
2. Click "Sign In"
3. Click "Sign In with Google"
4. Sign in with your Google account

**You should see detailed error messages in the terminal if anything fails.**

---

## What to Look For

### Success:
- After signing in, you should be redirected to `/onboarding`
- Terminal shows: "NextAuth Debug: OAUTH_CALLBACK_HANDLER_ERROR" or similar
- Check terminal for actual error messages

### Common Issues:

**"redirect_uri_mismatch"**
- Go back to Google Console and make sure you added `http://localhost:3000/api/auth/callback/google`

**"NEXTAUTH_URL is not set"**
- Make sure `.env.local` exists and has `NEXTAUTH_URL="http://localhost:3000"`

**Database connection errors**
- The app is using the production database (same as Vercel)
- Check that DATABASE_URL in `.env.local` is correct

---

## Debugging Tips

1. **Check the terminal** - All NextAuth logs will appear there
2. **Check browser console** - Look for JavaScript errors
3. **Check Network tab** - See the actual API calls and responses

With debug mode enabled, you'll see detailed logs like:
```
NextAuth Debug: OAUTH_CALLBACK_HANDLER_ERROR
NextAuth Error: OAuthAccountNotLinked { message: '...' }
```

---

## Next Steps After Local Testing

Once we see the actual error message in your local terminal, we can:
1. Identify the exact failure point
2. Fix it locally
3. Test the fix
4. Deploy to production

This is much faster than debugging on Vercel!
