# MuseKit — Setup Guide

This guide walks you through creating a new SaaS from the MuseKit template.

---

## Table of Contents

1. [Quick Start (Clone Existing)](#quick-start-clone-existing-template)
2. [From Scratch Setup](#from-scratch-setup)
3. [Environment Variables](#environment-variables)
4. [Project Structure](#project-structure)
5. [Database Tables](#database-tables)
6. [PassivePost Extension Tables](#passivepost-extension-tables)
7. [Supabase Configuration](#supabase-configuration)
8. [Stripe Configuration](#stripe-configuration)
9. [Key Commands](#key-commands)

---

## Quick Start (Clone Existing Template)

If you're cloning the completed template:

### 1. Clone Repository
```bash
git clone <your-musekit-repo-url> my-new-saas
cd my-new-saas

npm install
```

### 2. Create Environment File
```bash
cp .env.template .env.local

# Edit with your values
nano .env.local
```

### 3. Set Up Supabase
- Create a new Supabase project at [supabase.com](https://supabase.com)
- Run the core SQL migrations from `migrations/core/` in order (001 through 016) in the Supabase SQL Editor
- If using PassivePost, also run extension migrations from `migrations/extensions/`
- Copy your Supabase credentials to `.env.local`

### 4. Set Up Stripe
- Create products and prices in your Stripe Dashboard
- Copy API keys to `.env.local`
- Set up the webhook endpoint (see [Stripe Configuration](#stripe-configuration))
- If using PassivePost, add tier metadata to products

### 5. Deploy to Vercel
```bash
# Push to your GitHub
git remote set-url origin https://github.com/YOUR_USERNAME/my-new-saas.git
git push -u origin main

# Import to Vercel from GitHub
# Add environment variables in Vercel dashboard
```

---

## From Scratch Setup

If creating a fresh Next.js project:

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest my-saas --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd my-saas
```

### Step 2: Initialize Git and Push to GitHub

```bash
git init
git add .
git commit -m "Initial Next.js setup"
git remote add origin https://github.com/YOUR_USERNAME/my-saas.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Click **"Deploy"**

### Step 4: Install shadcn/ui

```bash
npx shadcn@latest init

npx shadcn@latest add button card input label toast avatar badge dialog dropdown-menu separator tabs switch select textarea scroll-area form alert
```

### Step 5: Install Dependencies

```bash
# Core
npm install @supabase/supabase-js @supabase/ssr next-themes @tanstack/react-query zod stripe resend

# Form handling
npm install react-hook-form @hookform/resolvers

# Icons
npm install lucide-react

# Development
npm install -D @types/node
```

---

## Environment Variables

Create `.env.local` with these values:

```bash
# ===================
# SUPABASE (Required)
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ===================
# STRIPE (Required)
# ===================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# ===================
# EMAIL (Required - Resend)
# ===================
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ===================
# AI (Optional - xAI is the default provider)
# ===================
XAI_API_KEY=xai-...
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# ===================
# QUEUE & RATE LIMITING (Optional - Upstash Redis)
# ===================
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# ===================
# MONITORING (Optional)
# ===================
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

NEXT_PUBLIC_SENTRY_DSN=https://...@o123.ingest.sentry.io/456
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=sntrys_...

# ===================
# APP
# ===================
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
SESSION_SECRET=your-session-secret
```

### Required vs. Optional Services

| Service | Required? | Purpose |
|---------|-----------|---------|
| Supabase | Yes | Database, authentication, storage |
| Stripe | Yes | Subscription billing, checkout |
| Resend | Yes | Transactional email |
| xAI / OpenAI / Anthropic | No | AI features (chat, content generation) |
| Upstash Redis | No | Background jobs, rate limiting |
| Sentry | No | Error tracking |
| Plausible | No | Web analytics |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                         # Auth pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── update-password/page.tsx
│   ├── (dashboard)/                    # User dashboard pages
│   │   ├── billing/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── security/page.tsx
│   │   └── support/page.tsx
│   ├── (marketing)/                    # Public marketing pages
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── docs/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── features/page.tsx
│   │   ├── features/[slug]/page.tsx    # Feature sub-pages
│   │   ├── pricing/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── cookie-policy/page.tsx
│   │   ├── acceptable-use/page.tsx
│   │   ├── accessibility/page.tsx
│   │   ├── data-handling/page.tsx
│   │   ├── dmca/page.tsx
│   │   ├── ai-data-usage/page.tsx
│   │   ├── security-policy/page.tsx
│   │   └── p/[slug]/page.tsx          # Custom pages
│   ├── admin/                          # Admin dashboard
│   │   ├── page.tsx                    # Admin home
│   │   ├── analytics/page.tsx
│   │   ├── audit-logs/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── email-templates/page.tsx
│   │   ├── feedback/page.tsx
│   │   ├── metrics/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── queue/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── sso/page.tsx
│   │   ├── team/page.tsx
│   │   ├── users/page.tsx
│   │   ├── waitlist/page.tsx
│   │   └── setup/                      # Setup sub-pages
│   │       ├── branding/page.tsx
│   │       ├── compliance/page.tsx
│   │       ├── content/page.tsx
│   │       ├── features/page.tsx
│   │       ├── integrations/page.tsx
│   │       ├── pages/page.tsx
│   │       ├── pricing/page.tsx
│   │       ├── security/page.tsx
│   │       ├── social/page.tsx
│   │       ├── support/page.tsx
│   │       ├── affiliate/page.tsx
│   │       ├── discount-codes/page.tsx
│   │       ├── funnel/page.tsx
│   │       ├── palette/page.tsx
│   │       ├── passivepost/page.tsx
│   │       ├── products/page.tsx
│   │       ├── testimonials/page.tsx
│   │       └── watermark/page.tsx
│   ├── affiliate/                      # Affiliate portal
│   │   ├── join/page.tsx
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── set-password/page.tsx
│   │   └── test-links/page.tsx
│   ├── dashboard/social/              # PassivePost dashboard (product-specific)
│   │   ├── overview/page.tsx
│   │   ├── posts/page.tsx
│   │   ├── queue/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── engagement/page.tsx
│   │   ├── leads/page.tsx
│   │   ├── brand/page.tsx
│   │   ├── intelligence/page.tsx
│   │   ├── automation/page.tsx
│   │   ├── collaboration/page.tsx
│   │   ├── distribution/page.tsx
│   │   ├── revenue/page.tsx
│   │   ├── retention/page.tsx
│   │   ├── affiliate/page.tsx
│   │   ├── blog/
│   │   ├── settings/page.tsx
│   │   └── onboarding/page.tsx
│   ├── api/                            # API routes
│   │   ├── admin/                      # Admin API endpoints
│   │   ├── affiliate/                  # Affiliate API (100+ endpoints)
│   │   ├── ai/                         # AI chat and provider config
│   │   ├── social/                     # PassivePost API (50+ endpoints)
│   │   ├── stripe/                     # Checkout, portal, webhook
│   │   ├── cron/                       # Scheduled tasks
│   │   ├── email/                      # Email sending
│   │   ├── support/                    # Support chat
│   │   ├── tickets/                    # Ticket management
│   │   ├── user/                       # User profile and settings
│   │   └── ...                         # Other API routes
│   ├── blog/                           # Public blog pages
│   ├── changelog/                      # Public changelog
│   ├── checkout/                       # Checkout flow
│   ├── partner/                        # Co-branded affiliate pages
│   ├── testimonials/                   # Public testimonials
│   ├── auth/callback/route.ts          # OAuth callback
│   ├── monitoring/route.ts             # Sentry tunnel
│   ├── globals.css                     # Global styles + color system
│   └── layout.tsx                      # Root layout
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── landing/                        # 17 reusable marketing components
│   ├── layout/                         # Header, footer
│   ├── admin/                          # Admin components
│   ├── affiliate/                      # Affiliate portal components
│   ├── social/                         # PassivePost components
│   ├── auth/                           # Auth components (UserNav)
│   ├── branding/                       # Dynamic branding
│   ├── subscription/                   # Upgrade banners
│   └── analytics/                      # Plausible analytics
├── lib/
│   ├── supabase/                       # Database client (client, server, admin)
│   ├── stripe/                         # Payment integration
│   ├── products/                       # Product registry (multi-product tier resolution)
│   ├── email/                          # Email service (Resend)
│   ├── ai/                             # AI provider abstraction
│   ├── affiliate/                      # Affiliate program logic
│   ├── queue/                          # BullMQ job queue
│   ├── webhooks/                       # Webhook dispatcher (HMAC, retry)
│   ├── sso/                            # SSO/SAML provider
│   ├── rate-limit/                     # Upstash Redis rate limiting
│   ├── redis/                          # Redis utilities
│   ├── config/                         # Centralized API key management
│   ├── settings/                       # Settings utilities
│   ├── validation/                     # Zod schemas
│   ├── logging/                        # Structured logging
│   ├── social/                         # PassivePost business logic (product-specific)
│   └── admin-notes/                    # Admin notes system
├── hooks/                              # React hooks
├── types/
│   └── settings.ts                     # Core settings interfaces
├── instrumentation-client.ts           # Sentry client
└── instrumentation.ts                  # Sentry server + queue worker

migrations/
├── core/                               # Core MuseKit tables (16 migration files)
│   ├── 001_social_tables.sql
│   ├── 002_product_registry.sql
│   ├── 003_testimonials.sql
│   ├── ...
│   └── 016_session_e_tables.sql
└── extensions/                         # Product-specific tables (7 migration files)
    ├── 001_passivepost_tables.sql
    ├── ...
    └── 007_affiliate_profiles_and_codes.sql

tests/                                  # Playwright E2E tests
docs/
├── musekit/                            # MuseKit documentation
└── passivepost/                        # PassivePost documentation
```

---

## Database Tables

Run the core migration files from `migrations/core/` in order (001 through 016) in your Supabase SQL Editor. The key tables created include:

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` with full name, avatar, and Stripe customer IDs |
| `user_roles` | Maps users to roles (admin, member) per app |
| `organization_settings` | JSON settings blob for app configuration |
| `audit_logs` | Tracks admin actions for compliance |
| `organizations` | Team/organization records |
| `organization_members` | Maps users to organizations with roles (owner, manager, member, viewer) |
| `invitations` | Email invitations with tokens and expiry |
| `admin_notes` | Internal notes on users (visible only to admins) |
| `social_accounts` | Social platform connections |
| `social_posts` | Social media posts |
| `muse_products` | Product registry for multi-product support |
| `muse_product_subscriptions` | Per-product subscription tracking |
| `testimonials` | Customer testimonials |
| `tickets` | Support tickets |
| `activities` | CRM activity log |
| `campaigns` | Marketing campaigns |
| `contracts` | Agreements and contracts |
| `user_profiles` | Extended user profile data |

All tables have **Row Level Security (RLS)** enabled. Access to organization tables is controlled server-side via the Supabase admin client (service role) in API routes.

### Important RLS Note

The RLS policies for organization tables use `FOR ALL USING (true)` which is permissive. Access is controlled server-side by using the Supabase admin client (service role) in API routes, not by RLS. This means:
- Client-side queries to these tables may fail or return empty results
- All team operations go through server API endpoints that use the admin client
- For stricter RLS, add policies that check `auth.uid()` membership in `organization_members`

---

## PassivePost Extension Tables

If you're using the PassivePost extension, run the migration files from `migrations/extensions/` **after** the core tables. These tables are specific to PassivePost and would NOT exist in other MuseKit clones.

Key extension tables include:
- **`brand_preferences`** — User brand voice and content preferences
- **`alert_logs`** — Trend alert history
- **Blog publishing tables** — Blog connections and cross-linking
- **Audit and email extensions** — Additional tracking columns

---

## Supabase Configuration

### Authentication Settings
1. Go to **Authentication > URL Configuration**
2. Set Site URL to your Vercel URL
3. Add Redirect URLs:
   - `https://your-app.vercel.app/*`
   - `http://localhost:3000/*`

### Storage Buckets
1. Create bucket named `avatars` (public)
2. Create bucket named `branding` (public)
3. Add policies for authenticated upload/update and public read

### OAuth Providers (Optional)

The template supports 5 OAuth providers, all configurable via Admin Dashboard:

| Provider | Default | Configuration |
|----------|---------|---------------|
| Google | Enabled | Google Cloud Console > OAuth Credentials |
| GitHub | Disabled | GitHub Developer Settings > OAuth Apps |
| Apple | Disabled | Apple Developer Portal > Sign in with Apple |
| X (Twitter) | Disabled | Twitter Developer Portal > OAuth 2.0 |
| Magic Link | Enabled | Uses Supabase email (no extra config) |

**To configure a provider:**
1. Get credentials from the provider's developer console
2. Enable in Supabase **Authentication > Providers > [Provider]**
3. Paste Client ID and Secret
4. Enable the provider toggle in Admin Dashboard > Setup > Features

**Admin control:**
- Toggle providers on/off without code changes
- Changes take effect immediately

---

## Stripe Configuration

### Products & Prices
Create products and prices in your Stripe Dashboard. They will automatically appear on your `/pricing` page.

### PassivePost Tiers (Optional)

If using PassivePost, create additional products with these metadata values:

| Product | Metadata Key | Metadata Value | Description |
|---------|-------------|----------------|-------------|
| Passive Starter | `muse_tier` | `tier_1` | 5 posts/day, 3 AI gen/day |
| Passive Basic | `muse_tier` | `tier_2` | 20 posts/day, 15 AI gen/day |
| Passive Premium | `muse_tier` | `tier_3` | 100 posts/day, 50 AI gen/day |

Tier definitions (display names, metadata values, and rate limits) are admin-configurable from the PassivePost setup page (`/admin/setup/passivepost`).

### Webhook Endpoint
- URL: `https://your-app.vercel.app/api/stripe/webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

---

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npx playwright test` | Run E2E tests |
| `git push` | Deploy to Vercel (auto-deploy) |

---

## Important URLs

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Resend Dashboard](https://resend.com)
- [Google Cloud Console](https://console.cloud.google.com) (for Google OAuth)
- [Plausible Dashboard](https://plausible.io) (if using analytics)
- [Upstash Console](https://console.upstash.com) (if using Redis)

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| `docs/musekit/SETUP_GUIDE.md` | This file — setup and configuration |
| `docs/musekit/PROJECT_OVERVIEW.md` | High-level project overview |
| `docs/musekit/ADMIN_GUIDE.md` | Admin dashboard usage guide |
| `docs/musekit/ARCHITECTURE.md` | System architecture and merge rules |
| `docs/musekit/ADDING_A_PRODUCT.md` | How to add new products |
| `docs/musekit/MUSE_CHECKLIST.md` | Launch readiness checklist |
| `docs/musekit/MASTER_PLAN.md` | Technical specifications |
| `docs/musekit/AFFILIATE.md` | Affiliate system guide |
| `docs/passivepost/PRODUCT_GUIDE.md` | PassivePost extension guide |
