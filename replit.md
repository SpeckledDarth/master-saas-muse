# Master SaaS Muse Template

## Overview
This project is a full-stack SaaS starter template designed for building production-ready applications with SEO-optimized pages, authentication via Supabase, multi-tenancy support, and Stripe billing. The template aims to enable rapid cloning and customization for new SaaS products, targeting a pure Next.js architecture deployed to Vercel for optimal SEO and development efficiency. The vision is to provide a robust foundation for various SaaS ventures.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.

## System Architecture
The project utilizes a pure Next.js 14+ (App Router) framework with React 18+ and TypeScript for both frontend and backend. Styling is handled by Tailwind CSS, shadcn/ui, and next-themes, with server state managed by TanStack Query. Supabase provides the database (PostgreSQL), authentication, Row Level Security (RLS), and storage, supporting multi-tenancy through domain-based middleware and `app_id` context. Deployment and hosting are exclusively on Vercel, leveraging its features like preview deploys, custom domains, and edge functions.

**UI/UX Decisions:**
- Dark/light mode toggle.
- Admin dashboard for metrics, user management, and settings.
- Tabbed interface for the Setup Dashboard (Branding, Pricing, Social, Features).
- Dynamic branding components.
- Original gradient font styling is a deferred preference.

**Technical Implementations & Feature Specifications:**
- **Authentication**: Email/password, Google OAuth, protected routes, session persistence, profile management with avatar uploads, multi-tenancy middleware.
- **Admin Features**: Dashboard with user/admin/member counts, recent signups, user management with role editing, settings page with feature toggles, role-based access control, audit logging, auto-registration for new users.
- **Stripe Integration**: Checkout for subscriptions, webhook handling for `checkout.session.completed`, customer portal API, products/prices API, pricing page UI, feature gating.
- **Subscription Management**: Profile and billing pages showing subscription status, pricing page for plan upgrades, `feature-gate.ts` for tier limits.
- **Email System**: Resend integration for transactional emails (welcome, subscription confirmation/cancellation), API route for custom emails.
- **Security & RLS**: Supabase RLS enabled on `profiles`, `user_roles`, `organization_settings`, and `audit_logs` tables. Zod validation schemas for API inputs, rate limiting middleware (in-memory for MVP, Upstash Redis for production). Security headers configured in `next.config.ts`.
- **Setup Dashboard**: Admin-only interface for branding (app name, tagline, logo/hero image upload, colors), pricing configuration, social links, and feature toggles. Settings are stored in the `organization_settings` table using a JSONB column.
- **Monitoring**: Plausible analytics for privacy-friendly page view tracking. Structured logging utility for API, auth, and subscription events. Sentry error tracking is planned for Next.js 16 support.

**System Design Choices:**
- Unified frontend and backend using Next.js.
- Modular component-based development (e.g., shadcn/ui).
- RLS and application-level logic for access control.
- Clear separation of concerns for Stripe and Supabase services.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks for `checkout.session.completed`, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: (Planned) Error tracking, pending Next.js 16 support.

## CRITICAL: Stack & Environment
**THIS PROJECT USES VERCEL + NEXT.JS. NEVER MENTION OR USE VITE.**
- Deployment: Vercel (push to GitHub triggers deployment)
- Framework: Next.js 16+ with App Router
- Environment variables use `NEXT_PUBLIC_` prefix (NOT `VITE_`)
- Required secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Any `VITE_` prefixed variables are legacy and must be renamed to `NEXT_PUBLIC_`

## Next Session Priority (Jan 28, 2026)
Continue MVP testing of the Setup Dashboard tabs:
1. **Pricing tab** - Test configuration and persistence
2. **Social tab** - Test social links editing
3. **Features tab** - Test feature toggles

All core functionality (theme customization, branding, content editing) is complete and working.

## Recent Session Progress (Jan 27, 2026)

### Completed This Session
- **Full Theme Customization System**: Light and dark mode theme colors now work across all pages
  - Simplified ThemeColors interface to 4 fields per mode (background, foreground, card, border)
  - Created ThemeSettingsProvider component for global theme application
  - Added to root layout so all pages (including dashboards) follow light/dark toggle
  - MutationObserver watches for theme class changes and reapplies custom colors
- **Content Tab fully functional**: All toggles, editing, and persistence working
  - Features section: toggle, headline/subheadline editing, add/edit/delete cards, icon dropdown
  - Testimonials: add/edit/delete with full profile info
  - FAQ: add/edit/delete question/answer pairs
  - All changes persist after save and page refresh

### Fixed Issues
- **Theme colors on dashboards**: Previously only homepage had custom theme colors; now all pages have them
- **Content settings persistence**: Initial database was missing `content` JSONB section; added directly via SQL

### Testing Status
- Theme customization: FULLY TESTED AND WORKING (light/dark modes across all pages)
- Content tab: FULLY TESTED AND WORKING
- Branding tab: FULLY TESTED AND WORKING (app name, tagline, theme colors all work)
- Pricing tab: Not yet tested
- Social tab: Not yet tested
- Features tab: Not yet tested