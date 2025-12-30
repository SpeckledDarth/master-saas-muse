# Master SaaS Muse Template

## Overview

This is a full-stack SaaS starter template designed for building production-ready SaaS applications ("muses") with SEO-optimized pages, authentication via Supabase, multi-tenancy support, and Stripe billing. The template enables rapid cloning and customization for new SaaS products.

**IMPORTANT**: We are migrating from Vite + Express to **Next.js 14 + Vercel** for proper SSR/SEO capabilities. See `docs/MASTER_PLAN.md` for the complete development roadmap.

## User Preferences

Preferred communication style: Simple, everyday language.

## Session Context (Updated Dec 29, 2025)

### Development Workflow
- **Local Environment**: Windows with PowerShell
- **Git Experience**: Beginner - needed help with .env file (hidden .txt extension issue)
- **Workflow**: Replit for code development → Git push → Vercel auto-deploys
- **Styling**: User prefers original gradient font styling (deferred until after functional modules)

### Supabase Project
- **URL**: https://ghlrvygpbexawddahixa.supabase.co
- **Redirect URLs**: Configured for both localhost:3000 and Vercel domain

### Required Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://ghlrvygpbexawddahixa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(from Supabase dashboard → Settings → API → anon public)
SUPABASE_SERVICE_ROLE_KEY=(from Supabase dashboard → Settings → API → service_role - KEEP SECRET)
```

### Vercel Environment Variables
Same three variables above, added via Vercel Project → Settings → Environment Variables

### Module 3 Architecture Notes
- Admin API routes use server-side only to protect service role key
- `/api/admin/users` route fetches user data using `src/lib/supabase/admin.ts`
- Service role key must NEVER be exposed client-side (no NEXT_PUBLIC_ prefix)

## Strategic Decision (Dec 29, 2025)

**Migration to Next.js + Vercel**
- **Reason**: SEO is critical for organic traffic to each muse
- **Benefits**: Built-in SSR/ISR, automatic CDN, easy domain mapping, one-click deployments
- **Timeline**: Extended to February 2026 to allow proper migration
- **Master Plan**: See `docs/MASTER_PLAN.md` for complete 32-module roadmap

## Target Architecture (Next.js + Vercel)

### Frontend & Backend (Unified)
- **Framework**: Next.js 14+ (App Router), React 18+, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + next-themes
- **State Management**: TanStack Query for server state

### Database & Auth
- **Provider**: Supabase (PostgreSQL + Auth + RLS + Storage)
- **Multi-Tenancy**: Domain-based middleware → app_id context → RLS policies

### Hosting & Deployment
- **Platform**: Vercel
- **Features**: Preview deploys, custom domains, edge functions

## Legacy Architecture (Vite + Express - Being Migrated)

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Theme**: next-themes for dark/light mode toggle
- **Animations**: Framer Motion for UI transitions

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts`
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Location**: `shared/schema.ts` (shared between client and server)

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components (shadcn/ui + custom)
│       ├── contexts/     # React contexts (AuthContext)
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utilities (queryClient, supabase)
│       └── pages/        # Route pages
├── server/           # Express backend
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   └── storage.ts    # Data access layer
├── shared/           # Shared code between client/server
│   ├── routes.ts     # API contract definitions with Zod
│   └── schema.ts     # Drizzle database schema
└── migrations/       # Database migrations (Drizzle Kit)
```

### Authentication
- **Provider**: Supabase Auth (email/password and Google OAuth)
- **Client Integration**: `@supabase/supabase-js` with React context
- **Protected Routes**: Client-side route guards via `ProtectedRoute` component
- **Webhook Stub**: `/api/webhooks/user.created` for handling new user signups

### Multi-Tenancy Stub
The server includes middleware that extracts potential `app_id` from subdomain patterns (e.g., `{app_id}.yourdomain.com`), preparing for future multi-tenant implementations.

### Database
- **Type**: PostgreSQL (via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with Zod schema validation
- **Migrations**: Drizzle Kit (`db:push` command)
- **Current Schema**: Minimal `settings` table as placeholder

### Build System
- **Development**: `tsx` for running TypeScript directly
- **Production Build**: Custom build script using esbuild (server) and Vite (client)
- **Output**: `dist/` directory with bundled server and static client files

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Third-Party Services
- **Supabase**: Authentication and user management
  - Email/password authentication
  - Google OAuth (configured via Google Cloud Console)
  - Storage bucket `avatars` for profile pictures (with RLS policies)
- **PostgreSQL**: Primary database (provision via Replit or external provider)

## Development Progress

### Module 1: Foundation (Complete)
- Landing page with Hero section
- Dark/light mode toggle
- Header with navigation
- Footer component

### Module 2: Authentication (Complete)
- Email/password signup with confirmation
- Email/password login
- Google OAuth integration
- Protected routes with redirect
- Session persistence
- Profile page with avatar upload
- Supabase Storage configured with RLS policies
- Webhook endpoint stub at `/api/webhooks/user.created`
- Multi-tenancy middleware (hostname logging)

### Module 3: Admin Features (Complete - Tested Dec 29, 2025)
- Admin dashboard with metrics (/admin)
  - Total users, admins, members counts
  - Recent signups tracking
  - Quick access cards to admin sections
- User management with role editing (/admin/users)
  - View all users with roles
  - Change user roles (admin/member)
  - Protection against demoting last admin
  - "Currently logged in as" display showing admin's email
  - Disabled role dropdown for current user (prevents self-demotion)
- Settings page with feature toggles (/admin/settings)
  - Organization name and support email
  - Allow New Signups toggle
  - Maintenance Mode toggle
  - Require Email Verification toggle
  - Enable Google Sign-In toggle
- Role-based access control (admin/member)
- Bootstrap admin functionality for new installations
  - Server-side protection: only works when no admins exist
  - Proper error handling when admin already exists
- Audit logging for admin actions
  - Tracks role changes, settings updates, bootstrap events
- Auto-registration: New users automatically get member role on first login
- Database schema: user_roles, organization_settings, audit_logs

### Bug Fixes (Dec 29, 2025)
- Fixed sign-out: Session now properly clears all Supabase localStorage keys
- Fixed sign-out flash: Navigation occurs before auth state change
- Fixed login form: No longer requires entering credentials twice
- Fixed bootstrap admin: Proper error message when admin already exists

## Current Issue (Dec 30, 2025) - RESUME HERE

### Problem: /login returns 404 on Vercel despite code existing

**What we've verified:**
1. `src/app/(auth)/layout.tsx` EXISTS on GitHub (commit 560db37)
2. `src/app/(auth)/login/page.tsx` EXISTS on GitHub
3. Local project structure is correct
4. GitHub has latest code at: https://github.com/SpeckledDarth/master-saas-muse/tree/main/src/app/(auth)

**What we've tried:**
1. Created missing `layout.tsx` for (auth) route group
2. Fixed Windows `.txt` extension issue (file was `layout.tsx.txt`)
3. Pushed to GitHub - confirmed commit 560db37 is there
4. Disconnected and reconnected Vercel to GitHub
5. Multiple redeployments with "Use existing Build Cache" unchecked

**The Core Problem:**
Vercel build logs show ONLY these routes being compiled:
- `/`
- `/_not-found`

The `/login`, `/signup`, `/reset-password` routes are NOT appearing in build output.
Vercel Source still shows old commit `31f21d9` instead of `560db37`.

**Next Steps to Try:**
1. Check Vercel deployment Source section after reconnection - does it now show commit 560db37?
2. If still showing old commit, try deleting and recreating the Vercel project entirely
3. Check Vercel Settings → General → Root Directory (should be empty/root, not a subfolder)
4. Try manual deploy via Vercel CLI

**User's GitHub:** https://github.com/SpeckledDarth/master-saas-muse
**Vercel Domain:** master-saas-muse.vercel.app

### Configuration Files
- `.env.template` - Template for all secrets and environment variables
- `config/muse.config.json` - Project-specific settings (name, branding, features)
- `docs/MUSE_CHECKLIST.md` - Quick-start checklist for cloning template

### Key NPM Packages
- `@supabase/supabase-js` - Supabase client
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `next-themes` - Theme management
- `framer-motion` - Animations
- Full shadcn/ui component set via Radix UI primitives