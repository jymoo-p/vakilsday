# Create New Google OAuth Credentials for Localhost

## The Issue
You can't copy the existing client secret from Google Console.

## Solution
Create a **second** set of OAuth credentials just for local development. This is actually best practice!

---

## Step-by-Step (3 minutes)

### 1. Go to Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

### 2. Create New OAuth Credentials

Click: **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**

### 3. Configure the Application

**Application type:** Web application

**Name:** VakilsDay - Local Development

**Authorized redirect URIs:**
- Click **+ ADD URI**
- Enter: `http://localhost:3000/api/auth/callback/google`

**Click CREATE**

### 4. Copy the Credentials

A popup will appear with:
- **Client ID**
- **Client secret**

**Copy both immediately!** (You won't be able to see the secret again)

### 5. Update .env.local

Paste the values into `.env.local`:

```bash
GOOGLE_CLIENT_ID="your-new-local-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-new-local-secret"
```

Save the file.

### 6. Start the App

```bash
./START_LOCAL.sh
```

---

## Why Two Sets of Credentials?

✅ **Production** (`vakilsday.vercel.app`)
- Uses the original OAuth credentials
- Redirect URI: `https://vakilsday.vercel.app/api/auth/callback/google`

✅ **Local Development** (`localhost:3000`)
- Uses the new OAuth credentials
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

This is the standard way to handle OAuth for development!

---

## After Creating

Once you have the new credentials:
1. Update `.env.local` 
2. Run `./START_LOCAL.sh`
3. Test sign-in at `http://localhost:3000`
4. Share any error messages from the terminal

Let's get this working! 🚀
