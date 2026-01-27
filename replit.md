# Master SaaS Muse Template

## Overview

This is a full-stack SaaS starter template designed for building production-ready SaaS applications ("muses") with SEO-optimized pages, authentication via Supabase, multi-tenancy support, and Stripe billing. The template enables rapid cloning and customization for new SaaS products.

**IMPORTANT**: We are migrating from Vite + Express to **Next.js 14 + Vercel** for proper SSR/SEO capabilities. See `docs/MASTER_PLAN.md` for the complete development roadmap.

## User Preferences

Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.

## Session Context (Updated Jan 27, 2026)

### RLS Fix & Admin Dashboard Working (Jan 27, 2026)
- **Issue**: Admin page redirecting to home page instead of loading
- **Root Cause**: Complex RLS policies on `user_roles` table had circular dependency
  - "Admins can view all roles" policy checked if user was admin by querying user_roles
  - But to query user_roles, user needed to be verified as admin first → infinite loop
- **Solution**: Simplified RLS policy to allow all authenticated users to read roles
  - Created single policy: `"Allow authenticated read" FOR SELECT TO authenticated USING (true)`
  - Admin-only restrictions handled by application layout code, not database RLS
- **Pending Task**: Add admin-only policies for INSERT, UPDATE, DELETE on user_roles
- **Testing Needed**: Full test of Setup Dashboard (branding, pricing, social, features tabs)

### GitHub Sync Fix (Jan 27, 2026)
- **Issue**: `src/app/admin/page.tsx` on GitHub had wrong content (Setup page code instead of Admin Dashboard)
- **Solution**: Replaced via GitHub web UI with correct AdminDashboard component

### Vercel Deployment Fixed (Jan 26, 2026)
- **Issue**: Replit-to-GitHub sync only syncs changed files, not full directories
- **Root Cause**: GitHub package.json was missing ~20 Radix UI dependencies that UI components need
- **Additional Fixes**:
  - Updated react-day-picker from v8 to v9 for React 19 compatibility
  - Fixed tsconfig.json syntax error (malformed JSON)
  - Added missing UI components (switch, tabs, textarea, calendar)
  - Added missing Stripe files (feature-gate.ts, webhook-handlers.ts)
  - Removed duplicate `src/src/` folder that was created by accident
- **Solution Method**: Local Git clone + manual file sync for bulk uploads
- **Lesson**: When syncing many files, use local Git clone method rather than GitHub web UI

### Development Workflow
- **Local Environment**: Windows with PowerShell
- **Local Project Path**: `C:\Users\Chris\master-saas-muse`
- **Git Experience**: Beginner - step-by-step guidance needed
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

### Module 3: Admin Features (Complete - Tested Dec 31, 2025)
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
- Audit logging for admin actions
- Auto-registration: New users automatically get member role on first login
- Database schema: user_roles, organization_settings, audit_logs

### Bug Fixes (Dec 31, 2025)
- Fixed UserNav loading state: Now properly resolves in all code paths
- Fixed sign-out: Session clears correctly and navigation works
- Fixed auth state change handlers: Properly clear user state on SIGNED_OUT

### Bug Fixes (Jan 25, 2026)
- Fixed middleware timeout: Middleware was calling Supabase auth on every request, causing 504 MIDDLEWARE_INVOCATION_TIMEOUT errors
- Solution: Updated middleware.ts to only run auth checks on protected routes (/profile, /dashboard, /admin, /billing, /settings)
- Fixed Stripe type errors: Added type assertions for subscription.current_period_end and cancel_at_period_end
- Fixed font import: Replaced unavailable Geist fonts with Inter in layout.tsx

### Module 4: Stripe Integration (Complete - Tested Dec 31, 2025)
- Stripe Checkout for subscription payments (Pro $29/mo, Team $99/mo)
- Webhook endpoint at `/api/stripe/webhook` receiving `checkout.session.completed`
- Customer portal API route for subscription management
- Products/prices API routes
- Pricing page UI with plan selection
- Seed script for products (`scripts/seed-products.ts`)
- Database migration for stripe_customer_id and stripe_subscription_id fields
- Environment variables: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET

### Module 5: Subscription Management (Complete - Jan 1, 2026)
- Profile page at `/profile` showing user info and subscription status
- Billing page at `/billing` with full subscription management
- Pricing page at `/pricing` with plan comparison and upgrade flow
- Feature gating utility (`src/lib/stripe/feature-gate.ts`) with tier limits
- UpgradeBanner and FeatureGate components for tier-based UI
- Stripe service (`src/lib/stripe/service.ts`) fetching real subscription data
- Trialing status correctly treated as active subscription

### Architecture Decision (Jan 1, 2026)
**Primary Environment**: Next.js (src/) deployed to Vercel
- All new development goes in `src/` folder
- Vite/Express (client/) is legacy development sandbox - not maintained
- Testing workflow: Git push → Vercel auto-deploys → Test on production URL

### Key Files (Next.js)
- `src/app/(dashboard)/profile/page.tsx` - User profile with subscription info
- `src/app/(dashboard)/billing/page.tsx` - Full billing management
- `src/app/(marketing)/pricing/page.tsx` - Plan comparison and checkout
- `src/lib/stripe/service.ts` - Stripe API integration
- `src/lib/stripe/feature-gate.ts` - Feature gating with tier limits
- `src/components/subscription/UpgradeBanner.tsx` - Upgrade prompts

### Module 6: Email System (Complete - Jan 25, 2026)
- Resend integration for transactional emails
- Email service abstraction layer (easy to swap to SendGrid)
- Welcome email template
- Subscription confirmation email template
- Subscription cancellation email template
- Admin-only API route for sending custom emails
- Webhook integration: emails sent on subscription events
- Environment variables: RESEND_API_KEY, RESEND_FROM_EMAIL

### Module 7: Security & RLS (Complete - Jan 25, 2026)
- Supabase Row Level Security (RLS) enabled on all 4 tables
  - profiles: Users can only view/update own profile, admins can view all
  - user_roles: Users can view own role, admins can manage all
  - organization_settings: Anyone can read, only admins can update
  - audit_logs: Only admins can view, users can insert own logs
- Zod validation schemas (`src/lib/validation/`) for all API inputs
- Rate limiting middleware (`src/lib/rate-limit/`) with preset configs
  - **MVP Status**: In-memory limiter is acceptable for development and initial launch
  - **Production Upgrade**: Before first production SaaS with live customer data, upgrade to Upstash Redis for distributed rate limiting across serverless instances
- Security headers in `next.config.ts`:
  - Strict-Transport-Security (HSTS)
  - X-Frame-Options (clickjacking protection)
  - X-Content-Type-Options (MIME sniffing protection)
  - X-XSS-Protection
  - Referrer-Policy
  - Permissions-Policy

### Module 9: Setup Dashboard (Complete - Jan 26, 2026)
- Admin-only Setup Dashboard at `/admin/setup`
- Tabbed interface with: Branding, Pricing, Social, Features
- Branding: App name, tagline, company name, support email, **logo upload**, **hero image upload**, color picker
- Pricing: Plan names, prices, features list, Stripe Price IDs
- Social: Twitter, LinkedIn, GitHub, website links
- Features: Toggle email auth, Google OAuth, avatar upload, maintenance mode
- Settings stored in database (organization_settings table)
- Image uploads via Supabase Storage (`branding` bucket)
- Dynamic branding components for use across the app
- Secure API with cookie-based authentication (not header trust)

### Module 8: Monitoring & Docs (Complete - Jan 25, 2026)
- Sentry error tracking: **Deferred** - `@sentry/nextjs` doesn't support Next.js 16 yet
  - Will be added when Sentry releases Next.js 16 support
  - Environment variables ready in Vercel (NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT)
- Plausible analytics: **Working** (privacy-friendly page view tracking)
  - Component at `src/components/analytics/plausible.tsx`
  - Integrated in layout.tsx
- Structured logging utility (`src/lib/logging/`)
  - JSON format for easy parsing
  - Helper functions for API, auth, and subscription events
- Updated documentation:
  - `.env.template` with all required variables
  - `docs/MUSE_CHECKLIST.md` with monitoring setup steps
  - `docs/MASTER_PLAN.md` marked MVP complete

### Pre-Production Checklist
When launching first production SaaS with live customer/user data:
1. **Rate Limiting**: Upgrade from in-memory to Upstash Redis (`src/lib/rate-limit/index.ts`)
2. **CSP Headers**: Consider adding Content-Security-Policy header if needed
3. **Monitoring**: Add error tracking (Sentry) and uptime monitoring

## MVP COMPLETE - Ready for First Clone

## Configuration Files
- `.env.template` - Template for all secrets and environment variables
- `config/muse.config.json` - Project-specific settings (name, branding, features)
- `docs/MUSE_CHECKLIST.md` - Quick-start checklist for cloning template

## Key NPM Packages
- `@supabase/supabase-js` - Supabase client
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `next-themes` - Theme management
- `framer-motion` - Animations
- Full shadcn/ui component set via Radix UI primitives

## User's GitHub
https://github.com/SpeckledDarth/master-saas-muse

## Vercel Domain
master-saas-muse-u7ga.vercel.app
