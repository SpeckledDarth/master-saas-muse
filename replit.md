# MuseKit.io - Master SaaS Muse Template

## Overview
MuseKit.io is a production-ready, full-stack SaaS starter template built with Next.js 16+ (App Router), React 18+, and TypeScript. It provides a comprehensive foundation for launching new SaaS products rapidly, featuring robust authentication with multiple OAuth providers, Stripe-powered billing with feature gating, team collaboration with role-based permissions, and an administrative dashboard.

Key capabilities include comprehensive SaaS features, pluggable AI integration (xAI Grok, OpenAI, Anthropic), webhook support for automation, integrated monitoring and analytics (Sentry, Plausible), extensive E2E testing, and SEO optimization. Designed for rapid deployment on Vercel, the project aims to significantly reduce development time for new SaaS ventures by providing a complete, high-quality starting point.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.

## System Architecture
The project uses Next.js 16+ (App Router), React 18+, and TypeScript. Tailwind CSS, shadcn/ui, and next-themes manage styling, while TanStack Query handles server state. Supabase provides PostgreSQL, authentication, RLS, and storage, supporting multi-tenancy. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
The UI features dynamic branding, configurable navigation, customizable hero sections, and enhanced visual components like Logo Marquee, Animated Counters, and Testimonial Carousels. It includes dark/light mode and an admin dashboard for metrics, user management, and settings, complemented by a Setup Dashboard for detailed configuration.

**Technical Implementations:**
- **Authentication**: Supports email/password and multiple OAuth providers with admin toggles, protected routes, and profile management.
- **Admin Features**: Dashboard with analytics, user management, role-based access control, organization settings, and audit logging, including an onboarding wizard.
- **Billing**: Stripe integration for subscriptions, checkout, customer portal, webhooks, and feature gating.
- **Email System**: Resend integration for transactional emails with admin-editable templates.
- **Team/Organization System**: Multi-user organizations with role hierarchies, email invitations, and permission-based access.
- **AI Integration**: Pluggable system for xAI (Grok), OpenAI, and Anthropic, with admin-configurable models and prompts via a `/api/ai/chat` endpoint.
- **Webhook Integration**: Event-driven system with HMAC-SHA256 signing, retry logic, and 8 predefined event types. Admin UI for configuration.
- **Content Management**: Markdown-based blog/changelog with public display and admin CRUD.
- **Marketing Tools**: Waitlist mode, in-app feedback widget, and customizable marketing pages.
- **Security**: Supabase RLS, Zod validation, rate limiting, and security headers.
- **Monitoring**: Sentry for error tracking and Plausible for analytics.
- **SSO/SAML Enterprise Authentication**: Full CRUD for Supabase SAML SSO providers, admin dashboard for management, and domain-based SSO detection.
- **Queue Infrastructure**: BullMQ with Upstash Redis for job queues (email, webhook-retry, report), managed via an admin queue dashboard.
- **Rate Limiting**: Upstash Redis sliding window, with an in-memory fallback.
- **Admin Setup UX Overhaul**: Consolidated setup into focused sub-pages for branding, content, pages, pricing, social, and features.
- **Customer Service Tools**: Enhanced user management with detailed user info, admin notes, and quick actions.
- **Legal & Compliance System**: Configuration for compliance, support (chatbot widget), and security settings. Includes 7 new public legal page routes and a cookie consent banner.
- **Floating Support Chatbot Widget**: Configurable chatbot with AI-powered responses and rate limiting.
- **Admin Metrics Dashboard**: API endpoint and dashboard for aggregating user counts, subscriptions, MRR, feedback, and waitlist stats with KPI cards and line charts.
- **In-App Notifications**: Bell icon with unread badge, popover notification list, type-specific icons, auto-polling, mark all read, server-side notification creation utility.
- **User Impersonation**: Admin can impersonate users for debugging, with cookie-based sessions, warning banners, and audit logging.
- **Audit Log Viewer**: Admin page with paginated, filterable audit log table showing user actions, timestamps, and details.
- **Extended Metrics Dashboard**: 10 KPIs including ARPU, LTV, Churn Rate, Conversion Rate, NPS Score, with "Email Report" and "Check Alerts" action buttons.
- **NPS Score Tracking**: Feedback submissions accept optional NPS score, aggregated into Net Promoter Score on metrics dashboard.
- **Scheduled Metrics Reports**: BullMQ job type for emailing weekly/monthly KPI summaries via Resend with admin-triggered and configurable automatic delivery.
- **Metrics Alerts**: Configurable thresholds for churn rate and user growth with email notifications.
- **Database Backup Configuration**: Admin UI for configuring backup notification preferences, frequency, and retention periods.
- **API Token Rotation**: BullMQ job type for automated webhook secret rotation with configurable interval.
- **MuseSocial Module**: Toggleable social media management extension with Universal/Power tiers. Features include admin setup, social account connection, AI-powered post generation (with multimodal image support), post scheduling and management, social API health checker, social KPI cards on admin metrics dashboard (with tier badge and AI generation count), conditional onboarding wizard step, Vercel Cron fallback, n8n workflow templates, and Playwright E2E tests. Tier-based rate limiting enforces daily caps (Universal: 10 AI generations, 20 posts; Power: 100 AI generations, 10,000 posts). Dependency warnings alert admins when AI is disabled, no platforms are enabled, or API keys are missing. BullMQ retry logic (3 attempts, exponential backoff) handles post delivery failures. All social imports use dynamic loading or type-only imports.

### MuseSocial Admin Guide

**Setup:**
1. Go to Admin > Setup > MuseSocial to enable the module
2. Select tier (Universal or Power) based on usage needs
3. Enable desired platforms (Twitter/X, LinkedIn) and configure API credentials
4. Ensure AI features are enabled in Admin > Setup > Features for post generation
5. Dependency warnings will appear if configuration is incomplete

**Tier Differences:**
- Universal: Basic posting/monitoring, 10 AI generations/day, 20 posts/day
- Power: Full scheduling, trend analysis, AI content generation, analytics, automation, 100 AI generations/day, effectively unlimited posts

**n8n Integration:**
- Template files in `src/lib/social/n8n-templates/`: auto-post-rss, ai-generate-and-schedule, engagement-monitor
- Set MUSEKIT_URL and MUSEKIT_SESSION_COOKIE environment variables in n8n

**Troubleshooting:**
- "Social module not enabled": Admin must toggle on in Setup > MuseSocial
- "AI features not enabled": Enable AI in Setup > Features
- "Rate limit exceeded": User hit daily tier cap; upgrade to Power or wait for reset
- Posts stuck in "scheduled": Check BullMQ queue dashboard, verify Redis connection
- Token validation fails: Re-connect the social account with fresh credentials

**Key Files:**
- `src/lib/social/rate-limits.ts` — Tier-based rate limiting constants and check function
- `src/lib/social/client.ts` — Platform client interfaces (Twitter, LinkedIn, Instagram)
- `src/lib/social/n8n-templates/` — n8n workflow JSON templates
- `src/app/api/social/` — All social API routes (accounts, posts, generate-post, health)
- `src/app/admin/setup/musesocial/page.tsx` — Admin configuration page
- `src/app/dashboard/social/page.tsx` — User-facing social accounts page

**System Design Choices:**
The architecture uses a unified frontend and backend with Next.js API routes, modular component-based development, RLS and application-level logic for access control, and clear separation of concerns for third-party services. It employs a fire-and-forget webhook delivery pattern and pluggable abstraction layers for AI providers.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers.
- **Upstash Redis**: For BullMQ queue infrastructure and rate limiting.