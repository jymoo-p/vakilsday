# Temporary Fix - Skip Google OAuth for Local Testing

If you want to test the app **without setting up Google OAuth**, here's a quick workaround:

---

## Option 1: Set Up Google OAuth (Recommended - 5 min)

**Follow:** `GOOGLE_OAUTH_SETUP.md`

This is the proper way and enables all features.

---

## Option 2: Skip OAuth Temporarily (Not Recommended)

⚠️ **Warning:** This disables authentication - use only for quick UI testing

### Step 1: Update Auth Config

Edit `lib/auth.ts` and temporarily comment out the provider requirement:

```typescript
// Temporarily bypass auth for testing
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // GoogleProvider(...) // Commented out
  ],
  // ... rest of config
}
```

### Step 2: Create a Mock Session

This won't work properly - you need real OAuth.

---

## Why You Need Google OAuth

1. **Authentication Required:** App uses NextAuth sessions
2. **Calendar Sync:** Requires Google Calendar API access
3. **User Records:** Database needs OAuth to create users
4. **Protected Routes:** Dashboard won't work without auth

---

## The Real Solution (Do This!)

### 1. Generate Secret (30 seconds)
```bash
openssl rand -base64 32
```

Update `.env`:
```env
NEXTAUTH_SECRET="paste-output-here"
```

### 2. Google Console (4 minutes)

**Quick Video Alternative:**
- Search YouTube: "Next.js Google OAuth setup"
- Follow any tutorial for creating OAuth client

**Or follow:** `GOOGLE_OAUTH_SETUP.md`

### 3. Update .env (30 seconds)
```env
GOOGLE_CLIENT_ID="your-id-here.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"
```

### 4. Restart Server (10 seconds)
```bash
pkill -f "next dev"
npm run dev
```

### 5. Test (30 seconds)
```
http://localhost:3000
Click "Sign in with Google"
✅ Should work!
```

---

## Total Time: 5 minutes

**It's faster to set up OAuth than to find workarounds!**

---

## What You Get With OAuth

- ✅ Full authentication
- ✅ User profiles with roles
- ✅ Protected routes working
- ✅ Calendar sync capability
- ✅ Proper security
- ✅ Production-ready setup

---

## Need Help?

**Stuck on Google Console?**

1. Go to: https://console.cloud.google.com/
2. Create new project
3. APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Type: Web application
6. Redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Secret
8. Paste in `.env`
9. Done!

---

## Alternative: Use GitHub OAuth Instead

If you don't want to use Google, you can use GitHub:

1. Go to: https://github.com/settings/developers
2. New OAuth App
3. Homepage URL: `http://localhost:3000`
4. Callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Secret

Update `lib/auth.ts`:
```typescript
import GitHubProvider from 'next-auth/providers/github'

providers: [
  GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }),
],
```

Update `.env`:
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**Note:** You'll lose Calendar sync with GitHub OAuth.

---

## Bottom Line

**Just do the Google OAuth setup - it's worth the 5 minutes!**

See: `GOOGLE_OAUTH_SETUP.md` 🚀
