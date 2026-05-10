# VakilsDay Architecture Flow

## Multi-Tenant Data Model

```
┌─────────────────────────────────────────────────────────┐
│                    ORGANIZATIONS                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  Org: Shah &     │  │  Org: Kumar      │            │
│  │  Associates      │  │  Law Firm        │            │
│  │  slug: shah-law  │  │  slug: kumar-law │            │
│  └────────┬─────────┘  └────────┬─────────┘            │
│           │                     │                        │
│  ┌────────▼─────────┐  ┌────────▼─────────┐            │
│  │ Users:           │  │ Users:           │            │
│  │ - Ravi (ADMIN)   │  │ - Priya (ADMIN)  │            │
│  │ - Anjali (ASSOC) │  │ - Suresh (ASSOC) │            │
│  │ - Raj (CLERK)    │  │                  │            │
│  └────────┬─────────┘  └────────┬─────────┘            │
│           │                     │                        │
│  ┌────────▼─────────┐  ┌────────▼─────────┐            │
│  │ Cases:           │  │ Cases:           │            │
│  │ - Case 123       │  │ - Case 456       │            │
│  │ - Case 124       │  │ - Case 457       │            │
│  │ - Case 125       │  │                  │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘

🔒 Complete data isolation between organizations
```

---

## User Journey Flow

### New User Onboarding

```
┌─────────────┐
│  User opens │
│ localhost:  │
│    3000     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Landing    │     Not authenticated
│   Page      ├────────────────────┐
│  (public)   │                    │
└──────┬──────┘                    │
       │ Clicks "Sign In"          │
       ▼                           ▼
┌─────────────┐              ┌─────────────┐
│   Google    │              │   Redirect  │
│   OAuth     │              │     to      │
│   Sign-in   │              │ /auth/signin│
└──────┬──────┘              └─────────────┘
       │
       │ Authenticated
       ▼
┌─────────────┐
│  NextAuth   │
│  Callback   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Has org?    │──── Yes ────▶ Dashboard
└──────┬──────┘
       │ No
       ▼
┌─────────────┐
│ Onboarding  │
│    Page     │
└──────┬──────┘
       │ Fill form:
       │ - Firm name
       │ - Your name
       ▼
┌─────────────┐
│   POST      │
│    /api/    │
│organizations│
└──────┬──────┘
       │
       │ Creates:
       │ - Organization
       │ - Sets user as ADMIN
       │ - Links user to org
       ▼
┌─────────────┐
│  Dashboard  │
│  (as ADMIN) │
└─────────────┘
```

---

## Returning User Flow

```
┌─────────────┐
│  User opens │
│ localhost:  │
│    3000     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Check      │
│  Session    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Authenticated│──── No ─────▶ Landing Page
│      ?      │
└──────┬──────┘
       │ Yes
       ▼
┌─────────────┐
│ Has org?    │──── No ─────▶ Onboarding
└──────┬──────┘
       │ Yes
       ▼
┌─────────────┐
│  Dashboard  │
│  (Continue  │
│   work)     │
└─────────────┘
```

---

## Database Query Isolation

### Before (Single Tenant)
```typescript
// ❌ Could see ALL cases from ALL firms
const cases = await prisma.case.findMany()
```

### After (Multi-Tenant)
```typescript
// ✅ Only see cases from YOUR organization
const user = await getUser(session.user.email)

const cases = await prisma.case.findMany({
  where: {
    organizationId: user.organizationId  // 🔒 Isolation
  }
})
```

---

## API Route Pattern (Multi-Tenant)

```typescript
// app/api/cases/route.ts

export async function GET(request: NextRequest) {
  // Step 1: Authenticate
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: Get user + organization
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true, role: true }
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Step 3: Query with organization filter
  const cases = await prisma.case.findMany({
    where: {
      organizationId: user.organizationId  // 🔒 Isolation
    }
  })

  return NextResponse.json({ cases })
}
```

---

## Role-Based Access (Within Organization)

```
Organization: "Shah & Associates"
├── Ravi (ADMIN)
│   ✅ View all cases in org
│   ✅ Create/edit/delete cases
│   ✅ Invite users
│   ✅ Manage settings
│
├── Anjali (ASSOCIATE)
│   ✅ View assigned cases only
│   ✅ Create/edit cases
│   ✅ Legal research
│   ❌ Delete cases
│   ❌ Manage users
│
└── Raj (CLERK)
    ✅ View assigned cases only
    ✅ Update hearing dates
    ✅ Add case notes
    ❌ Create cases
    ❌ Edit case details
    ❌ Delete cases
```

**Note:** Roles are scoped to organizations. Ravi is ADMIN in "Shah & Associates" but has no access to "Kumar Law Firm".

---

## Security Layers

### Layer 1: Authentication
```
NextAuth → Google OAuth → Session
```

### Layer 2: Organization Membership
```
Check: user.organizationId exists
```

### Layer 3: Role-Based Permissions
```
Check: user.role has permission for action
```

### Layer 4: Database Queries
```
Filter: All queries include organizationId
```

### Layer 5: Case Assignment
```
Check: ASSOCIATE/CLERK can only see assigned cases
```

---

## Database Schema Relationships

```
Organization
    |
    ├─── Users (1:many)
    │      |
    │      └─── Role (ADMIN/ASSOCIATE/CLERK)
    │
    └─── Cases (1:many)
           |
           ├─── CaseAssignments (many:many with Users)
           ├─── Hearings (1:many)
           └─── Documents (1:many)
```

---

## File Structure (Key Files)

```
vakilsday/
├── app/
│   ├── page.tsx                    # 🌐 Public landing page
│   ├── onboarding/page.tsx         # 🆕 Org creation
│   ├── (auth)/signin/page.tsx      # 🔐 Google sign-in
│   ├── (dashboard)/layout.tsx      # 🛡️ Check org membership
│   └── api/
│       └── organizations/route.ts  # 📝 Create org API
│
├── prisma/
│   └── schema.prisma              # 🗄️ Organization model
│
└── components/
    └── onboarding/
        └── onboarding-form.tsx    # 📋 Onboarding UI
```

---

## Migration Changes

### Added
- `organizations` table
- `users.organizationId` column
- `cases.organizationId` column

### Changed
- Case number constraint: Now unique per organization (not globally)

### Indexes
- `users(organizationId)` for fast lookups
- `cases(organizationId)` for isolation queries

---

## Future: Team Invitations

```
Admin Flow:
┌─────────────┐
│ Admin goes  │
│ to Settings │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Click       │
│ "Invite     │
│  Member"    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Enter email │
│ Select role │
│ (ASSOC/CLK) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   POST      │
│ /api/invites│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Email sent  │
│ with token  │
└─────────────┘

Invitee Flow:
┌─────────────┐
│ Receives    │
│ invite link │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Clicks link │
│ with token  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Sign in     │
│ with Google │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Validate    │
│ token       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Join org    │
│ with role   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Dashboard   │
│ (as member) │
└─────────────┘
```

---

## Summary

✅ **Multi-tenant:** Each law firm has isolated workspace  
✅ **Self-service:** Anyone can create their firm  
✅ **Role-based:** Admins have full control within their org  
✅ **Secure:** Complete data isolation via organizationId  
🔄 **Team invites:** To be implemented next

---

**Current Status:** Foundation ready for testing!
