# Multi-Tenant Architecture Plan

## Goal
Allow any user to create their own law firm workspace and become admin.

## Changes Required

### 1. Database Schema
Add `Organization` model to support multiple law firms:

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String   // "Shah & Associates"
  slug        String   @unique  // "shah-associates"
  
  subscriptionTier String @default("FREE")  // FREE, BASIC, PRO
  maxUsers    Int      @default(5)
  
  users       User[]
  cases       Case[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model User {
  // Add organization link
  organizationId String
  organization   Organization @relation(...)
  role           Role @default(ASSOCIATE)  // Role within their org
}

model Case {
  // Add organization isolation
  organizationId String
  organization   Organization @relation(...)
}
```

### 2. User Flow

#### Landing Page (/)
- Show marketing page with "Sign in with Google" button
- If authenticated → redirect to /onboarding or /dashboard

#### Onboarding (/onboarding)
- Show only if user has no organization
- Form: "Create Your Law Firm"
  - Firm Name (e.g., "Shah & Associates")
  - Your Name (pre-filled from Google)
  - City/State (optional)
- On submit:
  - Create Organization
  - Set user as ADMIN
  - Redirect to /dashboard

#### Dashboard (/dashboard)
- Check if user.organizationId exists
  - Yes → Show dashboard
  - No → Redirect to /onboarding

### 3. Implementation Steps

**Step 1:** Update Prisma schema
**Step 2:** Create migration
**Step 3:** Update landing page (public)
**Step 4:** Create onboarding page
**Step 5:** Update auth callback to check org
**Step 6:** Add org context to all queries
**Step 7:** Update settings to show firm info

### 4. Security

- All queries must filter by `organizationId`
- Users can only see data from their org
- Role permissions apply within org context
- API routes validate org membership

### 5. Future Features

- Invite team members by email
- Transfer admin role
- Merge organizations
- Organization settings page
- Billing per organization

## Files to Create/Modify

### New Files:
- `app/onboarding/page.tsx` - Firm creation form
- `app/api/organizations/route.ts` - Create org API
- `lib/utils/organization.ts` - Org helpers

### Modified Files:
- `prisma/schema.prisma` - Add Organization model
- `app/page.tsx` - Landing page instead of redirect
- `app/(dashboard)/layout.tsx` - Check org membership
- `lib/auth.ts` - Auto-create user, not org
- All API routes - Filter by organizationId
