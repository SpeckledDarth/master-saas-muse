# MuseKit — Strategic Plan & Vision

MuseKit is a production-ready SaaS template built with Next.js and Vercel. It provides everything needed to launch a new SaaS product: authentication, billing, admin tools, AI integration, affiliate marketing, and more. The first product built on MuseKit is **PassivePost**, an AI social media scheduling tool.

---

## Why MuseKit?

- **SEO**: Next.js provides built-in SSR/ISR for search engine optimization
- **Passive Operation**: Vercel handles scaling, CDN, and infrastructure automatically
- **Clone Workflow**: Vercel templates + GitHub enable one-click duplication
- **Multi-Tenancy**: Next.js middleware.ts handles domain-to-app resolution
- **Centralized Updates**: One template, many products

---

## Technology Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Frontend           | Next.js 16+ (App Router), React 18+, TypeScript |
| Styling            | Tailwind CSS + shadcn/ui + next-themes          |
| Backend / DB / Auth| Supabase (PostgreSQL + Auth + RLS + Storage)    |
| Hosting            | Vercel                                          |
| State Management   | TanStack Query (server state)                   |
| Payments           | Stripe                                          |
| Email              | Resend                                          |
| Analytics          | Plausible                                       |
| Error Tracking     | Sentry                                          |
| Validation         | Zod                                             |
| Queue & Rate Limit | Upstash Redis + BullMQ                          |
| AI                 | xAI (Grok), OpenAI, Anthropic (pluggable)       |

---

## Module Overview

All modules are complete. The table below shows every capability included in the template.

| # | Module | Category |
|---|--------|----------|
| 1 | Foundation (Next.js App Router) | Core |
| 2 | Authentication (Email, 5 OAuth providers, Magic Link, SSO/SAML) | Core |
| 3 | Admin Dashboard & User Management | Core |
| 4 | Plan System & Freemium Gating | Core |
| 5 | Stripe Billing (Checkout, Webhooks, Portal) | Core |
| 6 | Core Pages & Navigation | Core |
| 7 | Security & Row Level Security | Core |
| 8 | Monitoring (Sentry, Plausible, Logging) | Core |
| 9 | Team Collaboration (Roles, Invitations) | Core |
| 12 | Webhook/n8n Automation (8 events, HMAC signing) | Integrations |
| 15 | Feedback System (Widget, NPS) | Engagement |
| 16 | AI Integration (xAI, OpenAI, Anthropic) | AI |
| 21 | PassivePost Module (10 platforms, tiered) | Extension |
| 25 | Branding Manager (Setup Dashboard) | Admin |
| 31 | Onboarding Wizard (4-step guided setup) | Admin |
| 34 | E2E Testing (92 Playwright tests) | Quality |
| 35 | Blog/Changelog System | Content |
| 36 | Email Template Editor | Communication |
| 37 | Waitlist Mode | Pre-launch |
| 38 | SSO/SAML Enterprise Auth | Enterprise |
| 39 | Queue Infrastructure (BullMQ + Upstash, 10 job types) | Infrastructure |
| 40 | Rate Limiting (Upstash Redis) | Security |
| 41 | Admin Setup UX (11 sub-pages) | Admin |
| 42 | Customer Service Tools | Admin |
| 43 | Admin Documentation | Documentation |
| 44 | Metrics Dashboard (10 KPIs + NPS) | Analytics |
| 45 | NPS Score Tracking | Analytics |
| 46 | Help Widget (AI Support Chatbot) | Support |
| 47 | In-App Notifications | UX |
| 48 | Audit Log Viewer | Compliance |
| 49 | Legal & Compliance Pages (9 pages) | Legal |
| 50 | Metrics Alerts & Scheduled Reports | Monitoring |
| 51 | Database Backup Configuration | Operations |
| 52 | API Token Rotation | Security |
| 53 | Centralized API Keys & Integrations | Admin |
| 54 | PassivePost Extension (42 features, 60+ API routes) | Extension |
| 55 | Landing Page Components (16 components) | Marketing |
| 56 | 950-Scale Color Model | Design |
| 57 | Interactive State System | Design |
| 58 | Header & Footer Styling | Design |
| 59 | Section Ordering & Backgrounds | Design |
| 60 | Feature Sub-Page System | Marketing |

---

## Module Specifications

### Module 1: Foundation

- Next.js 14+ project with App Router and TypeScript
- Tailwind CSS with dark mode via next-themes
- shadcn/ui component library
- Vercel deployment
- Environment variables structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/           # shadcn components
│   ├── layout/       # Header, Footer, ThemeToggle
│   └── landing/      # Hero, Features
└── lib/
    └── utils.ts
```

---

### Module 2: Authentication

- Email/password signup with confirmation
- Google OAuth (enabled by default)
- GitHub, Apple, X (Twitter) OAuth (disabled by default, admin toggle)
- Magic Link passwordless login (enabled by default)
- Admin-controlled OAuth provider toggles
- Password reset flow
- Protected route middleware
- Session persistence
- Profile page with avatar upload and connected providers
- Link/unlink OAuth providers with safety checks

```
src/
├── app/(auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── reset-password/page.tsx
├── lib/supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
└── components/auth/
    ├── LoginForm.tsx
    ├── SignupForm.tsx
    └── AuthProvider.tsx
```

---

### Module 3: Admin Features

- Admin dashboard with metrics
- User management (view, roles, search)
- Role-based access control (admin/member)
- Organization settings management
- Audit logging for admin actions
- Bootstrap admin for new installations
- Last admin protection

**Database Tables:** `user_roles`, `organization_settings`, `audit_logs`

---

### Module 4: Plan System & Freemium Gating

- Plans table (Free/Pro/Team definitions)
- User subscriptions table
- Plan gating React hooks
- Server-side plan verification middleware
- Pricing page UI
- Upgrade CTAs throughout app
- Feature visibility and usage limits based on plan

**Database Tables:** `plans`, `user_subscriptions`

---

### Module 5: Stripe Billing

- Stripe SDK integration
- Checkout session creation
- Customer portal integration
- Webhook handler with signature verification
- Subscription lifecycle management
- Transaction logging
- Payment failure handling
- Invoice/receipt access

**Database Tables:** `transactions`, `stripe_customers`

---

### Module 6: Core Pages & Navigation

- Landing page with waitlist
- Dashboard with plan-specific widgets
- Settings page (account, billing, preferences)
- Help/FAQ page
- Global navigation (role-aware)
- Responsive sidebar/header

---

### Module 7: Security & RLS

- Supabase Row Level Security policies
- Domain-to-app_id middleware resolution
- Webhook signature verification (Stripe + n8n HMAC-SHA256)
- CSRF protection
- Rate limiting (Upstash Redis with in-memory fallback)
- Security headers (HSTS, X-Frame-Options, etc.)

---

### Module 8: Monitoring & Documentation

- Sentry error tracking (server + browser via `/monitoring` tunnel route)
- Plausible analytics integration
- Structured logging
- 92 Playwright E2E tests across 7 files

---

### Module 9: Team Collaboration

- Organizations table with multi-tenant support
- Organization members with role-based access
- Role hierarchy: Owner > Manager > Member > Viewer
- Email-based invitation system with token validation
- Invitation acceptance flow
- Team management UI in admin dashboard
- Cancel/resend invitation functionality

**Database Tables:** `organizations`, `organization_members`, `invitations`

**Role Permissions:**

| Role    | Manage Team | Manage Users | Edit Settings | Invite Members | Billing | View Analytics | View Team List |
|---------|-------------|--------------|---------------|----------------|---------|----------------|----------------|
| Owner   | Yes         | Yes          | Yes           | Yes            | Yes     | Yes            | Yes            |
| Manager | No          | Yes          | No            | Yes            | No      | Yes            | Yes            |
| Member  | No          | No           | No            | No             | No      | Yes            | Yes            |
| Viewer  | No          | No           | No            | No             | No      | No             | No             |

```
src/
├── app/admin/team/page.tsx
├── app/invite/[token]/page.tsx
├── app/api/admin/team/route.ts
├── app/api/admin/invitations/route.ts
├── app/api/invite/[token]/route.ts
├── app/api/invite/[token]/accept/route.ts
├── app/api/user/membership/route.ts
├── lib/team-permissions.ts
└── components/admin/TeamManagement.tsx
```

---

### Module 12: Webhook/n8n Automation

- Webhook dispatcher with fire-and-forget delivery
- HMAC-SHA256 payload signing for security
- Retry logic (3 attempts with linear backoff)
- Per-event enable/disable toggles
- 8 webhook events: `feedback.submitted`, `waitlist.entry`, `subscription.created`, `subscription.updated`, `subscription.cancelled`, `team.invited`, `team.member_joined`, `contact.submitted`
- Admin webhook configuration UI
- Webhook test endpoint
- Compatible with n8n, Zapier, Make, and any HTTP endpoint

```
src/
├── lib/webhooks/dispatcher.ts
├── app/api/admin/webhooks/test/route.ts
└── types/settings.ts
```

---

### Module 15: Feedback System

- In-app feedback widget for logged-in and anonymous users
- Feedback submission API with validation
- Admin feedback management page
- Status filters (all/new/reviewed/resolved)
- NPS rating (0-10) on feedback submissions
- Webhook dispatch on new feedback

---

### Module 16: AI Integration

- Pluggable AI provider abstraction layer
- xAI (Grok), OpenAI, and Anthropic support
- Admin-configurable: provider, model, temperature, max tokens, system prompt
- Chat completion API with streaming + non-streaming support
- Available providers/models list endpoint
- Feature toggle: `aiEnabled` in admin settings

```
src/
├── lib/ai/provider.ts
└── app/api/ai/
    ├── chat/route.ts
    └── providers/route.ts
```

---

### Module 25: Branding Manager

- Setup Dashboard with multiple configuration tabs
- Branding: app name, tagline, logo upload, hero image, colors, company info
- Pricing: Stripe integration (manage products in Stripe Dashboard)
- Social: Twitter, LinkedIn, GitHub, website links
- Features: OAuth toggles, feature flags, AI settings, webhook configuration
- Dynamic branding components that reflect saved settings
- Configurable navigation items
- Announcement bar with admin controls
- Custom pages system

---

### Module 31: Onboarding Wizard

- 4-step guided onboarding for new administrators
- Onboarding state persistence in database
- Progress tracking and step completion

---

### Module 34: E2E Testing

- Playwright test framework
- 92 E2E tests across 7 test files
- Covers: public pages, auth, feedback, help widget, metrics, admin, API endpoints, responsive design
- Blog/Changelog CRUD, waitlist, email templates, PassivePost tests
- Auth setup for authenticated admin testing
- `data-testid` attributes on all interactive elements

```
tests/
├── auth.setup.ts
├── blog.spec.ts
├── e2e-full.spec.ts
├── waitlist.spec.ts
├── feedback.spec.ts
├── email-templates.spec.ts
└── passivepost.spec.ts
```

---

### Module 35: Blog/Changelog System

- Markdown-based blog content with live preview
- Public blog page (`/blog`) and individual posts (`/blog/[slug]`)
- Changelog page (`/changelog`)
- Admin CRUD interface for posts
- Draft/published status management

---

### Module 36: Email Template System

- Admin-editable email templates stored in database
- Template preview in admin interface
- Test email sending functionality
- Welcome, subscription confirmation, cancellation, and team invitation templates

---

### Module 37: Waitlist Mode

- Pre-launch email collection page
- Waitlist signup form component
- Admin waitlist management with CSV export
- Feature toggle to enable/disable waitlist mode

---

### Module 38: SSO/SAML Enterprise Auth

- Supabase SAML SSO provider management (full CRUD)
- Admin SSO dashboard at `/admin/sso`
- Domain-based SSO detection on login page
- Public endpoint for SSO domain checking
- `ssoEnabled` feature toggle

```
src/
├── lib/sso/provider.ts
├── app/admin/sso/page.tsx
└── app/api/
    ├── admin/sso/route.ts
    └── auth/sso/check/route.ts
```

---

### Module 39: Queue Infrastructure

- BullMQ job queue with Upstash Redis backend
- 10 job types: email, webhook-retry, report, metrics-report, metrics-alert, token-rotation, social-post, social-health-check, social-trend-monitor, social-engagement-pull
- Worker with 5 concurrency, 3 retry attempts
- Admin queue dashboard at `/admin/queue`
- Queue metrics: waiting, active, completed, failed, delayed, paused
- Retry and clear failed jobs from admin UI

```
src/
├── lib/queue/index.ts
├── lib/queue/types.ts
├── app/admin/queue/page.tsx
└── instrumentation.ts
```

---

### Module 40: Rate Limiting

- Sliding window rate limiting with Upstash Redis
- In-memory fallback when Redis is unavailable
- Configurable limits per endpoint

---

### Module 41: Admin Setup UX

- Split monolithic setup page into 11 focused sub-pages
- Shared state management hook
- React context provider for cross-page state sharing
- Layout with sidebar navigation
- Sub-pages: branding, compliance, content, features, integrations, passivepost, pages, pricing, security, social, support

```
src/
├── hooks/
│   ├── use-setup-settings.ts
│   └── use-setup-settings-context.tsx
└── app/admin/setup/
    ├── layout.tsx
    ├── branding/page.tsx
    ├── content/page.tsx
    ├── features/page.tsx
    ├── integrations/page.tsx
    ├── passivepost/page.tsx
    └── ...
```

---

### Module 42: Customer Service Tools

- Subscription status column in admin users table
- Enhanced user detail dialog with 3 tabs (Overview, Invoices, Notes)
- Stripe subscription and invoice data in user detail
- Direct link to Stripe Customer Portal per user
- Admin notes system for internal customer service tracking

**Database Tables:** `admin_notes`

---

### Module 43: Admin Documentation

- Comprehensive Admin Guide (24+ sections)
- Non-technical language for team members managing the platform

---

### Module 44: Metrics Dashboard

- 10 KPI cards: Total Users, New Users, Active Subscriptions, MRR, ARPU, LTV, Churn Rate, Conversion Rate, Feedback Count, Waitlist Count
- NPS Score card with color-coded Net Promoter Score
- User Growth and Revenue Growth line charts (Recharts)
- "Email Report" and "Check Alerts" action buttons
- Metrics aggregation API

---

### Module 45: NPS Score Tracking

- NPS rating (0-10) in feedback and help widget submissions
- NPS badge display in admin feedback list
- NPS aggregation into Net Promoter Score on metrics dashboard
- Color-coded NPS display (green/yellow/red)

---

### Module 46: Help Widget

- Floating chat button in bottom corner of site
- AI-powered responses using configured provider/model
- Configurable system prompt and fallback email
- NPS rating collection after AI responses
- Admin toggle to enable/disable
- Independent from feedback widget

---

### Module 47: In-App Notifications

- Bell icon in header with unread count badge
- Notification popover with type-specific icons
- Auto-polling for new notifications
- Mark all as read functionality
- Server-side notification creation utility

---

### Module 48: Audit Log Viewer

- Dedicated admin page at `/admin/audit-logs`
- Paginated table of audit log entries
- Filterable by action type and user

---

### Module 49: Legal & Compliance Pages

- 9 legal pages with dynamic variable replacement: Terms, Privacy, Cookie Policy, Acceptable Use, Accessibility, Data Handling, DMCA, AI Data Usage, Security Policy
- Cookie consent banner (configurable via admin)
- Compliance settings in Setup > Features

---

### Module 50: Metrics Alerts & Scheduled Reports

- Configurable alert thresholds for churn rate and user growth
- Email notifications when thresholds exceeded
- BullMQ job type for scheduled KPI summary emails
- Admin-triggered report sending
- Alert settings in Admin > Setup > Security

---

### Module 51: Database Backup Configuration

- Admin UI for backup notification preferences
- Configurable frequency and retention periods
- Managed by Supabase (configuration only)

---

### Module 52: API Token Rotation

- BullMQ job type for automated webhook secret rotation
- Configurable rotation interval
- Managed via Admin > Setup > Security

---

### Module 21: PassivePost Module

- Toggleable social media management extension
- Two tiers: Universal (basic) and Power (advanced)
- 10 platform support: Twitter/X, LinkedIn, Instagram, YouTube, Facebook, TikTok, Reddit, Pinterest, Snapchat, Discord
- AI-powered post generation with multimodal image support
- Post scheduling and management
- Social API health checker
- Social KPI cards on admin metrics dashboard
- Vercel Cron fallback for scheduled post delivery
- n8n workflow templates
- Playwright E2E tests
- Tier-based rate limiting with daily caps
- BullMQ retry logic for post delivery failures

> For complete PassivePost documentation, see `docs/passivepost/PRODUCT_GUIDE.md`.

---

### Module 53: Centralized API Keys & Integrations

- Admin setup page at `/admin/setup/integrations` for Tech Stack API keys
- Collapsible groups with status indicators (green/red/gray dots)
- Summary cards: "Total Keys" and "Required Keys"
- Required/Optional labels on each key
- Format validation on save
- Inline edit/reveal/delete with source badges (Dashboard vs Env Var)
- Social platform keys on PassivePost setup page (feature-gated)
- Keys stored in `config_secrets` database table, DB values take priority over env vars

---

### Module 54: PassivePost Extension

PassivePost is a SaaS product built on top of MuseKit using the database extension pattern. It demonstrates how to build a real product from the template without modifying core schema.

- Database extension pattern: core tables in `migrations/core/`, PassivePost-specific in `migrations/extensions/`
- Per-user Stripe tier resolution via subscription metadata
- OAuth flows for Facebook/LinkedIn/Twitter with PKCE
- Social dashboard with 17+ pages
- Brand preference system (tone, niche, location, audience, goals, frequency)
- AI post generation with 15 admin-editable niche-specific prompts
- Blog publishing to Medium, WordPress, Ghost, LinkedIn Articles, and Substack
- Content flywheel system: 38 features across 7 phases
- 4 bonus features: AI Hashtag Suggestions, Gig Lead Notifications, AI Voice Fine-Tuner, Lead CRM Mini
- 60+ API routes
- Client approval portal at `/approve/[token]`

**Database Extension Tables:** `brand_preferences`, `alert_logs`, extended `social_posts`

**Stripe Tier Mapping** (admin-configurable):

| Tier | Metadata Value | Posts/Day | AI Generations/Day |
|------|---------------|-----------|-------------------|
| Starter | `tier_1` | 5 | 3 |
| Basic | `tier_2` | 20 | 15 |
| Premium | `tier_3` | 100 | 50 |

Tier definitions are dynamic — admins can add, remove, or edit tiers and their limits from the dashboard.

> For complete PassivePost documentation, see `docs/passivepost/PRODUCT_GUIDE.md`.

---

### Module 55: Landing Page Components

- 16 reusable marketing components (all admin-toggleable)
- Components: hero, split-hero, gradient-text, animated-words, animated-counter, logo-marquee, testimonial-carousel, customer-stories, process-steps, founder-letter, comparison-bars, product-showcase, bottom-hero-cta, image-collage-section, image-text-section, announcement-bar

```
src/components/landing/
├── hero.tsx
├── split-hero.tsx
├── gradient-text.tsx
├── animated-words.tsx
├── animated-counter.tsx
├── logo-marquee.tsx
├── testimonial-carousel.tsx
├── customer-stories.tsx
├── process-steps.tsx
├── founder-letter.tsx
├── comparison-bars.tsx
├── product-showcase.tsx
├── bottom-hero-cta.tsx
├── image-collage-section.tsx
├── image-text-section.tsx
└── announcement-bar.tsx
```

---

### Module 56: 950-Scale Color Model

- CSS variables for primary color scale (50-950) in `src/app/globals.css`
- Standard formulas for cards, icons, avatars
- Automatic adaptation to any configured palette

---

### Module 57: Interactive State System

- `hover-elevate`, `active-elevate-2`, `toggle-elevate`/`toggle-elevated` CSS utilities
- Light and dark mode color formulas using primary palette

---

### Module 58: Header & Footer Styling

- `HeaderStyle` and `FooterStyle` interfaces in `src/types/settings.ts`
- Admin-configurable header: background color, text color, opacity, sticky, transparent, border toggle
- Admin-configurable footer: background color, text color, background image, layout mode

---

### Module 59: Section Ordering & Backgrounds

- `ContentSettings.sectionOrder` array for homepage section render order
- `ContentSettings.sectionColors` for per-section background colors
- Admin Content page with arrow buttons for reordering

---

### Module 60: Feature Sub-Page System

- Dynamic route at `/features/[slug]`
- `featureSubPages` array in content settings
- Each page has hero + alternating image/text blocks + closing CTA

---

## Affiliate System

The affiliate system adds 32 features across 4 sprints. All features are complete. See dedicated documentation:

- `docs/musekit/AFFILIATE.md` — Complete affiliate system guide
- `docs/musekit/AFFILIATE_ENHANCEMENTS.md` — Detailed specifications for all 32 features

---

## Clone & Customize Workflow

When creating a new product from this template:

### Step 1: Clone Repository
Use GitHub template or Vercel deploy button. Rename project to new product name.

### Step 2: Update Configuration
Edit `config/muse.config.json`: project name, tagline, company name, support email, feature flags.

### Step 3: Setup Supabase
Create new Supabase project, copy credentials, run database migrations, configure storage bucket.

### Step 4: Setup Stripe
Create Stripe products for plans, copy API keys, configure webhook endpoint.

### Step 5: Deploy to Vercel
Connect to Vercel, add environment variables, configure custom domain.

### Step 6: Bootstrap Admin
Sign up with admin email, run bootstrap admin endpoint.

For the complete step-by-step guide, see `docs/musekit/MUSE_CHECKLIST.md`.

---

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server only)
- `STRIPE_SECRET_KEY` — Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `RESEND_API_KEY` — Resend API key
- `RESEND_FROM_EMAIL` — Verified sender email

### Optional
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — Plausible analytics domain
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry DSN
- `SENTRY_ORG` — Sentry organization slug
- `SENTRY_PROJECT` — Sentry project slug
- `XAI_API_KEY` — xAI/Grok API key
- `OPENAI_API_KEY` — OpenAI API key
- `ANTHROPIC_API_KEY` — Anthropic API key
- `UPSTASH_REDIS_REST_URL` — Upstash Redis URL (queue + rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis auth token
- `NEXT_PUBLIC_APP_URL` — Application URL
- `SESSION_SECRET` — Session secret
- `MUSE_DEBUG_MODE` — Set to `true` for PassivePost beta debug mode

---

## Future Considerations

- Clone template for first production product (ExtrusionCalculator.com)
- Add RLS policies for organization_members table in Supabase
- Real platform API integration for newer social platforms (YouTube, Facebook, TikTok, Reddit, Pinterest, Snapchat, Discord)
- Approval queue UI for AI-generated posts
- Dynamic tiers for PassivePost (admin-created unlimited custom tiers)
- Continue minimizing hardcoded variables
- Add features based on user feedback
