# VakilsDay - Quick Start Guide

Get VakilsDay up and running in 10 minutes.

---

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Google account (for OAuth)
- [ ] Text editor (VS Code recommended)

---

## Step-by-Step Setup

### 1. Clone and Install (2 minutes)

```bash
git clone https://github.com/yourusername/vakilsday.git
cd vakilsday
npm install
```

### 2. Start Local Database (1 minute)

```bash
npx prisma dev
```

This starts a local PostgreSQL instance and creates the database.

### 3. Configure Google OAuth (3 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "VakilsDay Dev"
3. Enable APIs:
   - Google+ API
   - Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret

### 4. Set Up Environment Variables (2 minutes)

Open `.env` and update:

```env
DATABASE_URL="prisma+postgres://localhost:51213/..."  # Already set by prisma dev

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

GOOGLE_CLIENT_ID="your-client-id-from-step-3"
GOOGLE_CLIENT_SECRET="your-client-secret-from-step-3"

# Supabase (optional for now, can skip for testing)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 5. Run Database Migrations (1 minute)

```bash
npx prisma migrate dev --name init
```

### 6. Start the Development Server (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Test the Setup

### 1. Authentication
- Click "Sign in with Google"
- Authorize the app
- You should be redirected to the dashboard

### 2. Database
Open Prisma Studio to view your database:
```bash
npx prisma studio
```

Navigate to [http://localhost:5555](http://localhost:5555)

### 3. Legal Search APIs

Test Bare Act search:
```bash
curl "http://localhost:3000/api/search/bare-acts?q=indian+penal+code"
```

Expected response:
```json
{
  "query": "indian penal code",
  "count": 2,
  "results": [
    {
      "id": "ipc-1860",
      "title": "Indian Penal Code",
      "year": "1860",
      "sections": ["Section 302", "Section 420", "Section 498A"],
      "url": "https://www.indiacode.nic.in/...",
      "excerpt": "The Indian Penal Code, 1860 is the main criminal code of India."
    }
  ]
}
```

Test Judgment search:
```bash
curl "http://localhost:3000/api/search/judgments?q=habeas+corpus"
```

---

## Common Issues

### Issue: "Can't connect to database"

**Solution:**
```bash
# Stop any running Prisma dev instances
pkill -f prisma

# Restart Prisma dev
npx prisma dev
```

### Issue: "Google OAuth redirect URI mismatch"

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client
3. Add exact URI: `http://localhost:3000/api/auth/callback/google`
4. Save and wait 5 minutes for changes to propagate

### Issue: "NextAuth session not found"

**Solution:**
1. Clear browser cookies for `localhost:3000`
2. Restart dev server
3. Try signing in again

### Issue: "Legal search returns empty results"

**Solution:**
This is expected if external APIs are down. The app returns fallback data:
- IPC (Indian Penal Code)
- CrPC (Code of Criminal Procedure)

---

## What's Next?

You now have a working VakilsDay instance with:
- ✅ Database schema (9 tables)
- ✅ Google OAuth authentication
- ✅ Legal search APIs
- ✅ Calendar sync service (backend only)

### Recommended Reading Order:
1. **README.md** - Full setup and features
2. **SCHEMA.md** - Database structure and RBAC
3. **ARCHITECTURE.md** - Technical deep dive
4. **STEP1_SUMMARY.md** - Implementation details

### Next Development Tasks:
1. Build UI components (dashboard, case list, case detail)
2. Implement case CRUD APIs
3. Add document upload functionality
4. Set up Supabase Storage for files

---

## Useful Commands

```bash
# Development
npm run dev                           # Start dev server
npm run build                         # Build for production
npm run start                         # Start production server

# Database
npx prisma studio                     # Open database GUI
npx prisma migrate dev                # Create new migration
npx prisma migrate reset              # Reset database (WARNING: deletes all data)
npx prisma generate                   # Regenerate Prisma client

# Testing
npm run test                          # Run tests (when added)
npm run lint                          # Lint code
npm run type-check                    # Check TypeScript types
```

---

## Getting Help

- **Documentation:** See `README.md`, `SCHEMA.md`, `ARCHITECTURE.md`
- **Issues:** Open a GitHub issue
- **Email:** support@vakilsday.com

---

**You're ready to build! 🚀**
