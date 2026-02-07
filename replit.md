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
- **Authentication**: Supports email/password and multiple OAuth providers (Google, GitHub, Apple, Twitter/X, Magic Link) with admin toggles, protected routes, and profile management.
- **Admin Features**: Dashboard with analytics, user management, role-based access control, organization settings, and audit logging, including an onboarding wizard.
- **Billing**: Stripe integration for subscriptions, checkout, customer portal, webhooks, and feature gating.
- **Email System**: Resend integration for transactional emails with admin-editable templates.
- **Team/Organization System**: Multi-user organizations with role hierarchies (Owner, Manager, Member, Viewer), email invitations, and permission-based access.
- **AI Integration**: Pluggable system for xAI (Grok), OpenAI, and Anthropic, with admin-configurable models and prompts via a `/api/ai/chat` endpoint.
- **Webhook Integration**: Event-driven system with HMAC-SHA256 signing, retry logic, and 8 predefined event types for automation platforms. Admin UI for configuration.
- **Content Management**: Markdown-based blog/changelog with public display and admin CRUD.
- **Marketing Tools**: Waitlist mode, in-app feedback widget, and customizable marketing pages.
- **Security**: Supabase RLS, Zod validation, rate limiting, and security headers.
- **Monitoring**: Sentry for error tracking and Plausible for analytics.
- **SSO/SAML Enterprise Authentication**: Full CRUD for Supabase SAML SSO providers, admin dashboard for management, and domain-based SSO detection on the login page.
- **Queue Infrastructure**: BullMQ with Upstash Redis for job queues (email, webhook-retry, report), managed via an admin queue dashboard.
- **Rate Limiting**: Upstash Redis sliding window, with an in-memory fallback.
- **Admin Setup UX Overhaul**: Consolidated setup into focused sub-pages for branding, content, pages, pricing, social, and features, improving maintainability.
- **Customer Service Tools**: Enhanced user management with detailed user info (profile, Stripe subscription, invoices), admin notes, and quick actions like "Manage in Stripe" and "Send Email."
- **Legal & Compliance System**: Configuration for compliance (Acceptable Use, Cookie Policy, etc.), support (chatbot widget), and security (MFA, password requirements) settings. Includes 7 new public legal page routes with dynamic variable replacement and a cookie consent banner.
- **Floating Support Chatbot Widget**: Configurable chatbot with AI-powered responses and rate limiting.
- **Admin Metrics Dashboard**: API endpoint and dashboard for aggregating user counts, subscriptions, MRR, feedback, and waitlist stats with KPI cards and line charts.
- **In-App Notifications**: Bell icon with unread badge, popover notification list, type-specific icons, auto-polling, mark all read, server-side notification creation utility.
- **User Impersonation**: Admin can impersonate users for debugging. Cookie-based session with 30-min expiry, yellow warning banner, audit logging, and "Stop Impersonation" button.
- **Audit Log Viewer**: Admin page with paginated, filterable audit log table showing user actions, timestamps, and details.
- **Extended Metrics Dashboard**: 10 KPIs including ARPU, LTV, Churn Rate, Conversion Rate, NPS Score alongside existing metrics (Total Users, New Users, Active Subscriptions, MRR). Features "Email Report" and "Check Alerts" action buttons.
- **NPS Score Tracking**: Feedback submissions accept optional NPS score (0-10), aggregated into Net Promoter Score on metrics dashboard with color-coded display.
- **Scheduled Metrics Reports**: BullMQ job type for emailing weekly/monthly KPI summaries via Resend with admin-triggered and configurable automatic delivery.
- **Metrics Alerts**: Configurable thresholds for churn rate and user growth with email notifications when exceeded. Alert settings managed in Admin > Setup > Security.
- **Database Backup Configuration**: Admin UI for configuring backup notification preferences, frequency, and retention periods (managed by Supabase).
- **API Token Rotation**: BullMQ job type for automated webhook secret rotation with configurable interval, managed via Admin > Setup > Security.
- **MuseSocial Module**: Toggleable social media management extension with two tiers (Universal/Power). Features include:
  - Admin setup page at `/admin/setup/musesocial` with tier selection, platform toggles, posting config, monitoring settings, and API health checker config.
  - Social account connection system with OAuth flow stubs for Twitter/X and LinkedIn (Instagram deferred). User-facing page at `/dashboard/social`.
  - AI-powered post generation via `/api/social/generate-post` leveraging the existing pluggable AI system with platform-specific prompts and brand voice.
  - Post scheduling and management at `/dashboard/social/posts` with BullMQ queue jobs (`social-post`, `social-health-check`, `social-trend-monitor`).
  - Social API health checker with threshold-based alerting via email notifications.
  - Social KPI cards on the admin metrics dashboard (Posts Generated, Posts This Month, Scheduled, Connected Accounts) — visible only when module is enabled.
  - Conditional onboarding wizard step shown when module is toggled on.
  - Vercel Cron fallback at `/api/cron/social` (every 15 minutes) for processing scheduled posts and health checks when n8n is unavailable.
  - SQL schema reference files at `src/lib/social/schema.sql` and `src/lib/social/posts.sql` (tables created manually in Supabase).
  - 6 Playwright E2E tests covering toggle, account connection, post generation, scheduling, KPI display, and tier gating.

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

---

## MuseSocial Build Plan — DRAFT (NOT YET APPROVED — Feb 7, 2026)

**Status: User is reviewing this plan. DO NOT start building until user explicitly approves.**

### What's Already Built (13 items complete):
1. Toggle system with Universal/Power tier sub-toggles in Admin > Setup > Features
2. Admin setup page at `/admin/setup/musesocial` with tier selection, platform toggles, posting config, monitoring, health checker config
3. Social account connection system with OAuth flow stubs for Twitter/X and LinkedIn (Instagram deferred). User page at `/dashboard/social`
4. AI-powered post generation endpoint at `/api/social/generate-post` using pluggable AI system
5. Post scheduling and management at `/dashboard/social/posts` with BullMQ jobs (`social-post`, `social-health-check`, `social-trend-monitor`)
6. Social API health checker with threshold-based alerting via email notifications
7. Social KPI cards on admin metrics dashboard (Posts Generated, Posts This Month, Scheduled, Connected Accounts) — only visible when module is enabled
8. Conditional onboarding wizard step shown when module is toggled on
9. Vercel Cron fallback at `/api/cron/social` (daily schedule due to Hobby plan) for processing scheduled posts and health checks
10. SQL schema reference files at `src/lib/social/schema.sql` and `src/lib/social/posts.sql`
11. 6 Playwright E2E tests (toggle, account connection, post generation, scheduling, KPI display, tier gating)
12. Module Status indicator (green/red badge) on setup page
13. MuseSocial sidebar link visibility tied to saved state (only appears/disappears after Save)

### Gap Analysis — 9 Remaining Items to Build (~2-2.5 hours):
1. **Usage caps per tier via rate limiting** — Universal and Power tiers need different posting limits enforced
2. **Dependency check on toggle** — Warn admin if required API keys/config are missing when enabling MuseSocial
3. **Wire token validation into OAuth connect flow** — Test API call after connecting an account to verify tokens work
4. **Retry logic for social post API failures** — BullMQ retry config with exponential backoff
5. **Usage logging for AI post generation** — Track generation counts to feed metrics dashboard
6. **Multimodal support in generate-post endpoint** — Text + image generation via single endpoint (if AI provider supports it, e.g., Grok)
7. **Dynamic SDK imports / lazy-loading** — Social code should not load when module is off, keeps non-social clones lean
8. **n8n workflow templates for social automation** — JSON template files for common social workflows
9. **Expanded documentation** — Dedicated Social Module admin guide section with setup, troubleshooting, and tier differences

### Design Decisions (agreed with user):
- Start with Twitter/X and LinkedIn only. Instagram deferred (slow API approval process).
- Multimodal: single endpoint, no separate image pipeline. Pass multimodal prompts if provider supports it.
- Vercel Cron runs daily (Hobby plan limitation). Scoped to posting-only, not analytics.
- 6 Playwright tests (not 8 — avoids diminishing returns on edge cases).
- Tooltip in wizard is fine; demo video is scope creep for now.
- Docs: add placeholder markers for screenshots during build, fill in at the end.
- Threshold notifications: only alert on repeated failures, not single ones.
- Sidebar visibility: MuseSocial link only appears/disappears after settings are saved, not on live toggle.

### Key MuseSocial Files:
- `src/app/admin/setup/musesocial/page.tsx` — Admin config page
- `src/app/admin/setup/layout.tsx` — Setup sidebar with conditional MuseSocial link
- `src/lib/social/client.ts` — Social platform SDK client
- `src/lib/social/schema.sql` — Database schema reference
- `src/lib/social/posts.sql` — Posts table schema reference
- `src/app/api/social/generate-post/route.ts` — AI post generation
- `src/app/api/social/accounts/route.ts` — Account management
- `src/app/api/social/accounts/validate/route.ts` — Token validation
- `src/app/api/social/health/route.ts` — Health checker
- `src/app/api/social/posts/route.ts` — Post CRUD
- `src/app/api/cron/social/route.ts` — Vercel Cron fallback
- `src/app/dashboard/social/page.tsx` — User social dashboard
- `src/app/dashboard/social/posts/page.tsx` — Post scheduling UI
- `src/app/admin/metrics/page.tsx` — Metrics with social KPIs
- `src/lib/queue/types.ts` — BullMQ job type definitions
- `tests/musesocial.spec.ts` — E2E tests

### Session Recovery Instructions for Future Agents:
- Read this section FIRST before doing anything.
- If user says "pick up where we left off" or "continue the plan" — check the Status line above.
- If status says "NOT YET APPROVED" — ask the user if they're ready to approve and begin.
- If status says "APPROVED" — start working through the gap analysis items in order.
- All design decisions above are FINAL — do not re-ask the user about them.
- Always verify git sync status before ending a session.