# MuseKit.io - Master SaaS Muse Template

## Overview
MuseKit.io is a production-ready, full-stack SaaS starter template built with Next.js 16+, React 18+, and TypeScript, designed to accelerate the launch of new SaaS products. It features robust authentication with multiple OAuth providers, Stripe-powered billing with feature gating, team collaboration with role-based permissions, and an administrative dashboard. The platform integrates pluggable AI, webhook support, monitoring, analytics, E2E testing, and SEO optimization. Its core purpose is to provide a comprehensive, high-quality starting point, significantly reducing development time for new SaaS ventures, and is optimized for deployment on Vercel.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.

## System Architecture
The project utilizes Next.js 16+ (App Router), React 18+, and TypeScript, with Tailwind CSS, shadcn/ui, and next-themes for styling. TanStack Query manages server state. Supabase provides PostgreSQL, authentication, RLS, and storage, supporting multi-tenancy. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
The UI emphasizes dynamic branding, configurable navigation, customizable sections (hero, logo marquee, animated counters, testimonial carousels), dark/light mode, and a comprehensive admin dashboard for metrics, user management, and detailed setup configurations.

**Technical Implementations:**
- **Authentication**: Supports email/password and multiple OAuth providers, protected routes, and profile management. Includes SSO/SAML enterprise authentication with an admin dashboard.
- **Admin Features**: Dashboard with analytics, user management, role-based access control, organization settings, audit logging, and an onboarding wizard. Includes an enhanced setup UX with focused sub-pages for configuration, customer service tools, and a legal/compliance system.
- **Billing**: Stripe integration for subscriptions, checkout, customer portal, and feature gating.
- **Email System**: Resend integration for transactional emails with editable templates.
- **Team/Organization System**: Multi-user organizations with role hierarchies and invitations.
- **AI Integration**: Pluggable system for xAI, OpenAI, and Anthropic, configurable via an API endpoint.
- **Webhook Integration**: Event-driven system with HMAC-SHA256 signing, retry logic, and admin UI for configuration.
- **Content Management**: Markdown-based blog/changelog with public display and admin CRUD.
- **Marketing Tools**: Waitlist mode, in-app feedback widget, and customizable marketing pages.
- **Security**: Supabase RLS, Zod validation, rate limiting, and security headers.
- **Monitoring**: Sentry for error tracking and Plausible for analytics.
- **Queue Infrastructure**: BullMQ with Upstash Redis for 10 job types (email, webhook-retry, report, metrics-report, metrics-alert, token-rotation, social-post, social-health-check, social-trend-monitor, social-engagement-pull), managed via an admin dashboard.
- **Rate Limiting**: Upstash Redis sliding window with in-memory fallback.
- **In-App Notifications**: Bell icon with unread badges, popover list, and server-side utilities.
- **User Impersonation**: Admin capability with cookie-based sessions, warning banners, and audit logging.
- **Metrics & Reporting**: Admin dashboard for KPIs (ARPU, LTV, Churn Rate, NPS), scheduled reports, and alerts.
- **Database Backup Configuration**: Admin UI for setting backup notification preferences.
- **API Token Rotation**: Automated webhook secret rotation via BullMQ.
- **MuseSocial Module**: Toggleable social media management extension supporting 10 platforms, featuring AI-powered post generation, scheduling, and health checks. It includes tier-based rate limiting, a conditional onboarding wizard, and integrates n8n workflow templates. Centralized API keys are managed via dedicated admin setup pages.
- **SocioScheduler Extension**: A SaaS built on MuseKit, providing AI social media scheduling for solopreneurs. It supports Facebook, LinkedIn, and Twitter/X, with brand preference systems, multi-tier pricing, and an approval queue for AI-generated posts. It uses a database extension pattern for its tables (migrations/extensions/). Key features:
  - Per-user Stripe tier resolution (`getUserSocialTier` in `src/lib/social/user-tier.ts`) maps subscription metadata key `muse_tier` (values: muse_starter/basic/premium) to rate limits
  - OAuth flows for Facebook/LinkedIn/Twitter with PKCE (`/api/social/connect`, `/api/social/callback/[platform]`)
  - Engagement analytics dashboard with Recharts charts (`/dashboard/social/engagement`)
  - Calendar view with month-grid showing scheduled posts and per-platform count tooltips (`/dashboard/social/calendar`)
  - 7-page social dashboard: overview, calendar, engagement, queue, posts, brand preferences, onboarding
  - Quick Generate dialog on Overview page (platform picker + topic input, copy-to-clipboard)
  - Reusable `SocialUpgradeBanner` component (80%+ usage trigger, sessionStorage dismissal, integrated across 5 pages)
  - 15 admin-editable niche-specific AI prompts with default fallback voice
  - Admin-configurable engagement pull settings (intervalHours/lookbackHours, 1-168h range)
  - Structured AI prompt system using all brand preference fields for solopreneur-friendly content
  - Beta debug mode via `MUSE_DEBUG_MODE=true` env var with mock data at `/api/social/debug`
  - All RLS policies verified, proper empty states on all dashboard pages, no secrets exposed

**System Design Choices:**
The architecture uses a unified frontend/backend with Next.js API routes, modular component-based development, RLS and application-level logic for access control, and clear separation of concerns for third-party services. It employs a fire-and-forget webhook delivery pattern and pluggable abstraction layers for AI providers.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers.
- **Upstash Redis**: For BullMQ queue infrastructure and rate limiting.