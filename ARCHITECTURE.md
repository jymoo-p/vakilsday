# VakilsDay Technical Architecture

## Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (to be added)
- **State Management:** React Context + Server Components
- **Forms:** React Hook Form + Zod validation

### Backend
- **API:** Next.js API Routes (Serverless)
- **Database:** Vercel Postgres (PostgreSQL)
- **ORM:** Prisma
- **Auth:** NextAuth.js (Google OAuth 2.0)
- **File Storage:** Supabase Storage / Vercel Blob
- **External APIs:**
  - IndiaCode API (Bare Acts)
  - Indian Kanoon API (Judgments)
  - Google Calendar API (Sync)

### Mobile
- **Framework:** React Native (Expo)
- **Shared Logic:** Monorepo with `@vakilsday/shared` package

### Deployment
- **Hosting:** Vercel
- **Database:** Vercel Postgres
- **CDN:** Vercel Edge Network
- **Mobile:** Expo EAS Build

---

## Project Structure

```
vakilsday/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (sign-in, sign-out)
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── page.tsx              # Today's Schedule
│   │   ├── cases/
│   │   │   ├── page.tsx          # Case list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Case details
│   │   │   │   ├── timeline/     # Running summary
│   │   │   │   ├── documents/    # The Brief
│   │   │   │   └── edit/         # Edit case
│   │   │   └── new/              # Create case
│   │   ├── research/
│   │   │   ├── bare-acts/        # Act search
│   │   │   ├── judgments/        # Judgment search
│   │   │   └── bookmarks/        # Saved research
│   │   └── settings/             # User & role management (Admin only)
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   ├── cases/                # Case CRUD
│   │   ├── hearings/             # Hearing CRUD
│   │   ├── documents/            # Document upload/delete
│   │   ├── search/
│   │   │   ├── bare-acts/        # Bare Act search proxy
│   │   │   └── judgments/        # Judgment search proxy
│   │   └── calendar/
│   │       └── sync/             # Google Calendar webhook
│   └── layout.tsx                # Root layout
├── lib/
│   ├── prisma.ts                 # Prisma client instance
│   ├── auth.ts                   # NextAuth configuration
│   ├── services/
│   │   ├── legal-search.ts       # Legal API integration
│   │   └── calendar-sync.ts      # Google Calendar service
│   ├── utils/
│   │   ├── rbac.ts               # Role-based access helpers
│   │   └── date.ts               # Date formatting utilities
│   └── validations/              # Zod schemas
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── cases/                    # Case-related components
│   ├── search/                   # Search UI components
│   └── layout/                   # Nav, sidebar, header
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
├── types/
│   └── next-auth.d.ts            # NextAuth type extensions
├── public/                       # Static assets
├── .env                          # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Data Flow

### 1. Authentication Flow

```
User clicks "Sign in with Google"
  ↓
NextAuth redirects to Google OAuth
  ↓
Google returns auth tokens (access + refresh)
  ↓
NextAuth stores tokens in `accounts` table
  ↓
Session created in `sessions` table
  ↓
User redirected to /dashboard
```

**Key Points:**
- Refresh token stored for Google Calendar API access
- Session strategy: Database (not JWT) for revocation support
- Role assigned on first sign-in (default: ASSOCIATE)

---

### 2. Case Management Flow

#### Creating a Case (Admin/Associate Only)

```
1. User submits case form (/cases/new)
   ↓
2. Client-side validation (Zod schema)
   ↓
3. POST /api/cases
   ↓
4. Server validates user role (RBAC check)
   ↓
5. Prisma creates `Case` record
   ↓
6. Auto-assign case to creator (CaseAssignment)
   ↓
7. Return case ID, redirect to /cases/[id]
```

#### Updating Next Hearing Date (All Roles)

```
1. User updates "Next Hearing Date" field
   ↓
2. PATCH /api/cases/[id]/hearing-date
   ↓
3. Server validates:
   - User is assigned to case OR is Admin
   - User role has UPDATE_HEARING_DATE permission
   ↓
4. Update `Case.nextHearingDate` in DB
   ↓
5. Trigger calendar sync webhook
   ↓
6. POST /api/calendar/sync
   ↓
7. Fetch user's Google OAuth tokens
   ↓
8. Call Google Calendar API:
   - Create/Update calendar event
   - Set reminders (1 day, 1 hour, 30 min)
   ↓
9. Store calendar event ID in response
   ↓
10. Return success to client
```

---

### 3. Legal Search Flow

#### Bare Act Search

```
User types query in search bar (/research/bare-acts)
  ↓
Debounced search (500ms delay)
  ↓
GET /api/search/bare-acts?q={query}&limit=10
  ↓
Server calls IndiaCode API
  ↓
Format results (extract sections, URLs)
  ↓
Return JSON to client
  ↓
Render results as cards with:
  - Act title + year
  - Key sections
  - "View Full Act" link
```

**Caching Strategy:**
- Next.js caches responses for 1 hour (`revalidate: 3600`)
- If API fails, return fallback with common acts (IPC, CrPC, etc.)

#### Judgment Search

```
User submits query + optional court filter
  ↓
GET /api/search/judgments?q={query}&court={court}
  ↓
Server calls Indian Kanoon API
  ↓
Format results (extract citation, judges, date)
  ↓
Return JSON
  ↓
Render results with:
  - Case title
  - Court + Date
  - Citation
  - "View Judgment" link (opens Indian Kanoon)
```

---

### 4. Document Management Flow

#### Uploading a Document

```
1. User selects file + document type (/cases/[id]/documents)
   ↓
2. Client validates file:
   - Max size: 50 MB
   - Allowed types: PDF, DOCX, JPEG, PNG
   ↓
3. Upload to Supabase Storage:
   - Path: `/cases/{caseId}/{documentType}/{filename}`
   - Public URL returned
   ↓
4. POST /api/documents
   - Body: { caseId, title, documentType, storageUrl, fileSize, mimeType }
   ↓
5. Prisma creates `Document` record
   ↓
6. Return document metadata
   ↓
7. Update UI (refresh document list)
```

#### Deleting a Document (Admin/Associate Only)

```
1. User clicks "Delete" on document
   ↓
2. Confirm dialog
   ↓
3. DELETE /api/documents/[id]
   ↓
4. Server validates:
   - User role has DELETE permission
   - Document exists and belongs to case
   ↓
5. Delete file from Supabase Storage
   ↓
6. Prisma deletes `Document` record (cascade)
   ↓
7. Return success
   ↓
8. Update UI (remove from list)
```

---

## Security Considerations

### 1. Authentication & Authorization

- **Google OAuth Scopes:**
  - `openid email profile` (user identity)
  - `https://www.googleapis.com/auth/calendar` (calendar sync)

- **Session Management:**
  - Database sessions (30-day expiry)
  - Auto-logout on token expiration
  - Secure cookies (`httpOnly`, `sameSite: lax`)

- **RBAC Enforcement:**
  - All API routes check user role via `getServerSession()`
  - Client-side checks for UI rendering (not security-critical)
  - Database-level access via `CaseAssignment` table

### 2. Data Protection

- **Private Notes:**
  - Filtered at query level (Prisma `where` clause)
  - Clerk users cannot access `isPrivate: true` notes

- **Case Isolation:**
  - Associates/Clerks can only view assigned cases
  - Admins bypass assignment checks (`canViewAllCases()`)

- **File Storage:**
  - Signed URLs for private documents (Supabase RLS)
  - Delete files when parent case is deleted (cascade)

### 3. Input Validation

- **Zod Schemas:**
  - All user inputs validated server-side
  - Sanitize HTML in rich text fields (case synopsis, notes)

- **SQL Injection:**
  - Prisma ORM prevents SQL injection (parameterized queries)

- **XSS Prevention:**
  - Next.js auto-escapes JSX
  - Use `dangerouslySetInnerHTML` only for sanitized content

---

## Performance Optimization

### 1. Database Queries

- **Indexes:**
  - `cases(nextHearingDate)` - Dashboard query
  - `hearings(caseId, hearingDate)` - Timeline query
  - `documents(caseId, documentType)` - Folder navigation

- **Connection Pooling:**
  - Prisma handles pooling automatically
  - Vercel Postgres supports up to 100 concurrent connections

### 2. API Caching

- **Next.js Revalidation:**
  - Legal search results: 1 hour cache
  - Static pages: Incremental Static Regeneration (ISR)

- **CDN Caching:**
  - Static assets cached at Vercel Edge
  - API responses cached via `Cache-Control` headers

### 3. Client-Side Optimization

- **Code Splitting:**
  - Next.js automatic route-based splitting
  - Lazy load heavy components (PDF viewer, rich text editor)

- **Image Optimization:**
  - Next.js `<Image>` component for responsive images
  - WebP format with fallbacks

---

## Deployment Pipeline

### 1. Development Workflow

```bash
# Local development
npm run dev

# Run Prisma Studio (DB GUI)
npx prisma studio

# Create migration
npx prisma migrate dev --name <migration-name>

# Seed database
npx prisma db seed
```

### 2. Vercel Deployment

1. **Push to GitHub:**
   - `main` branch → Production
   - `dev` branch → Preview

2. **Automatic Actions:**
   - Install dependencies
   - Run Prisma migrations (`npx prisma migrate deploy`)
   - Build Next.js app
   - Deploy to Vercel Edge

3. **Environment Variables:**
   ```
   DATABASE_URL (Vercel Postgres)
   NEXTAUTH_URL (Production domain)
   NEXTAUTH_SECRET (Generated secret)
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ```

---

## Monitoring & Logging

### 1. Application Monitoring

- **Vercel Analytics:**
  - Page load times
  - Core Web Vitals
  - Error tracking

- **Sentry (Optional):**
  - Real-time error alerts
  - Performance monitoring
  - User session replay

### 2. Database Monitoring

- **Vercel Postgres Dashboard:**
  - Query performance
  - Connection pool usage
  - Storage metrics

### 3. Logging Strategy

- **Server Logs:**
  - API errors logged to `console.error()`
  - Vercel captures logs for 7 days

- **Audit Trail (Future):**
  - Log all case updates, document changes
  - Store in `audit_logs` table

---

## Mobile App Strategy (React Native)

### Shared Codebase

```
vakilsday-monorepo/
├── packages/
│   ├── web/                  # Next.js app (existing)
│   ├── mobile/               # React Native app (Expo)
│   └── shared/               # Shared types, utils, API client
│       ├── types/
│       ├── api/
│       └── utils/
```

### Mobile-Specific Features

1. **Offline Mode:**
   - Cache today's schedule using React Native AsyncStorage
   - Sync on reconnection

2. **Camera Integration:**
   - Upload order sheets directly from courtroom
   - OCR for extracting case numbers (future)

3. **Push Notifications:**
   - Hearing reminders (Firebase Cloud Messaging)
   - New case assignments

4. **Biometric Auth:**
   - Touch ID / Face ID support

---

## Next Steps (Phase 2)

1. **UI Components:**
   - Install shadcn/ui
   - Build dashboard layout
   - Create case card components

2. **API Routes:**
   - Complete CRUD for Cases, Hearings, Documents
   - Add pagination and filtering

3. **Testing:**
   - Unit tests (Jest)
   - Integration tests (Playwright)
   - E2E tests for critical flows

4. **Mobile App:**
   - Initialize Expo project
   - Set up shared package
   - Build authentication flow
