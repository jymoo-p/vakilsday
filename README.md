# VakilsDay

> A daily utility app for Indian litigation lawyers to manage their practice digitally.

VakilsDay replaces paper diaries with a modern digital system for case tracking, role-based collaboration, and integrated legal research. Built for lawyers who need fast, reliable access to case information in the courtroom.

---

## Features

### 📅 Today's Schedule
- Daily dashboard showing all hearings with Court No., Item No., and case details
- Quick-add hearing outcomes and next dates
- Automatic sync with Google Calendar

### 📂 Case Management
- Complete case profiles with judges, opposing counsel, and parties
- Running timeline of all past hearings
- Fast-entry UI for updating case status

### 📄 Document Management
- Organized folders for Petitions, Evidence, Annexures, and Orders
- Secure cloud storage (Supabase)
- Quick upload from mobile camera

### 🔍 Legal Research Suite
- **Bare Act Search**: Search Indian central and state acts
- **Judgment Search**: Find Supreme Court and High Court judgments
- Save and organize research bookmarks

### 👥 Role-Based Collaboration
- **Admin (Lead Lawyer)**: Full access to all cases and settings
- **Associate**: View/edit assigned cases and research logs
- **Clerk**: Update hearing dates, upload orders, view schedule (no private notes)

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Vercel Postgres (PostgreSQL) with Prisma ORM
- **Auth**: NextAuth.js with Google OAuth 2.0
- **Storage**: Supabase Storage
- **External APIs**: IndiaCode, Indian Kanoon, Google Calendar

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Vercel Postgres)
- Google OAuth 2.0 credentials
- Supabase account (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vakilsday.git
   cd vakilsday
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Update `.env` with your credentials:
   ```env
   # Database
   DATABASE_URL="postgresql://..."

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

4. **Generate NextAuth secret**
   ```bash
   openssl rand -base64 32
   ```
   Add the output to `NEXTAUTH_SECRET` in `.env`

5. **Set up Google OAuth**
   
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API and Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Secret to `.env`

6. **Set up Supabase Storage**
   
   - Create a new project at [supabase.com](https://supabase.com)
   - Create a storage bucket named `vakilsday-documents`
   - Set bucket to private (secure access)
   - Copy project URL and keys to `.env`

7. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

9. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Database Schema

See [SCHEMA.md](./SCHEMA.md) for detailed database documentation including:
- Table structure and relationships
- RBAC permission matrix
- API integration points
- Query optimization strategies

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical architecture including:
- Tech stack details
- Project structure
- Data flow diagrams
- Security considerations
- Deployment pipeline

---

## Development Workflow

### Running Prisma Studio
View and edit database records in a GUI:
```bash
npx prisma studio
```

### Creating Database Migrations
After modifying `prisma/schema.prisma`:
```bash
npx prisma migrate dev --name your_migration_name
```

### Generating Prisma Client
If you manually edit the schema:
```bash
npx prisma generate
```

---

## API Routes

### Authentication
- `POST /api/auth/signin` - Sign in with Google
- `POST /api/auth/signout` - Sign out

### Cases
- `GET /api/cases` - List cases (filtered by role)
- `POST /api/cases` - Create new case
- `GET /api/cases/[id]` - Get case details
- `PATCH /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case

### Legal Search
- `GET /api/search/bare-acts?q={query}` - Search Indian acts
- `GET /api/search/judgments?q={query}&court={court}` - Search judgments

### Calendar Sync
- `POST /api/calendar/sync` - Sync hearing to Google Calendar

---

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link your project**
   ```bash
   vercel link
   ```

3. **Add environment variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env`

4. **Set up Vercel Postgres**
   - In Vercel Dashboard, go to Storage → Create Database
   - Select Postgres
   - Copy connection string to `DATABASE_URL` environment variable

5. **Deploy**
   ```bash
   vercel --prod
   ```

6. **Run migrations on production**
   ```bash
   npx prisma migrate deploy
   ```

---

## Roadmap

### Phase 1 (Current - MVP)
- ✅ Database schema and migrations
- ✅ Authentication with Google OAuth
- ✅ Legal search API integration
- ✅ Google Calendar sync service
- ⏳ Dashboard UI components
- ⏳ Case CRUD operations
- ⏳ Document upload/management

### Phase 2 (Q3 2026)
- React Native mobile app
- Offline mode for mobile
- Push notifications
- Advanced search filters
- Bulk document upload
- Export reports (PDF)

### Phase 3 (Q4 2026)
- AI-powered case summarization
- OCR for order sheet extraction
- Multi-language support (Hindi, Tamil, etc.)
- Integration with eCourts API
- Analytics dashboard

---

**Built with ⚖️ for Indian Lawyers**
