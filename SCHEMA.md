# VakilsDay Database Schema

## Overview
PostgreSQL database schema for VakilsDay, a Legal-Tech SaaS platform for Indian litigation lawyers. Supports role-based access control (RBAC) with Admin, Associate, and Clerk roles.

## Schema Design

### 1. Authentication Tables (NextAuth.js)

#### `users`
Core user table with role-based access.

```prisma
id              String (CUID)
name            String?
email           String (unique)
emailVerified   DateTime?
image           String?
role            Role (ADMIN | ASSOCIATE | CLERK)
createdAt       DateTime
updatedAt       DateTime
```

**Relationships:**
- One-to-many: `accounts`, `sessions`
- One-to-many: `assignedCases` (via CaseAssignment)
- One-to-many: `hearingNotes`
- One-to-many: `researchBookmarks`

#### `accounts`
OAuth account linking (Google OAuth 2.0).

```prisma
id                String (CUID)
userId            String (FK → users)
type              String
provider          String
providerAccountId String
refresh_token     Text?
access_token      Text?
expires_at        Int?
token_type        String?
scope             String?
id_token          Text?
session_state     String?
```

**Unique constraint:** `[provider, providerAccountId]`

#### `sessions`
Active session tracking.

```prisma
id           String (CUID)
sessionToken String (unique)
userId       String (FK → users)
expires      DateTime
```

#### `verification_tokens`
Email verification tokens.

```prisma
identifier String
token      String (unique)
expires    DateTime
```

**Unique constraint:** `[identifier, token]`

---

### 2. Core Legal Management Tables

#### `cases`
Primary case tracking table.

```prisma
id                    String (CUID)
caseNumber            String (unique)
courtName             String
courtNumber           String?
petitionerName        String
respondentName        String
judgeName             String?
opposingCounselName   String?
opposingCounselPhone  String?
status                CaseStatus (ACTIVE | PENDING | CLOSED | ARCHIVED)
filingDate            DateTime
nextHearingDate       DateTime? (indexed)
synopsis              Text?
createdAt             DateTime
updatedAt             DateTime
```

**Indexes:**
- `nextHearingDate` (for "Today's Schedule" queries)
- `status` (for filtering active cases)

**Relationships:**
- One-to-many: `assignments` (via CaseAssignment)
- One-to-many: `hearings`
- One-to-many: `documents`

#### `case_assignments`
Many-to-many junction table linking users to cases (RBAC enforcement).

```prisma
id         String (CUID)
caseId     String (FK → cases)
userId     String (FK → users)
assignedAt DateTime
```

**Unique constraint:** `[caseId, userId]`

**Access Logic:**
- **Admin**: Can view all cases (no assignment required)
- **Associate/Clerk**: Can only view assigned cases

#### `hearings`
Running timeline of all past and future hearings.

```prisma
id              String (CUID)
caseId          String (FK → cases, indexed)
hearingDate     DateTime (indexed)
itemNumber      String?
outcome         Text?
nextHearingDate DateTime?
createdAt       DateTime
updatedAt       DateTime
```

**Index:** `[caseId, hearingDate]` (for timeline queries)

**Relationships:**
- Many-to-one: `case`
- One-to-many: `notes` (HearingNote)

#### `hearing_notes`
Detailed notes for each hearing with privacy controls.

```prisma
id        String (CUID)
hearingId String (FK → hearings)
userId    String (FK → users)
content   Text
isPrivate Boolean (default: false)
createdAt DateTime
updatedAt DateTime
```

**Privacy Rules:**
- **Admin/Associate**: Can create private notes, view all notes
- **Clerk**: Can only create public notes, cannot view private notes

#### `documents`
File metadata (actual files stored in Supabase/Vercel Blob).

```prisma
id           String (CUID)
caseId       String (FK → cases, indexed)
title        String
documentType DocumentType (PETITION | EVIDENCE | ANNEXURE | ORDER | OTHER)
storageUrl   String (Supabase/Blob URL)
fileSize     Int?
mimeType     String?
uploadedBy   String (user ID)
createdAt    DateTime
updatedAt    DateTime
```

**Index:** `[caseId, documentType]` (for folder-based UI)

**Storage Structure:**
```
/cases/{caseId}/
  /petitions/
  /evidence/
  /annexures/
  /orders/
  /other/
```

#### `research_bookmarks`
Saved legal research (Bare Acts, Judgments, Articles).

```prisma
id         String (CUID)
userId     String (FK → users, indexed)
title      String
sourceType String (e.g., "Bare Act", "Judgment", "Article")
sourceUrl  String?
content    Text (cached search result or excerpt)
tags       String[] (PostgreSQL array)
createdAt  DateTime
updatedAt  DateTime
```

---

## Role-Based Access Control (RBAC)

### Permission Matrix

| Resource                | Admin | Associate | Clerk |
|-------------------------|-------|-----------|-------|
| **Cases**               |       |           |       |
| View All Cases          | ✅     | ❌         | ❌     |
| View Assigned Cases     | ✅     | ✅         | ✅     |
| Create/Edit Cases       | ✅     | ✅         | ❌     |
| Delete Cases            | ✅     | ❌         | ❌     |
| Update Next Hearing Date| ✅     | ✅         | ✅     |
| **Documents**           |       |           |       |
| Upload Documents        | ✅     | ✅         | ✅     |
| Delete Documents        | ✅     | ✅         | ❌     |
| **Notes**               |       |           |       |
| View Private Notes      | ✅     | ✅         | ❌     |
| Create Private Notes    | ✅     | ✅         | ❌     |
| Create Public Notes     | ✅     | ✅         | ✅     |
| **Research**            |       |           |       |
| Access Legal Search     | ✅     | ✅         | ❌     |
| Save Bookmarks          | ✅     | ✅         | ❌     |
| **Users**               |       |           |       |
| Manage Users/Roles      | ✅     | ❌         | ❌     |

---

## API Integration Points

### 1. Legal Search APIs

#### IndiaCode API (Bare Acts)
- **Base URL:** `https://api.indiacode.nic.in`
- **Endpoints:**
  - `GET /search?q={query}&limit={limit}` - Search acts
  - `GET /acts/{actId}` - Get act details
- **Caching:** 1 hour (Next.js revalidation)

#### Indian Kanoon API (Judgments)
- **Base URL:** `https://api.indiankanoon.org`
- **Endpoints:**
  - `GET /search/?formInput={query}&court={court}&pagenum=0` - Search judgments
  - `GET /doc/{docId}/` - Get judgment details
- **Caching:** 1 hour (Next.js revalidation)

### 2. Google Calendar API

**Scope Required:** `https://www.googleapis.com/auth/calendar`

**Sync Triggers:**
- When a Clerk/Lawyer updates `nextHearingDate` in a `Hearing` record
- Serverless function at `/api/calendar/sync`

**Event Structure:**
```json
{
  "summary": "Court Hearing: {caseNumber}",
  "description": "Case details...",
  "location": "{courtName}",
  "start": { "dateTime": "{hearing date at 10:00 AM}", "timeZone": "Asia/Kolkata" },
  "end": { "dateTime": "{hearing date at 5:00 PM}", "timeZone": "Asia/Kolkata" },
  "reminders": {
    "overrides": [
      { "method": "email", "minutes": 1440 },
      { "method": "popup", "minutes": 60 },
      { "method": "popup", "minutes": 30 }
    ]
  },
  "extendedProperties": {
    "private": {
      "vakilsdayCaseId": "{caseId}",
      "vakilsdaySource": "hearing_update"
    }
  }
}
```

---

## Query Performance Optimization

### Key Indexes
1. `cases(nextHearingDate)` - "Today's Schedule" dashboard
2. `cases(status)` - Active case filtering
3. `hearings(caseId, hearingDate)` - Timeline queries
4. `documents(caseId, documentType)` - Folder navigation
5. `research_bookmarks(userId)` - User-specific bookmarks

### Dashboard Query (Today's Schedule)
```sql
SELECT c.*, u.name as assignedTo
FROM cases c
LEFT JOIN case_assignments ca ON c.id = ca.caseId
LEFT JOIN users u ON ca.userId = u.id
WHERE c.nextHearingDate::date = CURRENT_DATE
  AND c.status = 'ACTIVE'
ORDER BY c.courtNumber, c.nextHearingDate;
```

### Running Summary Query (Case Timeline)
```sql
SELECT h.*, hn.content, u.name as notedBy
FROM hearings h
LEFT JOIN hearing_notes hn ON h.id = hn.hearingId
LEFT JOIN users u ON hn.userId = u.id
WHERE h.caseId = $1
  AND (hn.isPrivate = false OR u.role IN ('ADMIN', 'ASSOCIATE'))
ORDER BY h.hearingDate DESC;
```

---

## Migration Strategy

1. **Initial Migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Seed Data (Optional):**
   - Create default Admin user
   - Populate common Indian courts
   - Add sample case data for testing

3. **Deployment:**
   - Use Vercel Postgres for production
   - Configure environment variables in Vercel dashboard
   - Enable auto-migrations in CI/CD pipeline

---

## Future Enhancements

1. **Full-Text Search:**
   - Add `tsvector` columns to `cases` and `hearings` for PostgreSQL FTS
   - Enable fuzzy matching for case number searches

2. **Audit Logs:**
   - Create `audit_logs` table to track all data modifications
   - Required for compliance and security audits

3. **Case Tags/Labels:**
   - Add `case_tags` junction table for custom categorization
   - Support filtering by practice area (Civil, Criminal, Family, etc.)

4. **Notifications:**
   - Add `notifications` table for in-app alerts
   - Integrate with Firebase Cloud Messaging for mobile push
