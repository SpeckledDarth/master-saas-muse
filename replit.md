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