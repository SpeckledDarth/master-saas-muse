# Master SaaS Muse Template

## CRITICAL: Stack Reminder
**This project uses Vercel + Next.js 16+ (App Router). NOT Vite.**
- Deployment: Vercel only
- Framework: Next.js 16+ with App Router
- Do NOT use Vite patterns, imports, or configurations

## STOP: READ THIS BEFORE MAKING ANY CHANGES

### This is NOT a standard Replit project
- Code written here must be pushed to GitHub for Vercel to deploy
- Local Replit testing is NOT the same as production
- Changes in Replit are NOT automatically deployed
- User tests on Vercel deployment, NOT locally

### Git Sync is MANDATORY
After every significant change:
1. Ask user to run: `git push origin main`
2. Wait for Vercel deployment (1-2 minutes)
3. User tests on Vercel URL, not Replit preview

### Common Mistakes to AVOID
- Using `import.meta.env` (Vite) instead of `process.env` (Next.js server-side)
- Creating `vite.config.ts` files
- Using Vite-specific plugins or imports
- Testing locally instead of on Vercel deployment
- Assuming environment variables work the same as Replit
- Forgetting to sync code to GitHub before user tests

## Overview
This project is a full-stack SaaS starter template built with Next.js 16+ (App Router), React 18+, and TypeScript. It provides a robust foundation for new SaaS products, featuring SEO-optimized pages, Supabase authentication, multi-tenancy support, and Stripe billing. The template enables rapid cloning and customization, aiming for a pure Next.js architecture deployed to Vercel for optimal performance and development efficiency. Key capabilities include a comprehensive admin dashboard, multi-user organization system, a markdown-based blog/changelog, and a waitlist mode. The vision is to offer a scalable and production-ready solution for various SaaS ventures.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.

## System Architecture
The project uses Next.js 14+ (App Router) with React 18+ and TypeScript. Styling is managed with Tailwind CSS, shadcn/ui, and next-themes, while TanStack Query handles server state. Supabase provides PostgreSQL, authentication, Row Level Security (RLS), and storage, supporting multi-tenancy via domain-based middleware and `app_id` context. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
- Dark/light mode toggle.
- Admin dashboard for metrics, user management, and settings.
- Setup Dashboard with Branding, Pricing, Social, and Features tabs.
- Dynamic branding components and configurable navigation.
- Customizable hero sections with various styles (full-width background, split layout, video background, pattern/texture, floating mockup).
- Enhanced visual components like Logo Marquee, Animated Counters, Gradient Text, Process Steps, and Testimonial Carousels.

**Technical Implementations & Feature Specifications:**
- **Authentication**: Email/password, Google OAuth, protected routes, session persistence, profile management, multi-tenancy middleware.
- **Admin Features**: Dashboard with user analytics, user management with role editing, feature toggles, role-based access control, audit logging, auto-registration.
- **Stripe Integration**: Checkout for subscriptions, webhook handling, customer portal API, products/prices API, pricing page UI, feature gating.
- **Subscription Management**: Profile and billing pages, pricing page for plan upgrades, `feature-gate.ts` for tier limits.
- **Email System**: Resend integration for transactional emails (welcome, subscription confirmations, team invitations), with an admin-editable template editor.
- **Security & RLS**: Supabase RLS on key tables, Zod validation for API inputs, rate limiting, and security headers.
- **Setup Dashboard**: Admin interface for branding (app name, tagline, logo, colors), pricing, social links, and feature toggles, stored in `organization_settings`.
- **Monitoring**: Plausible analytics for page view tracking, structured logging, and planned Sentry error tracking.
- **Team/Organization System**: Multi-user accounts with owner/admin/member roles, invitations, and role management.
- **Onboarding Wizard**: Guided 4-step setup for new administrators.
- **Blog/Changelog System**: Markdown-based content with public pages and admin CRUD interface.
- **Waitlist Mode**: Pre-launch email collection with CSV export.
- **Feedback Widget**: In-app feedback submission for logged-in and anonymous users.
- **Sitemap & SEO**: Auto-generated sitemap and `robots.txt`, comprehensive metadata.
- **Theme Flash Prevention**: Inline script for immediate dark/light mode application and loading skeletons.

**System Design Choices:**
- Unified frontend and backend using Next.js.
- Modular component-based development.
- RLS and application-level logic for access control.
- Clear separation of concerns for Stripe and Supabase services.
- `NEXT_PUBLIC_` prefix for environment variables.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: (Planned) Error tracking.

## Supabase Database Tables (Already Created)
The following tables exist in the production Supabase database:
- `analytics_events` - Page view and event tracking
- `audit_logs` - Admin action logging
- `email_templates` - Customizable email templates
- `feedback` - User feedback submissions
- `invitations` - Team invitation records
- `onboarding_state` - Admin onboarding wizard progress
- `organization_members` - Team membership records
- `organization_settings` - Branding, pricing, feature toggles (JSON values)
- `organizations` - Multi-tenant organization records
- `posts` - Blog/changelog content (markdown)
- `settings` - Legacy settings table
- `user_roles` - User role assignments (admin, member, etc.)
- `waitlist_entries` - Pre-launch email collection

**Important:** Tables are created in Supabase, NOT in Replit's local Postgres. Schema changes must be applied to Supabase.

## Key File Locations
- `src/lib/supabase/` - Supabase client setup (server.ts, admin.ts, client.ts)
- `src/lib/email/` - Resend email client and templates
- `src/lib/stripe/` - Stripe integration
- `src/app/api/` - All API routes (admin/, stripe/, user/, etc.)
- `src/app/admin/` - Admin dashboard pages
- `src/components/ui/` - shadcn/ui components

## CRITICAL: Testing & Deployment Context
**All testing happens on Vercel deployment, NOT locally in Replit.**
- User pushes code to GitHub with `git push origin main`
- Vercel auto-deploys from GitHub
- Production URL: `https://master-saas-muse-u7ga.vercel.app`

## CRITICAL: Environment Variables (Already Configured in Vercel)
The following secrets are already set in Vercel - DO NOT ask user to reconfigure:
- `RESEND_API_KEY` - Resend API key (set)
- `RESEND_FROM_EMAIL` - Currently `onboarding@resend.dev` (Resend test domain)
- `STRIPE_SECRET_KEY` - Stripe API key (set)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (for server-side operations)
- `SESSION_SECRET` - Session encryption key

### Replit Secrets (Also Configured)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` - Legacy Vite prefixes (may not be needed)
- `GIT_URL` - GitHub repository URL

### Resend Email Limitations
- `onboarding@resend.dev` can ONLY send emails to the Resend account owner: `kitt2002@proton.me`
- Admin user email is `speckledchris@gmail.com` (different from Resend account)
- To send to any email, user must verify their own domain in Resend

## Automated Testing

### Test Infrastructure
- **Framework**: Playwright for E2E testing
- **Config**: `playwright.config.ts` in project root
- **Tests**: `tests/` directory
- **Total Tests**: 38 tests (34 pass, 4 skip gracefully when no data)

### Test Files
- `tests/blog.spec.ts` - Blog/Changelog CRUD, markdown preview (9 tests)
- `tests/waitlist.spec.ts` - Waitlist management, CSV export, delete (9 tests)
- `tests/feedback.spec.ts` - Feedback management, status filter, delete (9 tests)
- `tests/email-templates.spec.ts` - Email template editing, preview, test emails (10 tests)
- `tests/public-waitlist.spec.ts` - Public waitlist page submission (1 test)

### Running Tests
```bash
# Run all tests against Vercel deployment
TEST_USER_EMAIL=speckledchris@gmail.com TEST_USER_PASSWORD='your-password' TEST_BASE_URL=https://master-saas-muse-u7ga.vercel.app npx playwright test

# Run specific test file
npx playwright test tests/blog.spec.ts

# Run with headed browser (visible)
npx playwright test --headed
```

### Test Requirements
- Tests require authenticated admin user
- Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` env vars for auth
- Set `TEST_BASE_URL` to target Vercel deployment
- All interactive elements have `data-testid` attributes
- Tests gracefully skip when no data exists (e.g., empty waitlist)

### Test ID Patterns
- Inputs: `input-{field}` or `input-post-{field}` for blog
- Buttons: `button-{action}` or `button-{action}-{target}`
- Lists: `{type}-entry-{id}` or `{type}-item-{id}`

## OAuth Enhancement Plan (In Progress)

### Phase 1: Add More OAuth Providers (Current)
- [x] Google OAuth (already working)
- [ ] GitHub OAuth button
- [ ] Apple OAuth button  
- [ ] Twitter/X OAuth button
- [ ] Magic Link passwordless login

### Phase 2: Profile Integration (Planned)
- [ ] Show connected providers in Profile page
- [ ] Allow linking/unlinking additional providers
- [ ] Sync avatar from OAuth provider if available

### Phase 3: Admin Controls (Planned)
- [ ] Add OAuth provider toggles to Setup Wizard
- [ ] Store enabled providers in organization settings

**Note:** OAuth providers are configured in Supabase Dashboard. Code changes are UI buttons + handlers.

## Session Start Checklist for Agent
Before debugging any issue:
1. Read this file completely
2. Check if environment variables are already configured (they usually are)
3. ASK clarifying questions before making assumptions
4. Remember: testing happens on Vercel, not locally