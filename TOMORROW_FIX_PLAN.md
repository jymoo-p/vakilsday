# Tomorrow's Fix Plan - Google Auth Solution

## What I Discovered

Your **working** apartment_maintenance project uses **Firebase Authentication** (client-side), not NextAuth (server-side). This is why it works perfectly!

## The Core Problem with VakilsDay

NextAuth with Prisma has been giving us endless issues:
- ✗ Prisma 7 adapter incompatibility
- ✗ Prisma 5 still creates orphaned users
- ✗ PrismaAdapter fails to link OAuth accounts
- ✗ Complex server-side session management
- ✗ Database connection pooling issues

## The Solution: Switch to Firebase Auth

Use the **exact same approach** as your working apartment_maintenance project.

### Why Firebase Auth is Better for This Project

✅ **Client-side** - No server-side OAuth callback complexity
✅ **Works perfectly** - Already proven in your apartment_maintenance app
✅ **Simple setup** - Just environment variables, no database tables
✅ **Google built-in** - Native Google OAuth support
✅ **No adapter issues** - No Prisma/NextAuth integration headaches
✅ **Fast** - Popup-based, no page redirects

### Architecture Change

**Current (Not Working):**
```
User → Google OAuth → NextAuth Callback → Prisma Adapter → Database → Session
                      ↑ FAILING HERE
```

**New (Working - Same as apartment_maintenance):**
```
User → Firebase Google Popup → Client-side Auth → Store user info → Done
```

## Tomorrow's Implementation Plan

### Step 1: Create Firebase Project (5 min)
1. Go to https://console.firebase.google.com/
2. Create new project: "VakilsDay"
3. Enable Google Authentication
4. Copy config values

### Step 2: Install Firebase (1 min)
```bash
npm install firebase
```

### Step 3: Copy Working Code (10 min)
Copy these files from apartment_maintenance to vakilsday:
- `src/lib/firebase.ts` → `lib/firebase.ts`
- `src/lib/auth.ts` → `lib/auth.ts`

Adapt to use with Prisma (keep database for data, just not for auth sessions)

### Step 4: Update Auth Flow (15 min)
1. Replace NextAuth sign-in with Firebase popup
2. After Firebase auth succeeds, create/update user in Prisma
3. Use client-side auth state instead of server sessions
4. Remove all NextAuth code

### Step 5: Update Protected Routes (10 min)
Instead of:
```typescript
const session = await getServerSession(authOptions)
```

Use Firebase auth state:
```typescript
const user = useAuth() // Client-side hook
```

### Step 6: Environment Variables
Replace these:
```bash
# Remove:
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID (server OAuth)
GOOGLE_CLIENT_SECRET (server OAuth)

# Add (from Firebase Console):
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Step 7: Keep Prisma for Data
- Keep all Prisma models (Case, Hearing, Organization, etc.)
- Remove: Account, Session, VerificationToken models (NextAuth only)
- Keep: User model (but store Firebase UID instead of email-based auth)

## Benefits

1. **Authentication = Firebase** (proven working)
2. **Data storage = Prisma/Postgres** (keep current schema mostly intact)
3. **No OAuth callback issues** (client-side popup)
4. **Same flow as your working app** (apartment_maintenance)

## Code Changes Summary

### Remove:
- `lib/auth.ts` (NextAuth config)
- `app/api/auth/[...nextauth]/route.ts` (NextAuth API)
- PrismaAdapter setup
- Account, Session, VerificationToken models

### Add:
- `lib/firebase.ts` (Firebase config - copy from apartment_maintenance)
- `lib/auth.ts` (Firebase auth - copy from apartment_maintenance)
- `lib/hooks/useAuth.ts` (Client-side auth hook)

### Modify:
- Sign-in page: Use Firebase popup instead of NextAuth
- Protected routes: Use client-side auth check
- User model: Add `firebaseUid` field

## Estimated Time: 1 hour total

## Risk Level: LOW
- Firebase is proven working in your apartment_maintenance app
- Client-side auth is simpler than server-side
- No database adapter complications

---

## Alternative (If You Want to Keep NextAuth)

If you really want NextAuth, I found the issue:

**The Problem:** PrismaAdapter is creating users but failing to create the linked Account record.

**The Fix:** Implement a custom adapter or switch to JWT sessions instead of database sessions.

But honestly, **Firebase is the better choice** because:
1. It's already working for you
2. Simpler architecture
3. No adapter issues
4. Faster development

---

## Tomorrow's Action Items

1. ☐ Create Firebase project
2. ☐ Copy Firebase config from Firebase Console
3. ☐ Install Firebase: `npm install firebase`
4. ☐ Copy `firebase.ts` and `auth.ts` from apartment_maintenance
5. ☐ Update sign-in page to use Firebase
6. ☐ Test locally
7. ☐ Update Prisma schema (remove NextAuth models)
8. ☐ Deploy to Vercel

**I'll have the complete code changes ready when you're back.**

Rest well! This will work. 🚀
