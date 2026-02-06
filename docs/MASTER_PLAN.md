# Master SaaS Muse Template - Development Master Plan

**Version**: 3.0  
**Date**: February 6, 2026  
**Status**: MVP Complete + Post-MVP Features  

---

## Executive Summary

This document is the single source of truth for the Master SaaS Muse Template development. We are migrating from Vite + Express (Replit) to **Next.js 14 + Vercel** to achieve proper SSR/SEO capabilities essential for organic traffic growth.

### Why the Migration?
- **SEO**: Next.js provides built-in SSR/ISR for search engine optimization
- **Passive Operation**: Vercel handles scaling, CDN, and infrastructure automatically
- **Clone Workflow**: Vercel templates + GitHub enable one-click duplication
- **Multi-Tenancy**: Next.js middleware.ts perfectly suits domain → app_id resolution
- **Long-term Maintenance**: Centralized updates, richer ecosystem

### Target Timeline
- **MVP Launch**: February 2026 (revised from January 24, 2026)
- **First Muse**: ExtrusionCalculator.com

---

## Technology Stack (Revised)

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Frontend           | Next.js 14+ (App Router), React 18+, TypeScript |
| Styling            | Tailwind CSS + shadcn/ui + next-themes          |
| Backend / DB / Auth| Supabase (PostgreSQL + Auth + RLS + Storage)    |
| Hosting            | Vercel                                          |
| State Management   | TanStack Query (server state)                   |
| Payments (Fiat)    | Stripe                                          |
| Analytics          | Plausible                                       |
| Error Tracking     | Sentry                                          |
| Validation         | Zod                                             |

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
| 10     | Analytics & Tracking     | NOT STARTED | v1.1     |
| 11     | Affiliate System         | NOT STARTED | v1.1     |
| 12     | **n8n Automation**       | **COMPLETE**| **v1.1** |
| 13     | Notifications            | NOT STARTED | v1.1     |
| 14     | Referral Program         | NOT STARTED | v1.1     |
| 15     | **Feedback System**      | **COMPLETE**| **v1.1** |
| 16     | **AI Integration**       | **COMPLETE**| **v1.1** |
| 17     | PWA Support              | NOT STARTED | v1.1     |
| 18     | Internationalization     | NOT STARTED | v1.1     |
| 19     | A/B Testing              | NOT STARTED | v1.1     |
| 20     | User Impersonation       | NOT STARTED | v1.1     |
| 21     | Social Media Management  | NOT STARTED | v1.1     |
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
- [x] E2E Playwright tests (38 tests across 5 suites)
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
- [x] 38 E2E tests across 5 test suites
- [x] Blog/Changelog CRUD tests (9 tests)
- [x] Waitlist management tests (9 tests)
- [x] Feedback management tests (9 tests)
- [x] Email template tests (10 tests)
- [x] Public waitlist submission test (1 test)
- [x] Auth setup for authenticated admin testing
- [x] `data-testid` attributes on all interactive elements
- [x] Graceful skipping when no test data exists

**Key Files**:
```
tests/
├── auth.setup.ts               # Authentication setup
├── blog.spec.ts                 # Blog CRUD tests
├── waitlist.spec.ts             # Waitlist tests
├── feedback.spec.ts             # Feedback tests
├── email-templates.spec.ts      # Email template tests
├── public-waitlist.spec.ts      # Public waitlist test
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

### Current Phase: MVP COMPLETE + Post-MVP Features
**Start Date**: December 29, 2025  
**MVP Completion**: January 25, 2026  
**Team Collaboration Added**: February 4, 2026  
**OAuth Enhancement**: February 5, 2026  
**E2E Testing**: February 5, 2026  
**Sentry Monitoring**: February 5, 2026  
**AI Integration (xAI Grok)**: February 6, 2026  
**Webhook/n8n Integration**: February 6, 2026  

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
- [x] Module 34: E2E Testing - 38 Playwright tests across 5 suites
- [x] Module 35: Blog/Changelog - Markdown content, public pages, admin CRUD
- [x] Module 36: Email Templates - Admin-editable templates, preview, test sending
- [x] Module 37: Waitlist Mode - Pre-launch email collection, CSV export

### Next Steps:
- [ ] Clone template for first production muse (ExtrusionCalculator.com)
- [ ] Add RLS policies for organization_members table in Supabase (currently bypassed via admin client)
- [ ] Upgrade rate limiting from in-memory to Upstash Redis
- [ ] Background job processing (Upstash/BullMQ) for emails and reports
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

### Application
- `NEXT_PUBLIC_APP_URL`
- `SESSION_SECRET`

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

---

## Next Steps

1. **Immediate**: Clone template for ExtrusionCalculator.com
2. **Pre-Production**: Upgrade rate limiting from in-memory to Upstash Redis
3. **Pre-Production**: Add background job processing (Upstash/BullMQ)
4. **Post-Launch**: Add v1.1 features based on user feedback

---

*Last Updated: February 6, 2026*
