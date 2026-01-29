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

## Current Status (Jan 28, 2026)
**All Setup Dashboard tabs tested and working:**
- Branding tab: App name, tagline, theme colors - WORKING
- Content tab: Features, testimonials, FAQ sections - WORKING  
- Pricing tab: Links to Stripe Dashboard - WORKING
- Social tab: Social links editing - WORKING
- Features tab: Feature toggles - WORKING

**MVP is fully functional.** Ready for continued development or publishing.

## Recent Session Progress (Jan 28, 2026)

### Completed This Session
- **Tier 1 Essential Pages**: All core marketing pages now complete with SEO metadata
  - About page: Company story, mission, values, optional team section
  - Contact page: Contact info + working form (uses Resend API with fallback logging)
  - FAQ page: Expandable Q&A from settings
  - Terms of Service: Markdown-rendered with last updated date
  - Privacy Policy: Markdown-rendered with last updated date
- **Pages Tab in Setup Dashboard**: Admins can edit About, Contact, and Legal page content
- **Branded 404/Error Pages**: Custom error pages with helpful navigation links
- **Footer Updated**: Links to all new pages (About, Contact, FAQ, Terms, Privacy)
- **Homepage Flash Fix**: Added loading skeleton that displays while settings load, preventing flash of default content
- **Admin Menu Styling**: Fixed "Admin" button to use same Button component styling as other nav items
- **Pricing Page Free Plan**: Free plan now shows alongside Stripe products
  - Configurable via settings (showFreePlan, freePlanName, freePlanDescription, freePlanFeatures)
  - Dynamic grid layout based on number of plans
- **Enhanced User Profile Page**:
  - Avatar upload with camera button (requires Supabase "avatars" storage bucket)
  - Email change capability with confirmation email
  - Phone number, company name
  - Full address fields (street, city, state, zip, country)
  - All fields persist to Supabase user_metadata
- **Users Dashboard**: Full user management with search and role editing
- **Settings Dashboard**: Admin feature toggles page created
- **Forgot Password Workflow**: Complete password reset flow
  - NOTE: Password reset emails require Supabase email settings to be configured in Supabase Dashboard > Authentication > Email Templates
- **Pricing Page Stripe Sync**: Now fetches prices directly from Stripe API
  - Falls back to database settings if Stripe products unavailable
  - Shows product metadata for features
- **Homepage Flash Fix**: Loading state prevents "My SaaS" flash before custom branding loads
- **Setup Dashboard Refresh**: Page auto-refreshes after Save to show updated branding

### Benchmark Visual Enhancements (Jan 28-29, 2026)
Inspired by world-class sites (GitBook, TitanIntake, TheWone, Musicfy, Zazu, Eleveight):
- **Logo Marquee**: Auto-scrolling trusted-by logos (`src/components/landing/logo-marquee.tsx`)
- **Animated Counters**: Scroll-triggered number animations for metrics (`src/components/landing/animated-counter.tsx`)
- **Gradient Text**: Stylized gradient headlines (`src/components/landing/gradient-text.tsx`)
- **Process Steps**: Numbered step visualization (`src/components/landing/process-steps.tsx`)
- **Enhanced Testimonials**: Avatar photos, company logos, decorative quote icon + carousel option
- **Testimonial Carousel**: Full carousel mode with auto-play and navigation (`src/components/landing/testimonial-carousel.tsx`)
- **Image + Text Blocks**: Alternating left/right layout sections (`src/components/landing/image-text-section.tsx`)
- **Split Hero Option**: Image left/right layout alternative to full-bleed (`src/components/landing/split-hero.tsx`)
- **Section Background Controls**: Per-section background style options (default/muted/gradient)
- **Admin Toggles**: Enable/disable each section + style options in Setup Dashboard Content tab

All new sections disabled by default to maintain backward compatibility. Admins enable via toggles.

### Previous Session (Jan 27, 2026)
- Full Theme Customization System (light/dark modes across all pages)
- Content Tab fully functional (features, testimonials, FAQ editing)
- Theme colors work on all dashboards

### Testing Status
- All Setup Dashboard tabs: TESTED AND WORKING
- Users Dashboard: WORKING (search + role management)
- Settings Dashboard: WORKING (feature toggles)
- Profile page: WORKING (display name + password editing)
- Forgot password flow: WORKING
- Pricing page: WORKING (Stripe sync + fallback)
- Benchmark visual enhancements: IMPLEMENTED (Logo Marquee, Counters, Process Steps, Testimonials)