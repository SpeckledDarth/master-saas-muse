# MuseKit.io - Master SaaS Muse Template

## Overview
MuseKit.io is a production-ready, full-stack SaaS starter template built with Next.js 16+ (App Router), React 18+, and TypeScript. It provides a comprehensive foundation for launching new SaaS products rapidly, featuring robust authentication with multiple OAuth providers, Stripe-powered billing with feature gating, team collaboration with role-based permissions, and an administrative dashboard.

Key capabilities include:
- **Comprehensive SaaS Features**: Authentication, billing, team management, and an admin dashboard are all production-ready.
- **AI Integration**: A pluggable AI system supports xAI Grok, OpenAI, and Anthropic.
- **Automation & Content**: Integrations for webhooks (n8n/Zapier) and a markdown-based blog/changelog.
- **Monitoring & Analytics**: Sentry for error tracking and Plausible for analytics are integrated.
- **Testing & SEO**: Extensive Playwright E2E tests and SEO optimization are built-in.
- **Rapid Deployment**: Designed for quick cloning and customization via a Setup Dashboard, exclusively deployed on Vercel.

The project aims to significantly reduce development time for new SaaS ventures by providing a complete, high-quality starting point.

## User Preferences
Preferred communication style: Simple, everyday language.

### Workflow Commitments
- **Secrets**: When I need a secret key, I immediately show the input form. No explanation first, no asking user to request it.
- **Consistency**: Workflows stay the same between sessions. If something changes, I explain why clearly.
- **Roles**: User sets goals and supplies keys when asked. Agent handles all technical execution.
- **Cognitive load**: Minimize decisions. Ask simple yes/no questions. Avoid jargon unless it affects a decision.
- **Git Sync Responsibility**: Agent ensures Replit and GitHub repo stay in sync. Before ending sessions or after significant changes, agent verifies sync status and asks user to run push commands if needed. User executes git commands when requested.

## System Architecture
The project is built with Next.js 16+ (App Router), React 18+, and TypeScript. Styling is managed using Tailwind CSS, shadcn/ui, and next-themes, while TanStack Query handles server state. Supabase serves as the backend for PostgreSQL, authentication, Row Level Security (RLS), and storage, supporting multi-tenancy via domain-based middleware and `app_id` context. Deployment is exclusively on Vercel.

**UI/UX Decisions:**
- Dynamic branding components and configurable navigation.
- Customizable hero sections with various styles (full-width, split, video background, patterns, floating mockup).
- Enhanced visual components like Logo Marquee, Animated Counters, Gradient Text, Process Steps, and Testimonial Carousels.
- Dark/light mode toggle with theme flash prevention.
- An admin dashboard provides metrics, user management, and settings, complemented by a Setup Dashboard for branding, pricing, social links, and feature configurations.

**Technical Implementations:**
- **Authentication**: Supports email/password, Google, GitHub, Apple, Twitter/X, and Magic Link, with admin-controlled toggles for OAuth providers. Includes protected routes, session persistence, and profile management.
- **Admin Features**: Dashboard with analytics, user management, role-based access control, organization settings, and audit logging. Includes an onboarding wizard for initial setup.
- **Billing**: Stripe integration for subscription management, checkout sessions, customer portal, webhook handling, and feature gating based on plan levels.
- **Email System**: Resend integration for transactional emails (welcome, subscription, team invitations) with admin-editable templates.
- **Team/Organization System**: Multi-user organizations with a role hierarchy (Owner, Manager, Member, Viewer), email-based invitations, and permission-based access control.
- **AI Integration**: A pluggable system supporting xAI (Grok), OpenAI, and Anthropic, with admin-configurable models, temperature, and system prompts, exposed via a `/api/ai/chat` endpoint.
- **Webhook Integration**: Event-driven webhook system with HMAC-SHA256 payload signing, retry logic, and 8 predefined event types for automation platforms like n8n/Zapier. Admin UI for configuration and testing.
- **Content Management**: Markdown-based blog/changelog system with public display and admin CRUD interface.
- **Marketing Tools**: Waitlist mode for pre-launch email collection, an in-app feedback widget, and customizable marketing pages (landing, about, contact, FAQ, features, pricing, privacy, terms, docs).
- **Security**: Supabase RLS, Zod validation for API inputs, rate limiting, and security headers.
- **Monitoring**: Sentry for error tracking (server and browser) and Plausible for privacy-friendly analytics.

**System Design Choices:**
- Unified frontend and backend using Next.js API routes.
- Modular, component-based development.
- RLS and application-level logic for access control.
- Clear separation of concerns for third-party services.
- `NEXT_PUBLIC_` prefix for client-side environment variables.
- Fire-and-forget webhook delivery pattern.
- Pluggable abstraction layers for AI providers.

## External Dependencies
- **Supabase**: PostgreSQL database, Authentication, Row Level Security (RLS), Storage.
- **Stripe**: Subscription payments, webhooks, customer portal.
- **Vercel**: Deployment and hosting platform.
- **Resend**: Transactional email service.
- **Plausible Analytics**: Privacy-friendly website analytics.
- **Sentry**: Error tracking and monitoring.
- **xAI/OpenAI/Anthropic**: AI chat completion providers (pluggable through an abstraction layer).

## Session Status (February 6, 2026)

### Last Completed
- Comprehensive documentation update across all 5 docs (replit.md, MASTER_PLAN.md v3.0, PROJECT_OVERVIEW.md, MUSE_CHECKLIST.md, SETUP_GUIDE.md)
- All docs synchronized: feature lists, completion statuses, dates (Feb 6, 2026), env var references
- Architect review passed on all documentation

### Next Session Priority (February 7, 2026)
**Test and debug AI (Grok) and Webhook (n8n) features:**

1. **AI Integration Testing** (`src/lib/ai/provider.ts`, `/api/ai/chat`)
   - Verify xAI Grok provider works with `XAI_API_KEY` secret
   - Test chat completion endpoint with streaming
   - Test admin config (model selection, temperature, system prompt)
   - Test feature toggle (enable/disable AI from Setup Dashboard)
   - Verify error handling for missing/invalid API keys

2. **Webhook/n8n Integration Testing** (`src/lib/webhooks/dispatcher.ts`, `/api/admin/webhooks`)
   - Test webhook dispatcher with HMAC-SHA256 signing
   - Test all 8 event types fire correctly
   - Test retry logic on delivery failure
   - Test admin webhook configuration UI (URL, secret, per-event toggles)
   - Test "Send Test" functionality from admin panel
   - Optionally test with actual n8n endpoint if available

### Key Files for Testing
- `src/lib/ai/provider.ts` - AI provider abstraction (xAI, OpenAI, Anthropic)
- `src/lib/webhooks/dispatcher.ts` - Webhook dispatcher with HMAC signing
- `src/app/api/ai/chat/route.ts` - AI chat API endpoint
- `src/app/api/admin/webhooks/route.ts` - Webhook admin API
- `src/types/settings.ts` - Settings interfaces (AI config, webhook config)
- `tests/` - E2E test files (38 Playwright tests across 5 suites)

### Available Secrets
- `XAI_API_KEY` - Set and ready for Grok testing
- `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` (via integration) - Production secrets
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` - Monitoring