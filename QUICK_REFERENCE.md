# VakilsDay - Quick Reference

One-page reference for all URLs and commands.

---

## 🚀 Start Application

```bash
# Start database
npx prisma dev

# Start dev server
npm run dev

# Open in browser
http://localhost:3000
```

---

## 📍 URL Map

### Public Routes
- `/` - Homepage (redirects to /dashboard)
- `/signin` - Sign in with Google
- `/auth/error` - Authentication error page

### Dashboard Routes
- `/dashboard` - Today's Schedule
- `/cases` - Case list
- `/cases/new` - Create new case
- `/cases/[id]` - Case detail
- `/research` - Research hub
- `/research/bare-acts` - Search Indian acts
- `/research/judgments` - Search judgments
- `/research/bookmarks` - Saved bookmarks
- `/settings` - User settings

### API Routes
- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/[id]` - Get case
- `PATCH /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case
- `POST /api/hearings` - Create hearing
- `GET /api/search/bare-acts?q={query}` - Search acts
- `GET /api/search/judgments?q={query}` - Search judgments
- `POST /api/calendar/sync` - Sync calendar

---

## 🔑 Key Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
```

### Database
```bash
npx prisma dev                    # Start local Postgres
npx prisma studio                 # Open DB GUI (localhost:5555)
npx prisma migrate dev            # Create & run migration
npx prisma migrate deploy         # Run migrations in production
npx prisma generate               # Generate Prisma client
npx prisma db push                # Push schema without migration
npx prisma db pull                # Pull schema from database
```

### Setup
```bash
npm install                       # Install dependencies
openssl rand -base64 32           # Generate NEXTAUTH_SECRET
```

---

## 👥 User Roles

| Role      | Cases | Create | Edit | Delete | Private Notes | Research |
|-----------|-------|--------|------|--------|---------------|----------|
| ADMIN     | All   | ✅     | ✅   | ✅     | ✅            | ✅       |
| ASSOCIATE | Assigned | ✅  | ✅   | ❌     | ✅            | ✅       |
| CLERK     | Assigned | ❌  | Dates only | ❌ | ❌       | ❌       |

---

## 🗄️ Database Models

- `User` - User accounts
- `Account` - OAuth accounts
- `Session` - Active sessions
- `Case` - Legal cases
- `CaseAssignment` - User-case relationships
- `Hearing` - Court hearings
- `HearingNote` - Hearing notes
- `Document` - Case documents
- `ResearchBookmark` - Saved research

---

## 🎨 UI Components

Located in `components/ui/`:
- button, card, input, label, select, textarea
- badge, avatar, dropdown-menu, separator
- dialog, alert, tabs, table

Custom components in `components/`:
- `layout/sidebar.tsx` - Navigation sidebar
- `layout/header.tsx` - Top header with user menu
- `cases/hearing-form.tsx` - Add hearing dialog
- `cases/hearing-timeline.tsx` - Hearing timeline
- `providers/session-provider.tsx` - Auth provider

---

## 🔧 Environment Variables

Required in `.env`:
```env
DATABASE_URL="prisma+postgres://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" | `npx prisma generate && npm run dev` |
| Database connection failed | `npx prisma dev` then restart server |
| OAuth error | Check redirect URI in Google Console |
| Session not persisting | Clear cookies, restart server |
| API returns 401 | Check authentication, sign in again |

---

## 📚 Documentation Files

- `README.md` - Full setup and features
- `QUICKSTART.md` - 10-minute setup
- `SCHEMA.md` - Database structure
- `ARCHITECTURE.md` - Technical details
- `TESTING_GUIDE.md` - Testing instructions
- `UI_COMPLETE_SUMMARY.md` - UI build summary
- `QUICK_REFERENCE.md` - This file

---

## 🎯 Quick Test

```bash
# 1. Start everything
npx prisma dev
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Sign in with Google

# 4. Create a test case
# Go to /cases → New Case

# 5. Test search
# Go to /research/bare-acts
# Search: "Indian Penal Code"

# 6. Check database
npx prisma studio
```

---

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel Dashboard
# Run migrations in production
npx prisma migrate deploy
```

---

## 📞 Need Help?

1. Check **TESTING_GUIDE.md** for detailed testing
2. Check **ARCHITECTURE.md** for technical details
3. Check **SCHEMA.md** for database questions
4. Open GitHub issue if stuck

---

**Built with ⚖️ for Indian Lawyers**
