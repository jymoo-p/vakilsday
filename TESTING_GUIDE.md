# VakilsDay - Testing Guide

Complete guide to test all features of VakilsDay.

---

## Prerequisites

Before testing, ensure you have:

1. ✅ Completed setup (see QUICKSTART.md)
2. ✅ Database migrated: `npx prisma migrate dev`
3. ✅ Dev server running: `npm run dev`
4. ✅ Google OAuth configured

---

## Test Scenarios

### 1. Authentication Flow

#### Test Sign-In
1. Navigate to `http://localhost:3000`
2. Should automatically redirect to `/signin`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. **Expected:** Redirect to `/dashboard` with your name and role badge in header

#### Test Session Persistence
1. After signing in, close browser
2. Reopen and navigate to `http://localhost:3000/dashboard`
3. **Expected:** Should remain logged in (session persists)

#### Test Sign-Out
1. Click on your avatar in the header
2. Click "Sign out"
3. **Expected:** Redirect to `/signin`
4. Try accessing `/dashboard` directly
5. **Expected:** Redirect back to `/signin`

---

### 2. Dashboard (Today's Schedule)

#### Test Empty Dashboard
1. Sign in with new account (no cases yet)
2. **Expected:** See "No hearings today" message

#### Test Dashboard with Today's Hearings
1. First create a case with today's date as `nextHearingDate` (see Case Management tests)
2. Go to `/dashboard`
3. **Expected:** See case card showing:
   - Case number
   - Parties (Petitioner vs Respondent)
   - Court name and number
   - Judge name
   - Assigned users
   - Status badge

#### Test Upcoming Cases Section
1. Create cases with hearing dates in next 7 days
2. **Expected:** See "Upcoming This Week" section with cases sorted by date

---

### 3. Case Management

#### Test Case List
1. Navigate to `/cases`
2. **Expected:** 
   - See "New Case" button (if ADMIN or ASSOCIATE)
   - See search bar
   - See list of cases (empty if no cases)

#### Test Create New Case
1. Click "New Case" button
2. Fill out form:
   ```
   Case Number: CRL/123/2026
   Court Name: Delhi High Court
   Court Number: 5
   Petitioner: Ramesh Kumar
   Respondent: State of Delhi
   Judge: Hon'ble Justice XYZ
   Opposing Counsel Name: Adv. John Doe
   Opposing Counsel Phone: 9876543210
   Filing Date: 2026-01-15
   Next Hearing Date: 2026-05-15 (optional)
   Synopsis: Brief case description
   ```
3. Click "Create Case"
4. **Expected:**
   - Success message
   - Redirect to case detail page
   - Case appears in case list

#### Test Case Detail Page
1. Open any case from the list
2. **Expected:** See three tabs:
   - **Overview:** Full case details
   - **Timeline:** Hearing history (vertical timeline)
   - **Documents:** Document count and placeholder

#### Test Add Hearing
1. On case detail page, click "Add Hearing"
2. Fill out dialog form:
   ```
   Hearing Date: 2026-05-10
   Item Number: 25
   Outcome: Arguments heard, matter reserved
   Next Hearing Date: 2026-06-15
   ```
3. Click "Add Hearing"
4. **Expected:**
   - Dialog closes
   - New hearing appears in timeline
   - "Next Hearing Date" on case updated

#### Test Search Cases
1. Go to `/cases`
2. Type case number in search bar
3. **Expected:** Live filtering of cases as you type

#### Test RBAC (Role-Based Access)
**As CLERK:**
1. Sign in as Clerk role user
2. **Expected:** 
   - No "New Case" button
   - Can view assigned cases only
   - Can add hearings
   - Cannot edit case details

**As ADMIN:**
1. Sign in as Admin role user
2. **Expected:**
   - Can view all cases (not just assigned)
   - Can create, edit, and delete cases
   - Full access to all features

---

### 4. Legal Research

#### Test Research Hub
1. Navigate to `/research`
2. **Expected:** See three cards:
   - Bare Acts
   - Judgments
   - Bookmarks

#### Test Bare Acts Search
1. Click "Search Acts" → `/research/bare-acts`
2. Enter search: "Indian Penal Code"
3. Click "Search"
4. **Expected:**
   - Loading indicator
   - Results showing:
     - Act title and year
     - Key sections (badges)
     - Excerpt
     - "View Full Act" button (opens IndiaCode)

**Try these searches:**
- "Indian Penal Code" → Should return IPC
- "Evidence Act" → Should return Indian Evidence Act
- "Criminal Procedure" → Should return CrPC

#### Test Judgment Search
1. Go to `/research/judgments`
2. Enter search: "habeas corpus"
3. Select court filter: "Supreme Court"
4. Click "Search"
5. **Expected:**
   - Results showing:
     - Case title
     - Court and date
     - Citation
     - Judges (badges)
     - Summary excerpt
     - "Read Full Judgment" button

**Try these searches:**
- "habeas corpus"
- "property dispute"
- "fundamental rights"

#### Test Court Filters
1. On judgments page, change court filter
2. Re-run search
3. **Expected:** Results update based on selected court

#### Test Empty Results
1. Search for gibberish: "xyzabc123"
2. **Expected:** "No results found" message with helpful tip

---

### 5. Settings Page

#### Test Profile Display
1. Navigate to `/settings`
2. **Expected:** See:
   - Your name and email
   - Role badge
   - Google Calendar integration status (Active)
   - Permissions list based on your role

#### Test Permission Display
**As ADMIN:**
- View all cases ✓
- Create and edit cases ✓
- Delete cases ✓
- Manage users ✓

**As ASSOCIATE:**
- View assigned cases ✓
- Create and edit cases ✓
- Add private notes ✓
- Legal research ✓

**As CLERK:**
- View assigned cases ✓
- Update hearing dates ✓
- Upload documents ✓
- View private notes ✗

---

### 6. Navigation & Layout

#### Test Sidebar Navigation
1. Click each menu item:
   - Dashboard → `/dashboard`
   - Cases → `/cases`
   - Research → `/research`
   - Settings → `/settings`
2. **Expected:** Active item highlighted in primary color

#### Test User Menu
1. Click avatar in header
2. **Expected:** Dropdown showing:
   - Your name and email
   - Profile option
   - Sign out option

#### Test Responsive Design
1. Resize browser to mobile width (< 768px)
2. **Expected:**
   - Sidebar collapses
   - Content adjusts to full width
   - Cards stack vertically
   - Text remains readable

---

### 7. API Endpoints

#### Test Case API
```bash
# Get all cases
curl http://localhost:3000/api/cases \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Create new case
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "caseNumber": "TEST/001/2026",
    "courtName": "Test Court",
    "petitionerName": "Test Petitioner",
    "respondentName": "Test Respondent",
    "filingDate": "2026-01-01"
  }'
```

#### Test Search APIs
```bash
# Bare Acts
curl "http://localhost:3000/api/search/bare-acts?q=indian+penal+code&limit=5"

# Judgments
curl "http://localhost:3000/api/search/judgments?q=habeas+corpus&court=supreme+court&limit=5"
```

**Expected:** JSON responses with results array

---

### 8. Database Verification

#### Using Prisma Studio
```bash
npx prisma studio
```

1. Open `http://localhost:5555`
2. Click on `User` model
3. **Expected:** See your user record with email and role
4. Click on `Case` model
5. **Expected:** See all cases you created
6. Click on `CaseAssignment` model
7. **Expected:** See case-user relationships

---

### 9. Error Handling

#### Test Invalid Case Number
1. Try creating case with duplicate case number
2. **Expected:** Error message: "Case number already exists"

#### Test Unauthorized Access
1. Sign out
2. Try navigating to `/dashboard` directly
3. **Expected:** Redirect to `/signin`

#### Test Failed API Call
1. In browser DevTools, go to Network tab
2. Throttle network to "Offline"
3. Try searching judgments
4. **Expected:** Error message in console, fallback data displayed

---

### 10. Google Calendar Integration

#### Test Calendar Sync (Manual)
1. Create a new case with next hearing date
2. In database, verify case has `nextHearingDate` set
3. Call calendar sync API:
```bash
curl -X POST http://localhost:3000/api/calendar/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "caseId": "your-case-id",
    "nextHearingDate": "2026-06-15T10:00:00Z",
    "action": "create"
  }'
```
4. Check your Google Calendar
5. **Expected:** New event created with case details

---

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution:**
```bash
npx prisma generate
npm run dev
```

### Issue: "Database connection failed"
**Solution:**
```bash
npx prisma dev  # Restart Postgres
npx prisma migrate dev
```

### Issue: "Google OAuth error"
**Solution:**
1. Check `.env` has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Verify redirect URI in Google Console: `http://localhost:3000/api/auth/callback/google`
3. Generate new `NEXTAUTH_SECRET`: `openssl rand -base64 32`

### Issue: "Legal search returns empty"
**Solution:**
- Expected behavior if external APIs are down
- Check fallback data is displayed (IPC, CrPC for Bare Acts)
- Verify network connectivity

### Issue: "Session not persisting"
**Solution:**
1. Clear browser cookies for `localhost:3000`
2. Restart dev server
3. Check database has `Session` table populated

---

## Performance Testing

### Load Testing
1. Create 50+ cases
2. Navigate to `/cases`
3. **Expected:** Page loads in < 2 seconds

### Search Performance
1. Search for common term: "Section 420"
2. **Expected:** Results appear in < 1 second (cached after first search)

---

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Security Testing

### Test RBAC Enforcement
1. Sign in as CLERK
2. Try accessing `/api/cases` with POST (create case)
3. **Expected:** 403 Forbidden error

### Test SQL Injection
1. In case search, enter: `' OR 1=1 --`
2. **Expected:** No results (Prisma prevents SQL injection)

### Test XSS
1. Create case with: `<script>alert('XSS')</script>` in synopsis
2. View case detail
3. **Expected:** Script not executed, rendered as text

---

## Final Checklist

Before marking complete, verify:

- [ ] All authentication flows work
- [ ] Dashboard shows today's hearings correctly
- [ ] Can create, view, edit cases
- [ ] Case timeline displays correctly
- [ ] Legal search returns results
- [ ] Settings page displays user info
- [ ] Navigation works across all pages
- [ ] Mobile responsive (test on phone or DevTools)
- [ ] No console errors
- [ ] Database populated correctly (check Prisma Studio)

---

## Reporting Issues

If you find bugs:

1. **Check console:** Open DevTools → Console tab
2. **Check Network:** DevTools → Network tab for failed requests
3. **Check Database:** `npx prisma studio` to verify data
4. **Note steps to reproduce**
5. **Note your role:** ADMIN, ASSOCIATE, or CLERK

---

**Happy Testing! 🚀**

If everything works, you're ready to deploy to Vercel!
