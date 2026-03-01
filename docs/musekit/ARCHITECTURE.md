# MuseKit Architecture

## What is MuseKit?

MuseKit is a production-ready SaaS template built with Next.js 16+, React 18, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Stripe, Vercel, Resend, and xAI/Grok. It provides all the common infrastructure every SaaS product needs (auth, billing, admin dashboard, affiliate program, email, CRM, etc.) so you can focus on building your unique product features.

This document describes how MuseKit is structured, how products are built on top of it, and the rules for keeping the codebase clean and maintainable.

---

## Deployment Model

Each SaaS product built on MuseKit gets its own **independent deployment**:

| Component | Per-Product Instance |
|-----------|---------------------|
| Repository | Own repo (forked from MuseKit) |
| Database | Own Supabase project |
| Payments | Own Stripe account |
| Hosting | Own Vercel deployment |
| Domain | Own custom domain |
| Metrics | Own P&L, own analytics |

### Why Separate Deployments?

- **Clean P&L**: Each product's revenue and costs are naturally separated
- **Independent scaling**: One product's traffic spike doesn't affect another
- **Zero cross-pollination**: No risk of data or subscription leakage between products
- **Sellable**: Any product can be sold or shut down independently
- **Simple metrics**: Each deployment's Stripe dashboard IS that product's revenue report

### Cost Per SaaS

Starting: **$0-1/mo** on free tiers (Supabase Free, Vercel Hobby, Stripe pay-per-transaction).

At scale: **~$50-75/mo** (Supabase Pro $25, Vercel Pro $20, Resend $20, Upstash ~$10).

---

## MuseKit as a Shared Template

MuseKit is the **reusable template**, not a deployed product itself.

### Workflow

1. **MuseKit repo** contains the clean, product-agnostic SaaS template
2. To build a new SaaS, **fork/clone MuseKit** into a new repo
3. Build product-specific features on top (like PassivePost)
4. Deploy independently with its own Supabase, Stripe, domain
5. When MuseKit core gets improvements, **pull updates via git merge**

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16+ (App Router), React 18, TypeScript | Server-rendered React framework |
| Styling | Tailwind CSS + shadcn/ui + next-themes | Utility-first CSS with component library |
| Database | Supabase (PostgreSQL + Auth + RLS + Storage) | Managed database with built-in auth |
| Hosting | Vercel | Production deployment with CDN |
| Payments | Stripe | Subscription billing and checkout |
| Email | Resend | Transactional and marketing emails |
| AI | xAI (Grok), OpenAI, Anthropic | Pluggable AI provider system |
| Queue | BullMQ + Upstash Redis | Background job processing |
| Rate Limiting | Upstash Redis | Sliding window rate limiter |
| Monitoring | Sentry | Error tracking (server + browser) |
| Analytics | Plausible | Privacy-friendly web analytics |
| State | TanStack Query | Server state management |
| Validation | Zod | Schema validation |

---

## Directory Structure

```
src/
├── app/
│   ├── (auth)/                    # Login, signup, password reset
│   ├── (dashboard)/               # User-facing pages (profile, billing, security, support)
│   ├── (marketing)/               # Public pages (about, pricing, features, legal pages, etc.)
│   ├── admin/                     # Admin dashboard and setup pages
│   │   └── setup/                 # 15+ setup sub-pages (branding, content, pricing, etc.)
│   ├── affiliate/                 # Affiliate portal (join, login, dashboard)
│   ├── api/                       # All API routes
│   │   ├── admin/                 # Admin API endpoints
│   │   ├── affiliate/             # Affiliate API (100+ endpoints)
│   │   ├── ai/                    # AI chat and provider config
│   │   ├── social/                # PassivePost API (50+ endpoints)
│   │   ├── stripe/                # Checkout, portal, webhook
│   │   ├── cron/                  # Scheduled tasks
│   │   └── ...                    # Other API routes
│   ├── blog/                      # Public blog
│   ├── changelog/                 # Public changelog
│   ├── checkout/                  # Checkout flow
│   ├── dashboard/social/          # PassivePost dashboard (15+ pages)
│   ├── partner/                   # Co-branded affiliate landing pages
│   └── testimonials/              # Public testimonials
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── landing/                   # 17 reusable marketing components
│   ├── layout/                    # Header, footer
│   ├── admin/                     # Admin-specific components
│   ├── affiliate/                 # Affiliate portal components
│   ├── social/                    # PassivePost components
│   ├── auth/                      # Auth components
│   ├── branding/                  # Dynamic branding
│   ├── subscription/              # Upgrade banners
│   └── analytics/                 # Analytics components
├── lib/
│   ├── supabase/                  # Database client (client, server, admin)
│   ├── stripe/                    # Payment integration
│   ├── products/                  # Product registry (generic, multi-product)
│   ├── email/                     # Email service (Resend)
│   ├── ai/                        # AI provider abstraction
│   ├── affiliate/                 # Affiliate program system
│   ├── queue/                     # BullMQ job queue
│   ├── webhooks/                  # Webhook dispatcher (HMAC, retry)
│   ├── sso/                       # SSO/SAML provider
│   ├── rate-limit/                # Upstash Redis rate limiting
│   ├── redis/                     # Redis utilities
│   ├── config/                    # Centralized API key management
│   ├── settings/                  # Settings utilities
│   ├── validation/                # Zod schemas
│   ├── logging/                   # Structured logging
│   ├── social/                    # PassivePost business logic (product-specific)
│   └── admin-notes/               # Admin notes system
├── hooks/                         # React hooks
└── types/                         # TypeScript type definitions

migrations/
├── core/                          # Core MuseKit database tables (16 files)
└── extensions/                    # Product-specific tables (7 files)
```

---

## Merge-Friendly Architecture Rules

These rules minimize git merge conflicts when pulling MuseKit core updates into product repos.

### Rule 1: Add, Don't Modify Core Files

When building product features, create new files instead of editing existing core files.

```
GOOD: Create src/lib/social/types.ts for social types
BAD:  Add social types to src/types/settings.ts
```

### Rule 2: Product Database Tables in `migrations/extensions/`

Core MuseKit schema lives in `migrations/core/`. Product-specific tables go in `migrations/extensions/`.

```
GOOD: migrations/extensions/001_myproduct_tables.sql
BAD:  migrations/core/020_myproduct_tables.sql
```

### Rule 3: Product Pages in Scoped Directories

Product-specific pages and API routes go in clearly named directories.

```
GOOD: src/app/dashboard/social/overview/page.tsx
GOOD: src/app/api/social/connect/route.ts
BAD:  src/app/dashboard/page.tsx (modifying core dashboard)
```

### Rule 4: Product Types in `src/lib/<product>/`

Product-specific TypeScript types, interfaces, and constants go in the product's own lib directory.

```
GOOD: src/lib/social/types.ts
BAD:  Adding social interfaces to src/types/settings.ts
```

### Rule 5: Product Queue Jobs via Plugin Pattern

Product-specific BullMQ job types should be defined in `src/lib/<product>/` and registered dynamically, not hardcoded into core queue files.

```
GOOD: src/lib/social/queue-jobs.ts (defines social job types and processors)
BAD:  Adding social job types directly to src/lib/queue/types.ts
```

### Rule 6: When You Must Touch a Core File

Sometimes you genuinely need to modify a core file (e.g., adding a nav item). In that case:
- Keep changes **minimal and isolated**
- Add a comment: `// PRODUCT: MyProduct`
- Document the change

---

## Boundary Rules

### One-Way Dependency

```
Product code → imports from → MuseKit core
MuseKit core → NEVER imports from → Product code
```

This means:
- `src/lib/social/user-tier.ts` CAN import from `@/lib/products/tier-resolver.ts`
- `src/lib/queue/index.ts` should NOT import from `@/lib/social/client.ts`

### What is "Core"?

Core MuseKit files are everything that is NOT product-specific:

- `src/lib/supabase/` — Database client
- `src/lib/stripe/` — Payment integration
- `src/lib/products/` — Product registry (generic, not product-specific)
- `src/lib/queue/` — Queue infrastructure (generic job types only)
- `src/lib/affiliate/` — Affiliate program system
- `src/lib/ai/` — AI provider abstraction
- `src/lib/email/` — Email service
- `src/lib/webhooks/` — Webhook dispatcher
- `src/lib/sso/` — SSO/SAML provider
- `src/lib/rate-limit/` — Rate limiting
- `src/lib/redis/` — Redis utilities
- `src/lib/config/` — API key management
- `src/types/settings.ts` — Core SaaS settings
- `src/app/admin/` — Admin dashboard (generic)
- `src/app/affiliate/` — Affiliate portal
- `src/app/api/stripe/` — Stripe endpoints
- `src/app/api/admin/` — Admin API
- `src/app/api/affiliate/` — Affiliate API
- `migrations/core/` — Core database schema

### What is "Product"?

Product-specific files live in isolated directories. Using PassivePost as an example:

- `src/lib/social/` — PassivePost business logic
- `src/app/dashboard/social/` — PassivePost UI pages
- `src/app/api/social/` — PassivePost API routes
- `src/app/admin/setup/passivepost/` — PassivePost admin config
- `src/components/social/` — PassivePost UI components
- `migrations/extensions/` — PassivePost database tables
- `docs/passivepost/` — PassivePost documentation

---

## Core Database Schema

MuseKit core includes these migration files in `migrations/core/`:

| Migration | Purpose |
|-----------|---------|
| `001_social_tables.sql` | Social platform account connections |
| `002_product_registry.sql` | Multi-product support tables |
| `003_testimonials.sql` | Testimonial management |
| `004_launch_kit.sql` | Drip campaigns, referral tracking, onboarding funnel |
| `005_affiliate_system.sql` | Core affiliate program tables |
| `006_affiliate_applications.sql` | Affiliate application workflow |
| `007_affiliate_enhancements_p1.sql` | Milestones, discount codes, broadcasts |
| `008_affiliate_enhancements_p2.sql` | Tiers, payouts, contests, source tags |
| `009_affiliate_enhancements_p3.sql` | Co-branded pages, tax info, fraud scoring, API keys, webhooks, messaging |
| `010_affiliate_sprint4.sql` | Additional affiliate features |
| `011_crm_foundation.sql` | CRM tables (tickets, activities, campaigns, contracts) |
| `012_commission_renewals.sql` | Recurring commission tracking |
| `013_delight_features.sql` | Additional engagement features |
| `014_analytics_columns.sql` | Analytics tracking columns |
| `015_session_d_tables.sql` | Extended session tables |
| `016_session_e_tables.sql` | Further session extensions |

Plus core tables for: `profiles`, `user_roles`, `organization_settings`, `audit_logs`, `organizations`, `organization_members`, `invitations`, `admin_notes`, `tickets`, `activities`, `campaigns`, `contracts`, `user_profiles`, and more.

---

## Landing Page Component Architecture

MuseKit includes 17 reusable landing page components in `src/components/landing/`. These are core MuseKit components, not product-specific.

### Components

| Component | File |
|-----------|------|
| Hero | `hero.tsx` |
| Split Hero | `split-hero.tsx` |
| Gradient Text | `gradient-text.tsx` |
| Animated Words | `animated-words.tsx` |
| Animated Counter | `animated-counter.tsx` |
| Logo Marquee | `logo-marquee.tsx` |
| Testimonial Carousel | `testimonial-carousel.tsx` |
| Customer Stories | `customer-stories.tsx` |
| Process Steps | `process-steps.tsx` |
| Founder Letter | `founder-letter.tsx` |
| Comparison Bars | `comparison-bars.tsx` |
| Product Showcase | `product-showcase.tsx` |
| Bottom Hero CTA | `bottom-hero-cta.tsx` |
| Image Collage Section | `image-collage-section.tsx` |
| Image Text Section | `image-text-section.tsx` |
| Announcement Bar | `announcement-bar.tsx` |
| Social Proof Popup | `social-proof-popup.tsx` |

### Configuration

All landing page sections are toggleable via the `ContentSettings` interface in `src/types/settings.ts`.

- **Section Ordering**: `ContentSettings.sectionOrder` array controls the display order of sections on the landing page.
- **Per-Section Background Colors**: `ContentSettings.sectionColors` allows each section to have a custom background color.
- **Feature Sub-Page System**: Feature sub-pages are served at `/features/[slug]` and configured via the `featureSubPages` array in content settings.

---

## 950-Scale Color Model

The primary color palette is a core MuseKit concern, defined as CSS custom properties in `src/app/globals.css`.

### Primary Palette

CSS variables `--primary-*` are defined at 11 scale stops: **50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950**. These provide a full spectrum from lightest tint to deepest shade for the brand's primary color.

### Standard Card Formulas

- Background: `bg-white/10` in both light and dark modes
- Border: `border-gray-500/50` in both light and dark modes

### Card Text Colors

- Headings (H1): `text-black dark:text-white`
- Body text: `opacity-70`

### Icon Colors

- Icon foreground: `text-primary-800 dark:text-primary-200`
- Icon backgrounds (light mode): randomized from primary scale shades `100`, `200`, `300`
- Icon backgrounds (dark mode): randomized from primary scale shades `700`, `800`, `900`

---

## Interactive State System

CSS utility classes are defined in `src/app/globals.css` to provide consistent interactive states across the application.

### Utility Classes

| Class | Behavior |
|-------|----------|
| `hover-elevate` | Subtle background elevation on hover using the primary palette |
| `active-elevate-2` | More dramatic elevation on click/press |
| `toggle-elevate` | Prepares an element for toggle state management |
| `toggle-elevated` | Applied alongside `toggle-elevate` to indicate the "on" state |

### Usage Notes

- **Buttons and Badges** handle their own hover/active states internally. Do not apply `hover-elevate` or `active-elevate-2` to these components.
- These utilities compose with any background color and respect the current dark/light theme.

---

## Header & Footer Customization

Header and footer styling is configurable through the admin UI and stored in settings.

### Interfaces

- `HeaderStyle` interface in `src/types/settings.ts` defines header appearance options (background color, text color, border, transparency).
- `FooterStyle` interface in `src/types/settings.ts` defines footer appearance options (background color, text color, layout).

### Configuration

- Header style is set via `NavigationSettings.headerStyle`
- Footer style is set via `NavigationSettings.footerStyle`
- Both are configurable through the admin UI at `/admin/setup/branding`
- Defaults to the branding primary color with auto-computed contrast text color

---

## Known Separation Issues

These work fine in the current combined repo but should be cleaned up before creating a truly clean MuseKit template for distribution.

### 1. Queue Types (src/lib/queue/types.ts)

**Issue**: Social job types (`social-post`, `social-health-check`, `social-trend-monitor`, `social-engagement-pull`) are defined directly in the core queue types file.

**Fix**: Move social job type definitions to `src/lib/social/queue-jobs.ts`. Refactor `src/lib/queue/types.ts` to use a plugin/registry pattern.

### 2. Queue Processors (src/lib/queue/index.ts)

**Issue**: Core queue processor imports from `@/lib/social/client` and `@/lib/social/types`. This violates the one-way dependency rule.

**Fix**: Implement a job processor registry where products register their own processors.

---

## Git Merge Strategy

When pulling MuseKit core updates into a product repo:

1. `git remote add musekit <musekit-repo-url>` (one-time setup)
2. `git fetch musekit main`
3. `git merge musekit/main` (or create a branch first for review)
4. Resolve any conflicts (should be minimal if rules are followed)

### Pre-Fork Checklist

Before creating the clean MuseKit template:
- [ ] Refactor queue types to plugin pattern
- [ ] Remove social imports from core queue processor
- [ ] Verify no other core files import from product directories
- [ ] Remove PassivePost-specific pages/routes
- [ ] Remove `migrations/extensions/` social tables
- [ ] Remove `src/lib/social/` directory
- [ ] Test that MuseKit runs clean without any product code
