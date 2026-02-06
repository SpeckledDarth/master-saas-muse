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

### Last Completed (Session 2 - Feb 6, 2026)
**AI and Webhook Integration Testing - ALL PASSED**

1. **AI (Grok) Integration** - Verified working:
   - xAI Grok API (streaming + non-streaming) confirmed working with `XAI_API_KEY`
   - `/api/ai/chat` endpoint returns 401 for unauthenticated requests (correct)
   - Admin AI settings in Supabase: `provider: xai, model: grok-3-mini-fast, temperature: 0.7`
   - Error handling works for bad models and missing API keys
   - Provider config supports xAI, OpenAI, Anthropic with model lists

2. **Webhook Integration** - Verified working:
   - All 8 event types + `test.ping` properly wired to features
   - HMAC-SHA256 signing works correctly
   - Retry logic (3 attempts with exponential backoff) confirmed
   - Event toggles properly gate dispatch (`EVENT_TO_SETTING` mapping)
   - `feedback.submitted` and `contact.submitted` webhooks confirmed delivered in logs

3. **Bug Fix**: `src/app/api/contact/route.ts`
   - Changed module-level `new Resend(process.env.RESEND_API_KEY)` to lazy `getResendClient()` function
   - Added `dispatchWebhook('contact.submitted', ...)` to no-Resend code path

### Webhook Event Wiring Map
| Event | Source File | Toggle Key |
|---|---|---|
| `feedback.submitted` | `/api/feedback/route.ts` | `feedbackSubmitted` |
| `waitlist.entry` | `/api/waitlist/route.ts` | `waitlistEntry` |
| `subscription.created` | `/api/stripe/webhook/route.ts` | `subscriptionCreated` |
| `subscription.updated` | `/api/stripe/webhook/route.ts` | `subscriptionUpdated` |
| `subscription.cancelled` | `/api/stripe/webhook/route.ts` | `subscriptionCancelled` |
| `team.invited` | `/api/admin/team/route.ts` | `teamInvited` |
| `team.member_joined` | `/api/invite/[token]/accept/route.ts` | `teamMemberJoined` |
| `contact.submitted` | `/api/contact/route.ts` | `contactSubmitted` |
| `test.ping` | Admin webhook test | `null` (always fires) |

### Session 3 Progress (Feb 6, 2026)

4. **SSO/SAML Enterprise Authentication** - Implemented:
   - `src/lib/sso/provider.ts` - Full CRUD for Supabase SAML SSO providers via Admin API
   - `src/app/api/admin/sso/route.ts` - Admin API for listing, creating, deleting SSO providers
   - `src/app/api/auth/sso/check/route.ts` - Public endpoint for domain-based SSO detection
   - `src/app/admin/sso/page.tsx` - Admin dashboard for managing identity providers
   - Login page SSO detection: auto-detects SSO domains on email input, shows SSO login button
   - `ssoEnabled` feature toggle added to FeatureToggles and Setup Dashboard
   - SSO admin nav link added to admin layout
   - SAML config display: SP Metadata URL and ACS URL for IdP configuration

5. **Queue Infrastructure** - BullMQ with Upstash Redis:
   - `src/lib/queue/index.ts` - Job queue with 3 types (email, webhook-retry, report)
   - Worker runs in `instrumentation.ts` with 5 concurrency, 3 retry attempts
   - `src/app/admin/queue/page.tsx` - Admin queue dashboard with metrics

6. **Rate Limiting** - Upstash Redis sliding window:
   - `src/lib/rate-limit/index.ts` - Falls back to in-memory if Redis unavailable

7. **Admin Setup UX Overhaul** - Split monolithic setup page into focused sub-pages:
   - Original 4076-line `setup/page.tsx` replaced with redirect to `/admin/setup/branding`
   - `src/hooks/use-setup-settings.ts` - Shared hook extracting all state management logic
   - `src/hooks/use-setup-settings-context.tsx` - React context provider for cross-page state sharing
   - `src/app/admin/setup/layout.tsx` - Layout with sidebar navigation for 6 sub-pages
   - 6 focused sub-pages: branding, content, pages, pricing, social, features
   - Each sub-page manages only its own section, improving maintainability and load times
   - Sidebar navigation with active state highlighting and section descriptions

8. **Comprehensive Admin Guide** - `ADMIN_GUIDE.md`:
   - 18 sections covering all platform features in plain, non-technical language
   - 500+ lines of documentation for team members managing the platform
   - Covers: Dashboard, Onboarding, Setup (all 6 sections), Users, Teams, Blog, Analytics, Feedback, Waitlist, Email Templates, Queue, SSO, Billing, Webhooks, AI, Feature Toggles, Public Pages

### Next Session Priority
- Run Playwright E2E test suites (38 tests across 5 suites)
- Test AI chat through the UI (requires authenticated user)
- Test webhook admin UI (URL/secret/event toggle configuration)
- Verify Stripe webhook integration with test events
- Test SSO provider creation (requires Supabase Pro for SAML)

### Available Secrets
- `XAI_API_KEY` - Set and working for Grok
- `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` (via integration) - Production secrets
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` - Monitoring
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Redis for queue/rate limiting