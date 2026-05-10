# VakilsDay Project Guide

**Project:** VakilsDay - Legal Practice Management SaaS for Indian Litigation Lawyers
**Status:** Multi-Tenant Architecture Implemented
**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth.js
**Architecture:** Multi-Tenant (Each law firm is a separate workspace)

---

## Project Overview

VakilsDay is a multi-tenant SaaS that replaces paper diaries with a digital system for Indian litigation lawyers. Each law firm gets their own workspace with complete data isolation.

**Core Features:**
- **Case Management:** Track cases, hearings, documents
- **Daily Schedule:** Today's hearings with court/item numbers
- **Legal Research:** Search Indian acts and judgments
- **Team Collaboration:** Role-based access (Admin/Associate/Clerk)
- **Calendar Sync:** Google Calendar integration
- **Multi-Tenant:** Each law firm is a separate workspace with isolated data

**User Journey:**
1. Visit app → See landing page
2. Sign in with Google
3. Create law firm workspace (becomes Admin)
4. Invite team members (future feature)
5. Start managing cases

---

## Quick Start Commands

```bash
# First Time Setup (After pulling multi-tenant changes)
./setup-multi-tenant.sh  # Run migration for organizations

# OR manually:
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations

# Start development
npx prisma dev          # Start local Postgres
npm run dev             # Start Next.js dev server
open http://localhost:3000

# Database management
npx prisma studio       # Open DB GUI (localhost:5555)

# Testing
npm run build           # Build for production
npm run lint            # Check code quality
```

---

## Project Structure

```
vakilsday/
├── app/
│   ├── (auth)/               # Authentication pages
│   │   ├── signin/page.tsx   # Google OAuth sign-in
│   │   ├── error/page.tsx    # Auth errors
│   │   └── layout.tsx
│   ├── (dashboard)/          # Protected dashboard
│   │   ├── dashboard/        # Today's Schedule
│   │   ├── cases/            # Case management
│   │   │   ├── [id]/page.tsx   # Case detail (3 tabs)
│   │   │   ├── new/page.tsx    # New case form
│   │   │   └── page.tsx        # Case list
│   │   ├── research/         # Legal research
│   │   │   ├── bare-acts/    # Acts search
│   │   │   ├── judgments/    # Judgment search
│   │   │   └── bookmarks/    # Saved research
│   │   ├── settings/page.tsx # User settings
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth
│   │   ├── cases/               # Case CRUD
│   │   ├── hearings/            # Hearing CRUD
│   │   ├── search/              # Legal search
│   │   └── calendar/            # Calendar sync
│   ├── page.tsx              # Root → redirects
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Tailwind theme
├── components/
│   ├── layout/               # Sidebar, Header
│   ├── cases/                # Hearing components
│   ├── providers/            # SessionProvider
│   └── ui/                   # shadcn components
├── lib/
│   ├── prisma.ts             # DB client
│   ├── auth.ts               # NextAuth config
│   ├── services/             # API integrations
│   └── utils/rbac.ts         # RBAC helpers
└── prisma/
    └── schema.prisma         # Database schema
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 App Router
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **UI:** shadcn/ui (Radix primitives)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Dates:** date-fns

### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js with Google OAuth
- **Storage:** Supabase (placeholder)

### External APIs
- IndiaCode API (bare acts)
- Indian Kanoon API (judgments)
- Google Calendar API

---

## Database Schema

### 9 Models Total

**Authentication:**
- `User` - Accounts with roles
- `Account` - OAuth providers
- `Session` - Active sessions
- `VerificationToken` - Email verification

**Core Legal:**
- `Case` - Legal cases
- `CaseAssignment` - User ↔ Case junction
- `Hearing` - Court hearings
- `HearingNote` - Notes (public/private)
- `Document` - Case documents
- `ResearchBookmark` - Saved research

**Key Indexes:**
- `cases(nextHearingDate)` → Dashboard
- `hearings(caseId, hearingDate)` → Timeline
- `documents(caseId, documentType)` → Folders

---

## Role-Based Access Control

| Feature | ADMIN | ASSOCIATE | CLERK |
|---------|-------|-----------|-------|
| View All Cases | ✅ | ❌ | ❌ |
| Create Cases | ✅ | ✅ | ❌ |
| Edit Cases | ✅ | ✅ | ❌ |
| Delete Cases | ✅ | ❌ | ❌ |
| Update Hearing Dates | ✅ | ✅ | ✅ |
| Private Notes | ✅ | ✅ | ❌ |
| Legal Research | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |

**Enforcement:**
- API level (check session role)
- Database level (CaseAssignment)
- UI level (hide buttons)

---

## API Routes

### Cases
```
GET    /api/cases              # List (filtered by role)
POST   /api/cases              # Create (ADMIN/ASSOCIATE)
GET    /api/cases/[id]         # Get details
PATCH  /api/cases/[id]         # Update
DELETE /api/cases/[id]         # Delete (ADMIN only)
```

### Hearings
```
POST   /api/hearings           # Create hearing
```

### Search
```
GET    /api/search/bare-acts?q={query}&limit={n}
GET    /api/search/judgments?q={query}&court={court}
```

### Calendar
```
POST   /api/calendar/sync      # Sync to Google Calendar
```

---

## Environment Variables

Required in `.env`:
```env
# Database (auto-generated by prisma dev)
DATABASE_URL="prisma+postgres://localhost:51213/..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Google OAuth (from console.cloud.google.com)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Supabase (optional for now)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

---

## Key Implementation Notes

### 1. Prisma Client (Prisma 7 with Adapter)
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })

// Prisma 7 requires either adapter or accelerateUrl
// We use @prisma/adapter-pg for PostgreSQL
// Install: npm install @prisma/adapter-pg pg
```

### 2. Next.js 15+ Async Params
```typescript
// API routes now receive async params
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
}
```

### 3. shadcn/ui Base UI v0.8+
```typescript
// Use render prop instead of asChild
<Button render={<Link href="..." />}>Text</Button>
```

### 4. Authentication Flow
- Google OAuth with Calendar scope
- Refresh token stored for offline access
- Default role: ASSOCIATE
- Sessions: 30-day database-backed

### 5. Legal Search
- Server-side with Next.js caching (1hr)
- Fallback to hardcoded acts if APIs fail
- IndiaCode & Indian Kanoon may rate limit

---

## Design System

### Theme
- **Primary:** Midnight Blue
- **Background:** White / Dark slate
- **Typography:** Large text (text-lg, text-xl)
- **Font:** Geist Sans

### Components (shadcn/ui)
button, card, input, label, select, textarea, badge, avatar, dropdown-menu, separator, dialog, alert, tabs, table

---

## Testing Guide

### Quick Test Flow
```bash
# 1. Start everything
npx prisma dev
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Sign in with Google

# 4. Create test case
Go to /cases → New Case

# 5. Test search
/research/bare-acts → Search "Indian Penal Code"

# 6. Verify database
npx prisma studio (localhost:5555)
```

### Test Checklist
- [ ] Sign in/out
- [ ] View dashboard
- [ ] Create case
- [ ] Add hearing
- [ ] Search bare acts
- [ ] Search judgments
- [ ] Check settings
- [ ] Test on mobile

**Full guide:** See `TESTING_GUIDE.md`

---

## Known Limitations

### Document Management
- **Status:** Placeholder UI
- **Missing:** Supabase integration
- **To implement:** File upload component

### Research Bookmarks
- **Status:** Placeholder UI
- **Missing:** Save/delete functionality

### Auto Calendar Sync
- **Status:** Backend ready
- **Missing:** Frontend trigger on date change

---

## Common Issues

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
npm run dev
```

### Database connection failed
```bash
npx prisma dev  # Restart Postgres
```

### OAuth redirect error
- Check Google Console redirect URI
- Should be: `http://localhost:3000/api/auth/callback/google`

### Session not persisting
- Clear browser cookies
- Regenerate NEXTAUTH_SECRET
- Restart server

---

## Development Workflow

### Starting New Feature
1. Update Prisma schema → `npx prisma migrate dev`
2. Build API route with RBAC
3. Build UI component
4. Connect UI to API
5. Test + verify in Prisma Studio

### Making Schema Changes
```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name your_change
# Client auto-regenerates
```

---

## Deployment (Vercel)

### Pre-Deploy Checklist
- [ ] Set up Vercel Postgres
- [ ] Add environment variables
- [ ] Update Google OAuth URLs
- [ ] Generate production NEXTAUTH_SECRET

### Deploy
```bash
vercel --prod
npx prisma migrate deploy  # In production
```

---

## File Naming Conventions

- Pages: `page.tsx`
- Layouts: `layout.tsx`
- API: `route.ts`
- Components: `kebab-case.tsx`
- Utils: `kebab-case.ts`

---

## Code Style

### Server Component (default)
```typescript
export default async function Page() {
  const data = await fetchData()
  return <div>...</div>
}
```

### Client Component (interactive)
```typescript
'use client'
export default function Component() {
  const [state, setState] = useState()
  return <div>...</div>
}
```

### API Route Pattern
```typescript
export async function GET(request: NextRequest) {
  // 1. Authenticate
  const session = await getServerSession()
  if (!session) return 401
  
  // 2. Get user + role
  const user = await prisma.user.findUnique(...)
  
  // 3. Check permissions (RBAC)
  if (!hasPermission(user.role)) return 403
  
  // 4. Fetch data
  const data = await prisma...
  
  // 5. Return
  return NextResponse.json({ data })
}
```

---

## Performance Best Practices

- Use Server Components by default
- Use Client Components only when needed
- Add database indexes for common queries
- Use `include` to avoid N+1 queries
- Cache API responses: `{ next: { revalidate: 3600 } }`

---

## Security Checklist

- ✅ All routes protected by authentication
- ✅ All APIs check session
- ✅ RBAC enforced at API level
- ✅ Input validated with Zod
- ✅ Prisma prevents SQL injection
- ✅ NEXTAUTH_SECRET in environment
- ✅ OAuth tokens encrypted
- ✅ Session cookies httpOnly

---

## Future Enhancements

**Phase 2:**
- Complete document upload
- Implement bookmarks
- Auto calendar sync
- Toast notifications
- Pagination

**Phase 3:**
- Email notifications
- PDF export
- Analytics dashboard
- Audit logs

**Phase 4:**
- React Native mobile app
- Offline mode
- OCR for documents
- AI summarization
- Multi-language

---

## Documentation Files

- `README.md` - Setup & deployment
- `QUICKSTART.md` - 10-min setup
- `TESTING_GUIDE.md` - Complete testing
- `SCHEMA.md` - Database details
- `ARCHITECTURE.md` - Tech architecture
- `UI_COMPLETE_SUMMARY.md` - Build summary
- `QUICK_REFERENCE.md` - Command cheat sheet
- `CLAUDE.md` - This file

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

## Project Status

✅ **Complete:**
- Authentication system
- Dashboard layout
- Case management
- Legal research
- API routes
- RBAC system
- Mobile responsive

🔄 **In Progress:**
- Document management
- Bookmarks

📋 **Planned:**
- Mobile app
- Advanced features

---

**Status:** UI Complete, Ready for Testing  
**Last Updated:** May 2026  
**Owner:** jputhiyottil

---

**Quick Commands:**
```bash
npx prisma dev && npm run dev  # Start
npx prisma studio              # Database GUI
vercel --prod                  # Deploy
```

**Important URLs:**
- App: http://localhost:3000
- DB GUI: http://localhost:5555
- Docs: See documentation files above

---

*Keep this file updated as project evolves*
