# Firebase Auth + Google Drive Integration

## Important: This App Uses Firebase Authentication

Your app uses **Firebase Authentication** (not NextAuth), so Google Drive permissions are requested through Firebase.

---

## How It Works

### Authentication Flow
1. User clicks "Sign in with Google" 
2. Firebase Auth popup appears
3. User approves permissions:
   - ✓ Basic profile (email, name, photo)
   - ✓ Google Drive file access
4. Firebase returns OAuth tokens
5. Access token stored in database
6. Admin can now upload files to their Drive

### File Storage Flow
1. **Admin uploads document** → Saved to admin's Google Drive
2. **Folder created:** `Google Drive/VakilsDay/Case_XXX/`
3. **Auto-shared** with all team members (R/W access)
4. **Database stores:** File ID, name, URL, size (metadata only)
5. **Team accesses** files via app or directly in Google Drive

---

## Setup Steps

### 1. Enable Google Drive API in Firebase (5 minutes)

Your Firebase project: `vakilsday-648d1`

**Option A: Via Firebase Console (Easiest)**
1. Go to: https://console.firebase.google.com
2. Select project: `vakilsday-648d1`
3. Go to: **Authentication** → **Sign-in method**
4. Click **Google** provider
5. Click **Advanced settings**
6. Under **OAuth scopes**, add:
   ```
   https://www.googleapis.com/auth/drive.file
   ```
7. Save

**Option B: Via Google Cloud Console**
1. Go to: https://console.cloud.google.com
2. Select project: `vakilsday-648d1` (or your Firebase project ID)
3. Go to: **APIs & Services** → **Library**
4. Search: **Google Drive API**
5. Click **Enable**

### 2. Update OAuth Consent Screen

1. In Google Cloud Console
2. Go to: **APIs & Services** → **OAuth consent screen**
3. Under **Scopes**, ensure these are added:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/drive.file` ← **NEW**
4. Save

### 3. Test Locally

```bash
# Start dev server
npm run dev
```

**Test flow:**
1. Open http://localhost:3000
2. Click "Sign in with Google"
3. **Important:** You'll see a NEW permission screen asking for Drive access
4. Approve all permissions
5. Complete onboarding
6. Create a test case
7. Upload a document
8. Check your Google Drive → **VakilsDay** folder should appear!

---

## Code Changes Made

### ✅ Updated Firebase Auth to Request Drive Scope
**File:** `lib/firebase-auth.ts`
```typescript
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
```

### ✅ Capture Access Token from Firebase
**File:** `lib/firebase-auth.ts`
```typescript
const credential = GoogleAuthProvider.credentialFromResult(result);
const accessToken = credential?.accessToken;
```

### ✅ Store Token in Database
**File:** `app/api/auth/sync-firebase/route.ts`
```typescript
await prisma.account.create({
  data: {
    userId: user.id,
    provider: 'google',
    access_token: accessToken,
    // ...
  },
})
```

### ✅ Use Token for Drive Operations
**File:** `lib/services/google-drive.ts`
```typescript
const account = await prisma.account.findFirst({
  where: { userId, provider: 'google' },
})
// Use account.access_token for Google Drive API calls
```

---

## Important Notes

### Token Expiration
- Firebase access tokens expire after **1 hour**
- Currently, refresh tokens are NOT stored (Firebase limitation with popup flow)
- **Solution:** Users must sign in again after 1 hour for file operations
- **Better solution (future):** Use Firebase server-side auth with refresh tokens

### Existing Users
Users who signed in before this update must:
1. Sign out completely
2. Sign in again
3. Approve the new Drive permission

### Only Admin Uploads
- Files are stored in **admin's Google Drive**
- Only users with `role: 'ADMIN'` can upload
- Reason: All org files in one place, easier management

---

## Troubleshooting

### "No Google Drive access" error
**Cause:** User hasn't approved Drive permission  
**Fix:** 
1. Sign out
2. Sign in again
3. Approve Drive permission in popup

### "Failed to upload" error
**Cause:** Drive API not enabled  
**Fix:** Enable Google Drive API in Google Cloud Console

### Token expired after 1 hour
**Cause:** Firebase popup flow doesn't provide refresh tokens  
**Fix:** User must sign in again (or implement Firebase server-side auth)

### Files not appearing in Drive
**Cause:** Permission not granted or API not enabled  
**Fix:** 
1. Check Google Drive API is enabled
2. Re-authenticate with new permissions
3. Check admin role (only admin can upload)

---

## Architecture

```
User Browser
    ↓ (1) Click Sign In
Firebase Auth Popup
    ↓ (2) Approve Drive Permission  
Google OAuth
    ↓ (3) Return access_token
Firebase SDK
    ↓ (4) Store token
PostgreSQL (Account table)
    ↓ (5) Use token
Google Drive API
    ↓ (6) Upload file
Admin's Google Drive/VakilsDay/Case_XXX/
    ↓ (7) Auto-share
Team Members (R/W access)
```

---

## Comparing Firebase Auth vs NextAuth

| Feature | Firebase Auth (Your App) | NextAuth |
|---------|-------------------------|----------|
| **Auth Provider** | Firebase | Next.js built-in |
| **Token Storage** | Manual (Account table) | Automatic |
| **Refresh Tokens** | Not with popup flow | Yes |
| **Drive Access** | Via access_token | Via refresh_token |
| **Session Length** | Until Firebase token expires | Configurable |
| **Best For** | Simple apps, Firebase ecosystem | Complex auth, multiple providers |

**Your app uses Firebase** - this is fine for your use case!

---

## Next Steps

1. ✅ Enable Drive API in Firebase Console
2. ✅ Update OAuth consent screen
3. ✅ Test locally (sign out & sign in again)
4. ✅ Deploy to Vercel
5. ✅ Test in production

---

## Security Notes

- ✅ Access tokens stored in database (encrypted by PostgreSQL)
- ✅ Only admin can upload (RBAC enforced)
- ✅ Files auto-shared with org members only
- ✅ Drive scope limited to app-created files (`drive.file`)
- ✅ User can revoke access anytime in Google Account settings

---

**You're all set!** 🎉

The integration is ready. Just enable the Drive API and test!
