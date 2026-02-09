# Master SaaS Muse Template - Development Master Plan

**Version**: 5.0  
**Date**: February 9, 2026  
**Status**: MVP Complete + Post-MVP Features + MuseSocial Module + SocioScheduler Extension  

---

## Executive Summary

This document is the single source of truth for the Master SaaS Muse Template development. We migrated from Vite + Express (Replit) to **Next.js 16+ + Vercel** to achieve proper SSR/SEO capabilities essential for organic traffic growth.

### Why the Migration?
- **SEO**: Next.js provides built-in SSR/ISR for search engine optimization
- **Passive Operation**: Vercel handles scaling, CDN, and infrastructure automatically
- **Clone Workflow**: Vercel templates + GitHub enable one-click duplication
- **Multi-Tenancy**: Next.js middleware.ts perfectly suits domain → app_id resolution
- **Long-term Maintenance**: Centralized updates, richer ecosystem

### Target Timeline
- **MVP Launch**: February 2026 (revised from January 24, 2026)
- **First Muse**: ExtrusionCalculator.com
- **First SaaS Extension**: SocioScheduler (AI social media scheduling)

---

## Technology Stack (Revised)

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Frontend           | Next.js 16+ (App Router), React 18+, TypeScript |
| Styling            | Tailwind CSS + shadcn/ui + next-themes          |
| Backend / DB / Auth| Supabase (PostgreSQL + Auth + RLS + Storage)    |
| Hosting            | Vercel                                          |
| State Management   | TanStack Query (server state)                   |
| Payments (Fiat)    | Stripe                                          |
| Analytics          | Plausible                                       |
| Error Tracking     | Sentry                                          |
| Validation         | Zod                                             |
| Queue & Rate Limit | Upstash Redis + BullMQ                          |

---

## Module Overview

| Module | Name                     | Status      | Priority |
|--------|--------------------------|-------------|----------|
| 1      | Foundation (Next.js)     | COMPLETE    | MVP      |
| 2      | Authentication           | COMPLETE    | MVP      |
| 3      | Admin Features           | COMPLETE    | MVP      |
| 4      | Plan System & Gating     | COMPLETE    | MVP      |
| 5      | Stripe Billing           | COMPLETE    | MVP      |
| 6      | Core Pages & Navigation  | COMPLETE    | MVP      |
| 7      | Security & RLS           | COMPLETE    | MVP      |
| 8      | Monitoring & Docs        | COMPLETE    | MVP      |
| 9      | **Team Collaboration**   | **COMPLETE**| **MVP**  |
| 10     | Analytics & Tracking     | PARTIAL     | v1.1     |
| 11     | Affiliate System         | NOT STARTED | v1.1     |
| 12     | **n8n Automation**       | **COMPLETE**| **v1.1** |
| 13     | **Notifications**        | **COMPLETE**| **v1.1** |
| 14     | Referral Program         | NOT STARTED | v1.1     |
| 15     | **Feedback System**      | **COMPLETE**| **v1.1** |
| 16     | **AI Integration**       | **COMPLETE**| **v1.1** |
| 17     | PWA Support              | NOT STARTED | v1.1     |
| 18     | Internationalization     | NOT STARTED | v1.1     |
| 19     | A/B Testing              | NOT STARTED | v1.1     |
| 20     | **User Impersonation**   | **COMPLETE**| **v1.1** |
| 21     | **MuseSocial Module**    | **COMPLETE**| **v1.1** |
| 22     | Launch Plan Tools        | NOT STARTED | v1.1     |
| 23     | Operations & Support     | NOT STARTED | v1.1     |
| 24     | Multi-Role Dashboards    | NOT STARTED | v1.1     |
| 25     | **Branding Manager**     | **COMPLETE**| **v1.1** |
| 26     | Email/SMS Campaigns      | NOT STARTED | v1.2     |
| 27     | Lead & CRM               | NOT STARTED | v1.2     |
| 28     | Product Catalog          | NOT STARTED | v1.2     |
| 29     | Usage-Based Billing      | NOT STARTED | v1.2     |
| 30     | White-Label              | NOT STARTED | v1.3     |
| 31     | **Onboarding Checklist** | **COMPLETE**| **v1.3** |
| 32     | Data Export              | NOT STARTED | v1.3     |
| 33     | Health Monitor           | NOT STARTED | v1.3     |
| 34     | **E2E Testing**          | **COMPLETE**| **v1.1** |
| 35     | **Blog/Changelog**       | **COMPLETE**| **MVP**  |
| 36     | **Email Templates**      | **COMPLETE**| **MVP**  |
| 37     | **Waitlist Mode**        | **COMPLETE**| **MVP**  |
| 38     | **SSO/SAML Enterprise Auth**  | **COMPLETE** | **v1.1** |
| 39     | **Queue Infrastructure**      | **COMPLETE** | **v1.1** |
| 40     | **Rate Limiting (Upstash)**   | **COMPLETE** | **v1.1** |
| 41     | **Admin Setup UX Overhaul**   | **COMPLETE** | **v1.1** |
| 42     | **Customer Service Tools**    | **COMPLETE** | **v1.1** |
| 43     | **Admin Documentation**       | **COMPLETE** | **v1.1** |
| 44     | **Metrics Dashboard (10 KPIs)**| **COMPLETE** | **v1.1** |
| 45     | **NPS Score Tracking**        | **COMPLETE** | **v1.1** |
| 46     | **Help Widget (Support Chatbot)** | **COMPLETE** | **v1.1** |
| 47     | **In-App Notifications**      | **COMPLETE** | **v1.1** |
| 48     | **Audit Log Viewer**          | **COMPLETE** | **v1.1** |
| 49     | **Legal & Compliance Pages**  | **COMPLETE** | **v1.1** |
| 50     | **Metrics Alerts & Reports**  | **COMPLETE** | **v1.1** |
| 51     | **Database Backup Config**    | **COMPLETE** | **v1.1** |
| 52     | **API Token Rotation**        | **COMPLETE** | **v1.1** |
| 53     | **Centralized API Keys & Integrations** | **COMPLETE** | **v1.1** |
| 54     | **SocioScheduler Extension**  | **COMPLETE** | **v1.1** |

---

## Detailed Module Specifications

### Module 1: Foundation (Next.js Migration)
**Estimated Time**: 3-4 days  
**Dependencies**: None  

**Deliverables**:
- [x] Next.js 14 project with App Router and TypeScript
- [x] Tailwind CSS configuration with dark mode
- [x] shadcn/ui component library setup
- [x] next-themes for theme switching
- [x] Vercel deployment configured
- [x] Environment variables structure
- [x] Project folder structure matching vision doc

**Key Files**:
```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── layout/       # Header, Footer, ThemeToggle
│   │   └── landing/      # Hero, Features
│   └── lib/
│       └── utils.ts
├── middleware.ts
└── next.config.js
```

---

### Module 2: Authentication
**Estimated Time**: 3-4 days  
**Dependencies**: Module 1  
**Status**: COMPLETE

**Deliverables**:
- [x] Supabase client configuration (server + client)
- [x] Email/password signup with confirmation
- [x] Email/password login
- [x] Google OAuth integration (enabled by default)
- [x] GitHub OAuth integration (disabled by default, admin toggle)
- [x] Apple OAuth integration (disabled by default, admin toggle)
- [x] Twitter/X OAuth integration (disabled by default, admin toggle)
- [x] Magic Link passwordless login (enabled by default)
- [x] Admin-controlled OAuth provider toggles (Setup Dashboard > Features)
- [x] Password reset flow
- [x] Protected route middleware
- [x] Session persistence
- [x] Profile page with avatar upload and connected providers
- [x] Link/unlink OAuth providers with safety checks
- [x] Logout functionality

**Key Files**:
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   └── (dashboard)/
│       └── profile/page.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
└── components/
    └── auth/
        ├── LoginForm.tsx
        ├── SignupForm.tsx
        └── AuthProvider.tsx
```

---

### Module 3: Admin Features
**Estimated Time**: 3-4 days  
**Dependencies**: Module 2  
**Status**: COMPLETE

**Deliverables**:
- [x] Admin dashboard with metrics
- [x] User management (view, roles, search)
- [x] Role-based access control (admin/member)
- [x] Organization settings management
- [x] Audit logging for admin actions
- [x] Bootstrap admin for new installations
- [x] Last admin protection

**Database Tables**:
- `user_roles` (user_id, role, app_id, created_at)
- `organization_settings` (id, app_id, settings JSON)
- `audit_logs` (id, user_id, action, details, created_at)

---

### Module 4: Plan System & Freemium Gating
**Estimated Time**: 3-4 days  
**Dependencies**: Module 3  
**Status**: COMPLETE

**Deliverables**:
- [x] Plans table (Free/Pro/Team definitions)
- [x] User subscriptions table
- [x] Plan gating React hooks
- [x] Server-side plan verification middleware
- [x] Pricing page UI
- [x] Upgrade CTAs throughout app
- [x] Feature visibility based on plan
- [x] Usage limits per plan

**Database Tables**:
- `plans` (id, name, price, features JSON, limits JSON)
- `user_subscriptions` (user_id, plan_id, status, stripe_subscription_id)

---

### Module 5: Stripe Billing
**Estimated Time**: 4-5 days  
**Dependencies**: Module 4  
**Status**: COMPLETE

**Deliverables**:
- [x] Stripe SDK integration
- [x] Checkout session creation
- [x] Customer portal integration
- [x] Webhook handler with signature verification
- [x] Subscription lifecycle management
- [x] Transaction logging
- [x] Payment failure handling
- [x] Invoice/receipt access

**Database Tables**:
- `transactions` (id, user_id, amount, type, stripe_id, status, created_at)
- `stripe_customers` (user_id, stripe_customer_id)

---

### Module 6: Core Pages & Navigation
**Estimated Time**: 2-3 days  
**Dependencies**: Modules 4-5  
**Status**: COMPLETE

**Deliverables**:
- [x] Landing page with waitlist
- [x] Dashboard with plan-specific widgets
- [x] Settings page (account, billing, preferences)
- [x] Help/FAQ page
- [x] Global navigation (role-aware)
- [x] Responsive sidebar/header

---

### Module 7: Security & RLS
**Estimated Time**: 2-3 days  
**Dependencies**: Module 6  
**Status**: COMPLETE

**Deliverables**:
- [x] Supabase Row Level Security policies
- [x] Domain → app_id middleware resolution
- [x] Webhook signature verification (Stripe + n8n HMAC-SHA256)
- [x] CSRF protection
- [x] Rate limiting (in-memory; upgrade to Upstash Redis for production)
- [x] Security headers (HSTS, X-Frame-Options, etc.)

---

### Module 8: Monitoring & Documentation
**Estimated Time**: 2-3 days  
**Dependencies**: Module 7  
**Status**: COMPLETE

**Deliverables**:
- [x] Sentry error tracking (fully working - server + browser via `/monitoring` tunnel route)
- [x] Plausible analytics integration
- [x] Structured logging
- [x] E2E Playwright tests (92 tests across 7 files)
- [x] Updated MUSE_CHECKLIST for cloning
- [x] Deployment documentation
- [x] PROJECT_OVERVIEW.md
- [x] SETUP_GUIDE.md

---

### Module 9: Team Collaboration
**Estimated Time**: 3-4 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Organizations table with multi-tenant support
- [x] Organization members with role-based access
- [x] Role hierarchy: Owner > Manager > Member > Viewer
- [x] Email-based invitation system with token validation
- [x] Invitation acceptance flow (signup/login → accept)
- [x] Team management UI in admin dashboard
- [x] Cancel/resend invitation functionality
- [x] Confirmation dialogs for destructive actions
- [x] Auto-add app admin as organization owner
- [x] RLS policies for team tables (via admin client)

**Database Tables**:
- `organizations` (id, name, created_at)
- `organization_members` (id, organization_id, user_id, role, joined_at)
- `invitations` (id, organization_id, email, role, token, invited_by, expires_at, accepted_at, created_at)

**Role Permissions** (from `src/lib/team-permissions.ts`):
| Role    | Manage Team | Manage Users | Edit Settings | Invite Members | Billing | View Analytics | View Team List |
|---------|-------------|--------------|---------------|----------------|---------|----------------|----------------|
| Owner   | Yes         | Yes          | Yes           | Yes            | Yes     | Yes            | Yes            |
| Manager | No          | Yes          | No            | Yes            | No      | Yes            | Yes            |
| Member  | No          | No           | No            | No             | No      | Yes            | Yes            |
| Viewer  | No          | No           | No            | No             | No      | No             | No             |

**Key Files**:
```
src/
├── app/
│   ├── admin/team/page.tsx          # Team management UI
│   ├── invite/[token]/page.tsx      # Invitation acceptance page
│   └── api/
│       ├── admin/team/route.ts      # Team CRUD operations
│       ├── admin/invitations/route.ts
│       ├── invite/[token]/route.ts  # Validate invitation
│       ├── invite/[token]/accept/route.ts
│       └── user/membership/route.ts # Check user's org membership
├── lib/
│   └── team-permissions.ts          # Permission checking utilities
└── components/
    └── admin/TeamManagement.tsx
```

---

### Module 12: n8n/Webhook Automation
**Estimated Time**: 1-2 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Webhook dispatcher library with fire-and-forget delivery
- [x] HMAC-SHA256 payload signing for security
- [x] Retry logic (3 attempts with linear backoff: 1s/2s/3s)
- [x] Per-event enable/disable toggles
- [x] 8 webhook events wired into production API routes:
  - `feedback.submitted` - User submits feedback
  - `waitlist.entry` - New waitlist signup
  - `subscription.created` - New Stripe subscription
  - `subscription.updated` - Subscription plan change
  - `subscription.cancelled` - Subscription cancellation
  - `team.invited` - Team invitation sent
  - `team.member_joined` - Invitation accepted
  - `contact.submitted` - Contact form submission
- [x] Admin webhook configuration UI in Setup Dashboard (Features tab)
- [x] Webhook test endpoint (`/api/admin/webhooks/test`) with synchronous response
- [x] Compatible with n8n, Zapier, Make, and any HTTP endpoint

**Key Files**:
```
src/
├── lib/
│   └── webhooks/
│       └── dispatcher.ts          # HMAC signing, retry, fire-and-forget
├── app/
│   └── api/
│       └── admin/
│           └── webhooks/
│               └── test/route.ts  # Admin-only test ping endpoint
└── types/
    └── settings.ts                # WebhookSettings interface
```

---

### Module 15: Feedback System
**Estimated Time**: 1 day  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] In-app feedback widget for logged-in and anonymous users
- [x] Feedback submission API with validation
- [x] Admin feedback management page
- [x] Status filters (all/new/reviewed/resolved)
- [x] Delete individual feedback entries
- [x] Webhook dispatch on new feedback
- [x] NPS rating (0-10) on feedback submissions
- [x] NPS badge display in admin feedback list

**Key Files**:
```
src/
├── components/
│   ├── feedback-widget.tsx
│   └── conditional-feedback-widget.tsx
├── app/
│   ├── admin/feedback/page.tsx
│   └── api/feedback/route.ts
```

---

### Module 16: AI Integration
**Estimated Time**: 1-2 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Pluggable AI provider abstraction layer
- [x] xAI (Grok) support: grok-3, grok-3-mini, grok-2
- [x] OpenAI support: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- [x] Anthropic support: claude-3-opus, claude-3-sonnet, claude-3-haiku
- [x] Admin-configurable: provider, model, temperature, max tokens, system prompt
- [x] Chat completion API with streaming + non-streaming support
- [x] Available providers/models list endpoint
- [x] Feature toggle: `aiEnabled` in admin settings

**Key Files**:
```
src/
├── lib/
│   └── ai/
│       └── provider.ts           # AI provider abstraction
├── app/
│   └── api/
│       └── ai/
│           ├── chat/route.ts     # Chat completion (streaming)
│           └── providers/route.ts # List providers/models
```

---

### Module 25: Branding Manager (Setup Dashboard)
**Estimated Time**: 2-3 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Setup Dashboard with 4 tabs: Branding, Pricing, Social, Features
- [x] Branding: app name, tagline, logo upload, hero image, colors, company info
- [x] Pricing: Stripe integration (manage products in Stripe Dashboard)
- [x] Social: Twitter, LinkedIn, GitHub, website links
- [x] Features: OAuth toggles, feature flags, AI settings, webhook configuration
- [x] Dynamic branding components that reflect saved settings
- [x] Configurable navigation items
- [x] Announcement bar with admin controls
- [x] Custom pages system

---

### Module 31: Onboarding Wizard
**Estimated Time**: 1 day  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] 4-step guided onboarding for new administrators
- [x] Onboarding state persistence in database
- [x] Progress tracking and step completion

---

### Module 34: E2E Testing
**Estimated Time**: 2-3 days  
**Dependencies**: Modules 1-9  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Playwright test framework configuration
- [x] 92 E2E tests across 7 test files
- [x] Comprehensive E2E suite (e2e-full.spec.ts): public pages, auth, feedback, help widget, metrics, admin, API endpoints, responsive design (46 tests)
- [x] Blog/Changelog CRUD tests (9 tests)
- [x] Waitlist management tests (10 tests)
- [x] Feedback management tests (9 tests)
- [x] Email template tests (10 tests)
- [x] MuseSocial module tests (8 tests)
- [x] Auth setup for authenticated admin testing
- [x] `data-testid` attributes on all interactive elements
- [x] Graceful skipping when no test data exists
- [x] Help widget tests (button visibility, panel open/close, NPS rating, fallback email)
- [x] Metrics dashboard tests (KPI cards, alert buttons)
- [x] 60-second timeouts for admin pages requiring authentication

**Key Files**:
```
tests/
├── auth.setup.ts               # Authentication setup
├── blog.spec.ts                 # Blog CRUD tests
├── e2e-full.spec.ts             # Comprehensive E2E suite (46 tests)
├── waitlist.spec.ts             # Waitlist tests (10 tests)
├── feedback.spec.ts             # Feedback tests (9 tests)
├── email-templates.spec.ts      # Email template tests (10 tests)
├── musesocial.spec.ts           # MuseSocial module tests (8 tests)
└── run-tests.sh                 # Test runner script
playwright.config.ts             # Playwright configuration
```

---

### Module 35: Blog/Changelog System
**Estimated Time**: 1-2 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Markdown-based blog content with live preview
- [x] Public blog page (`/blog`) and individual posts (`/blog/[slug]`)
- [x] Changelog page (`/changelog`)
- [x] Admin CRUD interface for posts
- [x] Draft/published status management

---

### Module 36: Email Template System
**Estimated Time**: 1 day  
**Dependencies**: Module 3, Resend  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Admin-editable email templates stored in database
- [x] Template preview in admin interface
- [x] Test email sending functionality
- [x] Welcome, subscription confirmation, cancellation templates
- [x] Team invitation email template

---

### Module 37: Waitlist Mode
**Estimated Time**: 1 day  
**Dependencies**: Module 6  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Pre-launch email collection page
- [x] Waitlist signup form component
- [x] Admin waitlist management with CSV export
- [x] Delete individual entries
- [x] Feature toggle to enable/disable waitlist mode

---

### Module 38: SSO/SAML Enterprise Authentication
**Estimated Time**: 1 day  
**Dependencies**: Module 2  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Supabase SAML SSO provider management (full CRUD via Admin API)
- [x] Admin SSO dashboard at `/admin/sso`
- [x] Domain-based SSO detection on login page
- [x] Public endpoint for SSO domain checking (`/api/auth/sso/check`)
- [x] SP Metadata URL and ACS URL display for IdP configuration
- [x] `ssoEnabled` feature toggle in admin settings

**Key Files**:
```
src/
├── lib/sso/provider.ts
├── app/admin/sso/page.tsx
└── app/api/
    ├── admin/sso/route.ts
    └── auth/sso/check/route.ts
```

---

### Module 39: Queue Infrastructure (BullMQ + Upstash Redis)
**Estimated Time**: 1 day  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] BullMQ job queue with Upstash Redis backend
- [x] 10 job types: email, webhook-retry, report, metrics-report, metrics-alert, token-rotation, social-post, social-health-check, social-trend-monitor, social-engagement-pull
- [x] Worker with 5 concurrency, 3 retry attempts
- [x] Admin queue dashboard at `/admin/queue`
- [x] Queue metrics: waiting, active, completed, failed, delayed, paused
- [x] Retry and clear failed jobs from admin UI
- [x] Admin-configurable engagement pull interval and lookback hours (1-168h range)

**Key Files**:
```
src/
├── lib/queue/index.ts
├── lib/queue/types.ts
├── app/admin/queue/page.tsx
└── instrumentation.ts (worker startup)
```

---

### Module 40: Rate Limiting (Upstash Redis)
**Estimated Time**: 0.5 days  
**Dependencies**: Module 39  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Sliding window rate limiting with Upstash Redis
- [x] In-memory fallback when Redis is unavailable
- [x] Configurable limits per endpoint

**Key Files**:
```
src/lib/rate-limit/index.ts
```

---

### Module 41: Admin Setup UX Overhaul
**Estimated Time**: 1 day  
**Dependencies**: Module 25  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Split monolithic setup page into 11 focused sub-pages
- [x] Shared state management hook (`use-setup-settings.ts`)
- [x] React context provider for cross-page state sharing
- [x] Layout with sidebar navigation
- [x] Sub-pages: branding, compliance, content, features, integrations, musesocial, pages, pricing, security, social, support

**Key Files**:
```
src/
├── hooks/
│   ├── use-setup-settings.ts
│   └── use-setup-settings-context.tsx
└── app/admin/setup/
    ├── layout.tsx
    ├── branding/page.tsx
    ├── content/page.tsx
    ├── pages/page.tsx
    ├── pricing/page.tsx
    ├── social/page.tsx
    ├── features/page.tsx
    ├── integrations/page.tsx
    └── musesocial/page.tsx
```

---

### Module 42: Customer Service Tools
**Estimated Time**: 1 day  
**Dependencies**: Module 3, Module 5  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Subscription status column in admin users table
- [x] Enhanced user detail dialog with 3 tabs (Overview, Invoices, Notes)
- [x] Stripe subscription and invoice data in user detail
- [x] Direct link to Stripe Customer Portal per user
- [x] Admin notes system for internal customer service tracking
- [x] Notes CRUD API (`/api/admin/notes`)
- [x] Detailed user info API (`/api/admin/users/[userId]`)

**Database Tables**:
- `admin_notes` (id, user_id, note, created_by, created_at)

**Key Files**:
```
src/
├── app/admin/users/page.tsx
└── app/api/admin/
    ├── users/[userId]/route.ts
    └── notes/route.ts
```

---

### Module 43: Admin Documentation
**Estimated Time**: 0.5 days  
**Dependencies**: All modules  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Comprehensive Admin Guide (`docs/ADMIN_GUIDE.md`) - 24+ sections, 800+ lines
- [x] Non-technical language for team members managing the platform
- [x] Covers all admin features, setup, and best practices

---

### Module 44: Metrics Dashboard (10 KPIs)
**Estimated Time**: 1 day  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] 10 KPI cards: Total Users, New Users, Active Subscriptions, MRR, ARPU, LTV, Churn Rate, Conversion Rate, Feedback Count, Waitlist Count
- [x] NPS Score card with color-coded Net Promoter Score
- [x] User Growth and Revenue Growth line charts (Recharts)
- [x] "Email Report" action button (triggers scheduled report via queue)
- [x] "Check Alerts" action button (checks configured thresholds)
- [x] Metrics aggregation API (`/api/admin/metrics`)

---

### Module 45: NPS Score Tracking
**Estimated Time**: 0.5 days  
**Dependencies**: Module 15, Module 46  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] NPS rating (0-10) in feedback widget submissions
- [x] NPS rating (0-10) in help widget after AI responses
- [x] NPS badge display in admin feedback list
- [x] NPS aggregation into Net Promoter Score on metrics dashboard
- [x] Color-coded NPS display (green/yellow/red)

---

### Module 46: Help Widget (Support Chatbot)
**Estimated Time**: 1 day  
**Dependencies**: Module 16  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Floating chat button in bottom corner of site
- [x] AI-powered responses using configured provider/model
- [x] Configurable system prompt and fallback email
- [x] NPS rating collection after AI responses
- [x] Admin toggle to enable/disable
- [x] Independent from feedback widget

**Key Files**:
```
src/components/help-widget.tsx
```

---

### Module 47: In-App Notifications
**Estimated Time**: 0.5 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Bell icon in header with unread count badge
- [x] Notification popover with type-specific icons
- [x] Auto-polling for new notifications
- [x] Mark all as read functionality
- [x] Server-side notification creation utility

**Key Files**:
```
src/components/notification-bell.tsx
src/lib/notifications/
```

---

### Module 48: Audit Log Viewer
**Estimated Time**: 0.5 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Dedicated admin page at `/admin/audit-logs`
- [x] Paginated table of audit log entries
- [x] Filterable by action type and user
- [x] Shows user, action, timestamp, and details

---

### Module 49: Legal & Compliance Pages
**Estimated Time**: 1 day  
**Dependencies**: Module 6  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] 9 legal pages with dynamic variable replacement: Terms, Privacy, Cookie Policy, Acceptable Use, Accessibility, Data Handling, DMCA, AI Data Usage, Security Policy
- [x] Cookie consent banner (configurable via admin)
- [x] Compliance settings in Setup > Features
- [x] MFA and password requirement configuration

---

### Module 50: Metrics Alerts & Scheduled Reports
**Estimated Time**: 0.5 days  
**Dependencies**: Module 44, Module 39  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Configurable alert thresholds for churn rate and user growth
- [x] Email notifications when thresholds exceeded
- [x] BullMQ job type for scheduled KPI summary emails
- [x] Admin-triggered report sending
- [x] Alert settings in Admin > Setup > Security

---

### Module 51: Database Backup Configuration
**Estimated Time**: 0.5 days  
**Dependencies**: Module 3  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Admin UI for backup notification preferences
- [x] Configurable frequency and retention periods
- [x] Managed by Supabase (configuration only)

---

### Module 52: API Token Rotation
**Estimated Time**: 0.5 days  
**Dependencies**: Module 39  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] BullMQ job type for automated webhook secret rotation
- [x] Configurable rotation interval
- [x] Managed via Admin > Setup > Security

---

### Module 21: MuseSocial Module (Social Media Management)
**Estimated Time**: 3-4 days  
**Dependencies**: Module 3, Module 16 (AI), Module 39 (Queue)  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Toggleable social media management extension
- [x] Two tiers: Universal (basic posting, 10 AI generations/day, 20 posts/day) and Power (full features, 100 AI generations/day, 10,000 posts/day)
- [x] 10 platform support: Twitter/X, LinkedIn, Instagram, YouTube, Facebook, TikTok, Reddit, Pinterest, Snapchat, Discord
- [x] Admin setup page at `/admin/setup/musesocial` with module enable/disable, tier selection, platform toggles
- [x] Platform API Keys section on MuseSocial setup page with collapsible groups, inline edit/reveal/delete, status indicators
- [x] Social account connection for users at `/dashboard/social`
- [x] AI-powered post generation with multimodal image support
- [x] Post scheduling and management
- [x] Social API health checker
- [x] Social KPI cards on admin metrics dashboard (tier badge, AI generation count)
- [x] Conditional onboarding wizard step (only appears when module is enabled)
- [x] Vercel Cron fallback for scheduled post delivery
- [x] n8n workflow templates (auto-post-rss, ai-generate-and-schedule, engagement-monitor)
- [x] Playwright E2E tests for social features
- [x] Tier-based rate limiting with daily caps
- [x] Dependency warnings when AI is disabled, no platforms enabled, or API keys missing
- [x] BullMQ retry logic (3 attempts, exponential backoff) for post delivery failures
- [x] All social imports use dynamic loading or type-only imports (tree-shaking safe)

**Key Files**:
```
src/
├── lib/social/
│   ├── client.ts                    # Platform client interfaces (all 10 platforms)
│   ├── rate-limits.ts               # Tier-based rate limiting constants and check function
│   └── n8n-templates/               # n8n workflow JSON templates
├── app/
│   ├── admin/setup/musesocial/page.tsx  # Admin configuration + Platform API Keys
│   ├── dashboard/social/page.tsx        # User-facing social accounts page
│   └── api/social/                      # Social API routes (accounts, posts, generate-post, health)
```

---

### Module 53: Centralized API Keys & Integrations
**Estimated Time**: 1-2 days  
**Dependencies**: Module 3, Module 41  
**Status**: COMPLETE (February 2026)

**Deliverables**:
- [x] Admin setup page at `/admin/setup/integrations` for Tech Stack API keys
- [x] Collapsible groups (collapsed by default) with chevron toggle
- [x] Status indicators: green dot (configured), red dot (required missing), gray dot (optional missing)
- [x] Summary cards at top: "Total Keys" and "Required Keys" with All Set / Missing badges
- [x] Required/Optional labels on each key (Supabase, Stripe, Resend = required; others = optional)
- [x] Format validation on save (Stripe sk_ prefix, Supabase URL pattern, OpenAI sk- prefix, Sentry DSN, HTTPS URLs)
- [x] Inline edit/reveal/delete with source badges (Dashboard vs Env Var)
- [x] Social platform API keys moved to MuseSocial setup page (feature-gated)
- [x] API supports `?section=tech|social` query params for targeted fetching
- [x] Keys stored in `config_secrets` database table, take effect immediately
- [x] DB values take priority over environment variables
- [x] 40+ allowed env var names in allowlist

**Key Files**:
```
src/
├── app/
│   ├── admin/setup/integrations/page.tsx  # Tech Stack keys (collapsible groups)
│   └── api/admin/integrations/route.ts    # CRUD API (GET ?section=, POST, PATCH, DELETE)
├── lib/config/
│   ├── secrets.ts                         # getConfigValue utility (DB + env var resolution)
│   └── ensure-table.ts                    # Auto-creates config_secrets table on first use
```

---

### Module 54: SocioScheduler Extension (AI Social Media Scheduling)
**Estimated Time**: 5-7 days  
**Dependencies**: Module 21 (MuseSocial), Module 5 (Stripe), Module 16 (AI), Module 39 (Queue)  
**Status**: COMPLETE (February 2026)

SocioScheduler is a SaaS product built **on top of** MuseKit using the database extension pattern. It demonstrates how to build a real product from the template without modifying core schema. Targeted at solopreneurs and gig workers who need AI-powered social media scheduling.

**Core Principle**: Minimize hardcoded variables. All configurable values are editable from the admin dashboard.

**Deliverables**:
- [x] Database extension pattern: core tables in `migrations/core/`, SocioScheduler-specific in `migrations/extensions/`
- [x] Per-user Stripe tier resolution (`getUserSocialTier` in `src/lib/social/user-tier.ts`) maps subscription metadata key `muse_tier` (values: tier_1/tier_2/tier_3, admin-configurable) to rate limits
- [x] OAuth flows for Facebook/LinkedIn/Twitter with PKCE (`/api/social/connect`, `/api/social/callback/[platform]`)
- [x] Social dashboard with 7 pages: overview, calendar, engagement, queue, posts, brand preferences, onboarding
- [x] Social overview dashboard with usage progress bar, "X posts remaining" line, and Quick Generate dialog
- [x] Engagement analytics dashboard with Recharts charts (`/dashboard/social/engagement`)
- [x] Calendar view with month-grid showing scheduled posts and per-platform count tooltips (`/dashboard/social/calendar`)
- [x] Brand preferences system (tone, niche, location, target audience, posting goals, preferred platforms, frequency)
- [x] AI post generation with 15 admin-editable niche-specific prompts using all brand preference fields
- [x] Default niche fallback: "Use a casual, local, authentic small business voice"
- [x] Quick Generate dialog on Overview (platform picker + topic input, copy-to-clipboard)
- [x] Reusable `SocialUpgradeBanner` component integrated across 5 dashboard pages (80%+ usage trigger, sessionStorage dismissal)
- [x] Admin-configurable BullMQ engagement pull settings (intervalHours/lookbackHours, 1-168h range)
- [x] Beta debug mode via `MUSE_DEBUG_MODE=true` env var with mock data at `/api/social/debug`
- [x] BullMQ "no posts" case logs at info level (not error) for clean log output
- [x] All RLS policies verified, proper empty states on all dashboard pages, no secrets exposed
- [x] Admin-configurable niche guidance entries with validation (empty entries filtered on save)

**Database Extension Tables** (`migrations/extensions/`):
- `brand_preferences` (id, user_id, org_id, tone, niche, location, sample_urls, target_audience, posting_goals, preferred_platforms, post_frequency)
- `alert_logs` (id, user_id, org_id, trend_text, suggested_post_id, action_taken, platform, source_url)
- Extended `social_posts` with: `trend_source`, `niche_triggered` columns, plus expanded status values (`queued`, `approved`, `ignored`)
- Composite index on `social_posts(user_id, status)` for fast queue views

**Stripe Tier Mapping** (metadata key: `muse_tier`, admin-configurable via MuseSocial setup page):
| Tier | Metadata Value | Posts/Day | AI Generations/Day |
|------|---------------|-----------|-------------------|
| Starter (tier_1) | `tier_1` | 5 | 3 |
| Basic (tier_2) | `tier_2` | 20 | 15 |
| Premium (tier_3) | `tier_3` | 100 | 50 |

> **Note:** Tier definitions are dynamic and admin-configurable. Display names, Stripe metadata values, and rate limits can all be edited from the admin dashboard's MuseSocial setup page. Admins can add or remove tiers as needed — the system is not locked to 3. Default fallback tier is `tier_1`.

**Key Files**:
```
src/
├── lib/social/
│   ├── user-tier.ts                     # Stripe tier resolution
│   ├── debug.ts                         # Beta debug mode utilities
│   └── client.ts                        # Platform clients
├── app/
│   ├── dashboard/social/
│   │   ├── overview/page.tsx            # Dashboard + Quick Generate
│   │   ├── calendar/page.tsx            # Month-grid calendar
│   │   ├── engagement/page.tsx          # Recharts analytics
│   │   ├── queue/page.tsx               # Post queue management
│   │   ├── posts/page.tsx               # Post history
│   │   ├── brand/page.tsx               # Brand preferences
│   │   └── onboarding/page.tsx          # Social onboarding wizard
│   └── api/social/
│       ├── connect/route.ts             # OAuth initiation
│       ├── callback/[platform]/route.ts # OAuth callback
│       ├── tier/route.ts                # User tier resolution
│       ├── generate-post/route.ts       # AI post generation
│       ├── brand-preferences/route.ts   # Brand preferences CRUD
│       ├── debug/route.ts               # Beta debug endpoint
│       ├── accounts/route.ts            # Connected accounts
│       ├── posts/route.ts               # Post CRUD
│       └── health/route.ts              # API health check
├── components/
│   └── social-upgrade-banner.tsx        # Reusable upgrade CTA banner
└── migrations/extensions/
    ├── 001_socioschedule_tables.sql     # Extension tables
    └── 002_engagement_metrics_placeholder.sql
```

---

## MVP Feature Checklist (from 33-Feature List)

| # | Feature                          | Module | Status      |
|---|----------------------------------|--------|-------------|
| 1 | User Auth & Onboarding           | 2      | COMPLETE    |
| 2 | Plan System & Freemium Gating    | 4      | COMPLETE    |
| 3 | Billing & Payments (Stripe)      | 5      | COMPLETE    |
| 4 | Global Navigation & UI Kit       | 1, 6   | COMPLETE    |
| 5 | Core User Pages                  | 6      | COMPLETE    |
| 6 | Admin Backend Dashboard          | 3      | COMPLETE    |
| 7 | Security & Privacy Rules         | 7      | COMPLETE    |
| 8 | Error Logging & Monitoring       | 8      | COMPLETE    |
| 9 | Team Collaboration & Roles       | 9      | COMPLETE    |
| 10| AI Integration (xAI/OpenAI)      | 16     | COMPLETE    |
| 11| Webhook/n8n Automation           | 12     | COMPLETE    |
| 12| Blog/Changelog System            | 35     | COMPLETE    |
| 13| Email Template Editor            | 36     | COMPLETE    |
| 14| Waitlist Mode                    | 37     | COMPLETE    |
| 15| Feedback Widget                  | 15     | COMPLETE    |
| 16| Dark/Light Mode Toggle           | 1      | COMPLETE    |
| 17| Setup Dashboard/Branding Manager | 25     | COMPLETE    |
| 18| Onboarding Wizard                | 31     | COMPLETE    |
| 19| E2E Testing (Playwright)         | 34     | COMPLETE    |
| 20| OAuth Enhancement (5 providers)  | 2      | COMPLETE    |
| 21| SEO/Sitemap                      | 6      | COMPLETE    |
| 22| SSO/SAML Enterprise Auth         | 38     | COMPLETE    |
| 23| Queue Infrastructure (BullMQ)    | 39     | COMPLETE    |
| 24| Rate Limiting (Upstash Redis)    | 40     | COMPLETE    |
| 25| Admin Setup UX Overhaul          | 41     | COMPLETE    |
| 26| Customer Service Tools           | 42     | COMPLETE    |
| 27| Admin Documentation              | 43     | COMPLETE    |
| 28| Metrics Dashboard (10 KPIs)      | 44     | COMPLETE    |
| 29| NPS Score Tracking               | 45     | COMPLETE    |
| 30| Help Widget (Support Chatbot)    | 46     | COMPLETE    |
| 31| In-App Notifications             | 47     | COMPLETE    |
| 32| Audit Log Viewer                 | 48     | COMPLETE    |
| 33| Legal & Compliance Pages         | 49     | COMPLETE    |
| 34| Metrics Alerts & Reports         | 50     | COMPLETE    |
| 35| Database Backup Config           | 51     | COMPLETE    |
| 36| API Token Rotation               | 52     | COMPLETE    |
| 37| MuseSocial Module (10 platforms) | 21     | COMPLETE    |
| 38| Centralized API Keys & Integrations | 53 | COMPLETE    |
| 39| SocioScheduler Extension         | 54     | COMPLETE    |

---

## Clone & Customize Workflow

When creating a new muse from this template:

### Step 1: Clone Repository (2 min)
```bash
# Use GitHub template or Vercel deploy button
# Rename project to new muse name
```

### Step 2: Update Configuration (5 min)
- Edit `config/muse.config.json`:
  - project.name, project.tagline
  - branding.companyName, supportEmail
  - features flags

### Step 3: Setup Supabase (10 min)
- Create new Supabase project
- Copy Project URL and anon key
- Run database migrations
- Configure storage bucket

### Step 4: Setup Stripe (10 min)
- Create Stripe products for plans
- Copy API keys
- Configure webhook endpoint

### Step 5: Deploy to Vercel (5 min)
- Connect to Vercel
- Add environment variables
- Configure custom domain

### Step 6: Bootstrap Admin (2 min)
- Sign up with admin email
- Run bootstrap admin endpoint

---

## Progress Tracking

### Current Phase: MVP COMPLETE + Post-MVP Features + MuseSocial + SocioScheduler
**Start Date**: December 29, 2025  
**MVP Completion**: January 25, 2026  
**Team Collaboration Added**: February 4, 2026  
**OAuth Enhancement**: February 5, 2026  
**E2E Testing**: February 5, 2026  
**Sentry Monitoring**: February 5, 2026  
**AI Integration (xAI Grok)**: February 6, 2026  
**Webhook/n8n Integration**: February 6, 2026  
**SSO/SAML Enterprise Auth**: February 6, 2026  
**Queue Infrastructure**: February 6, 2026  
**Rate Limiting**: February 6, 2026  
**Admin Setup UX Overhaul**: February 6, 2026  
**Customer Service Tools**: February 6, 2026  
**Admin Documentation**: February 6, 2026  
**Metrics Dashboard (10 KPIs)**: February 6, 2026  
**NPS Score Tracking**: February 6, 2026  
**Help Widget (Support Chatbot)**: February 6, 2026  
**In-App Notifications**: February 6, 2026  
**Audit Log Viewer**: February 6, 2026  
**Legal & Compliance Pages**: February 6, 2026  
**Metrics Alerts & Reports**: February 6, 2026  
**E2E Tests Expanded to 46**: February 6, 2026  
**MuseSocial Module (10 platforms, 2 tiers)**: February 7, 2026  
**Centralized API Keys & Integrations**: February 7, 2026  
**SocioScheduler Extension (OAuth, Tiers, Engagement, Calendar, Brand Prefs)**: February 8, 2026  
**SocioScheduler Polish (Upgrade Banner, Quick Generate, Engagement Config)**: February 9, 2026  

### Completed Work (Next.js + Vercel):
- [x] Module 1: Foundation - Landing page, dark/light mode, header/footer, Vercel deployment
- [x] Module 2: Authentication - Email/password, 5 OAuth providers (Google, GitHub, Apple, Twitter/X, Magic Link), password reset, protected routes, profile with avatar and connected providers management
- [x] Module 3: Admin Features - Dashboard with metrics, user management, settings, audit logging, onboarding wizard
- [x] Module 4: Plan System & Gating - Feature gating, tier limits, upgrade flows
- [x] Module 5: Stripe Billing - Checkout, webhooks, customer portal, subscription management
- [x] Module 6: Core Pages & Navigation - Profile, billing, pricing, landing, about, contact, FAQ, features, docs, privacy, terms, custom pages, blog, changelog
- [x] Module 7: Security & RLS - Supabase RLS policies, Zod validation, rate limiting, security headers, HMAC webhook verification
- [x] Module 8: Monitoring & Docs - Sentry error tracking (server + browser), Plausible analytics, structured logging, comprehensive documentation
- [x] Module 9: Team Collaboration - Organizations, team members, invitations, role-based permissions (Owner/Manager/Member/Viewer)
- [x] Module 12: n8n/Webhook Automation - Fire-and-forget dispatch, HMAC-SHA256 signing, 8 events, admin configuration
- [x] Module 15: Feedback System - In-app widget, admin management, status filters
- [x] Module 16: AI Integration - Pluggable providers (xAI Grok, OpenAI, Anthropic), streaming chat API, admin configuration
- [x] Module 25: Branding Manager - Setup Dashboard with 4 tabs, dynamic branding, navigation config, announcement bar
- [x] Module 31: Onboarding Wizard - 4-step guided admin setup
- [x] Module 34: E2E Testing - 92 Playwright tests across 7 files
- [x] Module 35: Blog/Changelog - Markdown content, public pages, admin CRUD
- [x] Module 36: Email Templates - Admin-editable templates, preview, test sending
- [x] Module 37: Waitlist Mode - Pre-launch email collection, CSV export
- [x] Module 38: SSO/SAML - Enterprise authentication with domain-based detection
- [x] Module 39: Queue Infrastructure - BullMQ with Upstash Redis, 10 job types, admin dashboard
- [x] Module 40: Rate Limiting - Upstash Redis sliding window with in-memory fallback
- [x] Module 41: Admin Setup UX - Split into 11 focused sub-pages with sidebar navigation
- [x] Module 42: Customer Service Tools - Subscription status, user detail, invoices, admin notes
- [x] Module 43: Admin Documentation - Comprehensive admin guide (24+ sections)
- [x] Module 44: Metrics Dashboard - 10 KPIs, NPS score, growth charts, alert thresholds
- [x] Module 45: NPS Score Tracking - 0-10 rating in feedback and help widgets
- [x] Module 46: Help Widget - AI-powered floating support chatbot
- [x] Module 47: In-App Notifications - Bell icon, unread badges, auto-polling
- [x] Module 48: Audit Log Viewer - Paginated, filterable admin page
- [x] Module 49: Legal & Compliance - 9 legal pages, cookie consent, compliance settings
- [x] Module 50: Metrics Alerts & Reports - Churn/growth thresholds, scheduled email reports
- [x] Module 51: Database Backup Config - Admin UI for backup preferences
- [x] Module 52: API Token Rotation - Automated webhook secret rotation
- [x] Module 21: MuseSocial Module - Toggleable social media management with 10 platforms, 2 tiers, AI-powered post generation, scheduling, n8n templates, E2E tests
- [x] Module 53: Centralized API Keys & Integrations - Collapsible groups, Required/Optional labels, format validation, social keys on MuseSocial page
- [x] Module 54: SocioScheduler Extension - OAuth flows, Stripe tier integration, engagement analytics, calendar, brand preferences, Quick Generate, upgrade banner, admin-configurable engagement pull

### Next Steps:
- [ ] Clone template for first production muse (ExtrusionCalculator.com)
- [ ] Add RLS policies for organization_members table in Supabase (currently bypassed via admin client)
- [x] Upgrade rate limiting from in-memory to Upstash Redis
- [x] Background job processing (Upstash/BullMQ) for emails and reports
- [ ] Dynamic tiers for MuseSocial (allow admins to create unlimited custom tiers from dashboard)
- [ ] Real platform API integration for 7 newer platforms (YouTube, Facebook, TikTok, Reddit, Pinterest, Snapchat, Discord)
- [ ] Approval queue UI for AI-generated posts (currently data model supports it, UI not built)
- [ ] v1.1 features as prioritized

---

## Environment Variables Required

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

### Stripe
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Email
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Analytics & Monitoring
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`

### AI (Optional)
- `XAI_API_KEY` - For xAI/Grok AI features
- `OPENAI_API_KEY` - For OpenAI features (if selected as provider)
- `ANTHROPIC_API_KEY` - For Anthropic features (if selected as provider)

### Queue & Rate Limiting
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL for queue and rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis authentication token

### Application
- `NEXT_PUBLIC_APP_URL`
- `SESSION_SECRET`

### SocioScheduler (Optional)
- `MUSE_DEBUG_MODE` - Set to `true` to enable beta debug mode with mock data

---

## Decision Log

| Date       | Decision                                    | Rationale                                      |
|------------|---------------------------------------------|------------------------------------------------|
| 2025-12-29 | Migrate from Vite+Express to Next.js+Vercel | SEO critical; SSR required for organic traffic |
| 2025-12-29 | Extend timeline to February 2026            | Allow proper migration without rushing         |
| 2026-02-04 | Add team collaboration (Module 9)           | Multi-user orgs essential for SaaS products    |
| 2026-02-05 | Add 5 OAuth providers + admin toggles       | Comprehensive auth options for user convenience|
| 2026-02-05 | Add Playwright E2E testing (38 tests)       | Ensure quality and catch regressions           |
| 2026-02-05 | Integrate Sentry error tracking             | Production monitoring for reliability          |
| 2026-02-06 | Add pluggable AI integration                | AI features increasingly expected in SaaS      |
| 2026-02-06 | Add webhook/n8n automation system           | Enable workflow automation with external tools |
| 2026-02-06 | Add SSO/SAML enterprise auth                | Enterprise customers need SSO for compliance    |
| 2026-02-06 | Add BullMQ queue with Upstash Redis         | Background jobs needed for emails and reports    |
| 2026-02-06 | Upgrade rate limiting to Upstash            | In-memory rate limiting doesn't work on serverless|
| 2026-02-06 | Split admin setup into 11 sub-pages          | Monolithic page too large, slow to load          |
| 2026-02-06 | Add customer service tools                  | Admin needs visibility into user subscriptions   |
| 2026-02-06 | Add metrics dashboard with 10 KPIs          | Business intelligence for SaaS operators         |
| 2026-02-06 | Add NPS score tracking                      | Measure customer satisfaction across widgets      |
| 2026-02-06 | Add help widget (support chatbot)           | AI-powered self-service support for users         |
| 2026-02-06 | Add in-app notifications                    | Keep users informed of important events           |
| 2026-02-06 | Add audit log viewer                        | Compliance and admin action tracking              |
| 2026-02-06 | Add legal & compliance pages                | Legal requirements for SaaS products              |
| 2026-02-06 | Add metrics alerts & scheduled reports      | Proactive monitoring of business health           |
| 2026-02-06 | Expand E2E tests to 92 across 7 files       | Comprehensive coverage including new features     |
| 2026-02-07 | Add MuseSocial module (10 platforms, 2 tiers) | Social media management is key SaaS differentiator |
| 2026-02-07 | Centralized API Keys with collapsible groups  | Admins need easy way to manage all service keys    |
| 2026-02-07 | Move social API keys to MuseSocial page       | Feature-gate social keys, reduce clutter on main page |
| 2026-02-07 | Add format validation for API keys            | Prevent common entry errors with key format checks |
| 2026-02-08 | Build SocioScheduler as extension pattern     | Dogfood MuseKit template cloning; prove extension model |
| 2026-02-08 | Use database extension pattern (migrations/extensions/) | Keep core MuseKit schema untouched for clean cloning |
| 2026-02-08 | Per-user Stripe tier resolution via metadata  | Solopreneur pricing needs distinct from MuseKit base tiers |
| 2026-02-09 | Add upgrade banner at 80%+ usage              | Proactive upsell without being intrusive          |
| 2026-02-09 | Admin-configurable engagement pull schedule   | Operators need control over API polling frequency  |

---

## Next Steps

1. **Immediate**: Clone template for ExtrusionCalculator.com
2. **Testing**: Run Playwright E2E test suites and verify all features
3. **SocioScheduler Enhancements**: Approval queue UI for AI-generated posts, real platform API posting
4. **MuseSocial Enhancements**: Dynamic tiers (admin-created custom tiers), real platform API integration for 7 newer platforms
5. **General**: Continue minimizing hardcoded variables
6. **Post-Launch**: Add v1.1 features based on user feedback

---

*Last Updated: February 9, 2026*
