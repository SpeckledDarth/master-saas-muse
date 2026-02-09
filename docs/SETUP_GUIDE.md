# Master SaaS Muse Template - Setup Guide

This guide walks you through creating a new SaaS from the Master SaaS Muse Template.

**Template Status: MVP COMPLETE + Full Feature Set + SocioScheduler Module + SocioScheduler Extension (February 2026)**

---

## Table of Contents

1. [Quick Start (Clone Existing)](#quick-start-clone-existing-template)
2. [From Scratch Setup](#from-scratch-setup)
3. [Environment Variables](#environment-variables)
4. [Project Structure](#project-structure)
5. [Database Tables](#database-tables)
6. [SocioScheduler Extension Tables](#socioschedule-extension-tables)
7. [Supabase Configuration](#supabase-configuration)
8. [Stripe Configuration](#stripe-configuration)
9. [Key Commands](#key-commands)

---

## Quick Start (Clone Existing Template)

If you're cloning the completed template:

### 1. Clone Repository
```bash
# Clone from GitHub
git clone https://github.com/SpeckledDarth/master-saas-muse.git my-new-saas
cd my-new-saas

# Install dependencies
npm install
```

### 2. Create Environment File
```bash
# Copy template
cp .env.template .env.local

# Edit with your values
nano .env.local
```

### 3. Set Up Supabase
- Create new Supabase project
- Run SQL from [Database Tables](#database-tables) section
- If using SocioScheduler, also run [SocioScheduler Extension Tables](#socioschedule-extension-tables)
- Copy credentials to `.env.local`

### 4. Set Up Stripe
- Create products in Stripe Dashboard
- Copy API keys to `.env.local`
- Set up webhook endpoint
- If using SocioScheduler, add tier metadata to products (see [Stripe Configuration](#stripe-configuration))

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
npx create-next-app@latest master-saas-muse --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd master-saas-muse
```

### Step 2: Initialize Git and Push to GitHub

```bash
git init
git add .
git commit -m "Initial Next.js 16 setup"
git remote add origin https://github.com/YOUR_USERNAME/master-saas-muse.git
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

# Install components
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
# SUPABASE
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ===================
# STRIPE
# ===================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# ===================
# EMAIL (Resend)
# ===================
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ===================
# ANALYTICS (Optional)
# ===================
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://...@o123.ingest.sentry.io/456
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=sntrys_...

# ===================
# AI (Optional - set one based on chosen provider)
# ===================
XAI_API_KEY=xai-...
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# ===================
# QUEUE & RATE LIMITING (Optional)
# ===================
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# ===================
# APP
# ===================
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
SESSION_SECRET=your-session-secret

# ===================
# SOCIOSCHEDULE (Optional)
# ===================
# MUSE_DEBUG_MODE=true  # Enable beta debug mode with mock data
```

---

## Project Structure

```
master-saas-muse/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── update-password/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── profile/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   └── social/page.tsx
│   │   ├── (marketing)/
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── docs/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── features/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   ├── cookie-policy/page.tsx
│   │   │   ├── acceptable-use/page.tsx
│   │   │   ├── accessibility/page.tsx
│   │   │   ├── data-handling/page.tsx
│   │   │   ├── dmca/page.tsx
│   │   │   ├── ai-data-usage/page.tsx
│   │   │   ├── security-policy/page.tsx
│   │   │   └── p/[slug]/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── analytics/page.tsx
│   │   │   ├── audit-logs/page.tsx
│   │   │   ├── blog/page.tsx
│   │   │   ├── email-templates/page.tsx
│   │   │   ├── feedback/page.tsx
│   │   │   ├── metrics/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── queue/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── sso/page.tsx
│   │   │   ├── setup/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── branding/page.tsx
│   │   │   │   ├── compliance/page.tsx
│   │   │   │   ├── content/page.tsx
│   │   │   │   ├── features/page.tsx
│   │   │   │   ├── integrations/page.tsx
│   │   │   │   ├── socioscheduler/page.tsx
│   │   │   │   ├── pages/page.tsx
│   │   │   │   ├── pricing/page.tsx
│   │   │   │   ├── security/page.tsx
│   │   │   │   ├── social/page.tsx
│   │   │   │   └── support/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── waitlist/page.tsx
│   │   ├── dashboard/
│   │   │   └── social/
│   │   │       ├── overview/page.tsx
│   │   │       ├── calendar/page.tsx
│   │   │       ├── engagement/page.tsx
│   │   │       ├── queue/page.tsx
│   │   │       ├── posts/page.tsx
│   │   │       ├── brand/page.tsx
│   │   │       └── onboarding/page.tsx
│   │   ├── api/
│   │   │   ├── admin/ (setup, stats, metrics, posts, users, users/[userId], notes, team, invitations, email-templates, webhooks, sso, notifications, queue, integrations)
│   │   │   ├── ai/ (chat, providers)
│   │   │   ├── social/ (accounts, posts, generate-post, health, connect, callback/[platform], tier, brand-preferences, debug)
│   │   │   ├── auth/sso/check/
│   │   │   ├── stripe/ (checkout, portal, products, subscription, webhook)
│   │   │   ├── email/send/
│   │   │   ├── feedback/
│   │   │   ├── invite/[token]/ (validate, accept)
│   │   │   ├── contact/
│   │   │   ├── public/settings/
│   │   │   ├── user/membership/
│   │   │   └── waitlist/
│   │   ├── auth/callback/route.ts
│   │   ├── blog/ (listing + [slug])
│   │   ├── changelog/
│   │   ├── checkout/success/
│   │   ├── invite/[token]/
│   │   ├── monitoring/route.ts (Sentry tunnel)
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (70+ shadcn components)
│   │   ├── layout/ (header, footer)
│   │   ├── landing/ (hero, marquee, counters, etc.)
│   │   ├── branding/ (dynamic branding)
│   │   ├── auth/ (UserNav)
│   │   ├── admin/ (image-upload)
│   │   ├── subscription/ (UpgradeBanner)
│   │   ├── analytics/ (plausible)
│   │   ├── feedback-widget.tsx
│   │   ├── help-widget.tsx
│   │   ├── notification-bell.tsx
│   │   ├── social-upgrade-banner.tsx
│   │   └── waitlist-form.tsx
│   ├── lib/
│   │   ├── supabase/ (client, server, admin)
│   │   ├── stripe/ (client, service, feature-gate, webhook-handlers)
│   │   ├── email/ (client, service, template)
│   │   ├── ai/ (provider - xAI, OpenAI, Anthropic)
│   │   ├── webhooks/ (dispatcher - HMAC, retry, fire-and-forget)
│   │   ├── sso/ (provider - SAML SSO management)
│   │   ├── queue/ (index - BullMQ job queue with 10 job types, types)
│   │   ├── social/ (client, rate-limits, user-tier, debug, n8n-templates/)
│   │   ├── config/ (secrets, ensure-table - centralized API key management)
│   │   ├── validation/ (schemas, index)
│   │   ├── rate-limit/ (index - Upstash Redis sliding window)
│   │   ├── logging/
│   │   ├── notifications/ (server-side notification utility)
│   │   ├── settings/
│   │   └── team-permissions.ts
│   ├── hooks/
│   │   ├── use-setup-settings.ts
│   │   └── use-setup-settings-context.tsx
│   ├── types/
│   │   └── settings.ts (all settings interfaces)
│   ├── instrumentation-client.ts (Sentry client)
│   └── instrumentation.ts (Sentry server + queue worker)
├── migrations/
│   ├── core/                          # Core MuseKit tables
│   └── extensions/                    # SocioScheduler extension tables
│       ├── 001_socioschedule_tables.sql
│       └── 002_engagement_metrics_placeholder.sql
├── tests/
│   ├── auth.setup.ts
│   ├── blog.spec.ts
│   ├── e2e-full.spec.ts
│   ├── waitlist.spec.ts
│   ├── feedback.spec.ts
│   ├── email-templates.spec.ts
│   └── run-tests.sh
├── docs/
│   ├── ADMIN_GUIDE.md
│   ├── MASTER_PLAN.md
│   ├── MUSE_CHECKLIST.md
│   ├── PROJECT_OVERVIEW.md
│   └── SETUP_GUIDE.md
├── middleware.ts
├── next.config.ts
├── playwright.config.ts
├── sentry.server.config.ts
├── sentry.edge.config.ts
├── .env.template
└── package.json
```

---

## Database Tables

Run this SQL in Supabase SQL Editor:

```sql
-- ===================
-- PROFILES (extends auth.users)
-- ===================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- USER ROLES
-- ===================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  app_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- ===================
-- ORGANIZATION SETTINGS
-- ===================
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL DEFAULT 'default' UNIQUE,
  settings JSONB NOT NULL DEFAULT '{
    "organizationName": "My SaaS",
    "supportEmail": "support@example.com",
    "allowNewSignups": true,
    "maintenanceMode": false,
    "requireEmailVerification": false,
    "enableGoogleSignIn": true
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO organization_settings (app_id) VALUES ('default');

-- ===================
-- AUDIT LOGS
-- ===================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  app_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- ORGANIZATIONS (for team collaboration)
-- ===================
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Default Organization',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default organization
INSERT INTO organizations (name) VALUES ('Default Organization');

-- ===================
-- ORGANIZATION MEMBERS
-- ===================
CREATE TABLE organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ===================
-- INVITATIONS
-- ===================
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- ===================
-- ADMIN NOTES (for customer service)
-- ===================
CREATE TABLE IF NOT EXISTS admin_notes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id ON admin_notes(user_id);

-- ===================
-- ENABLE RLS
-- ===================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- ===================
-- RLS POLICIES
-- ===================

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- User Roles
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Organization Settings
CREATE POLICY "Anyone can read settings" ON organization_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON organization_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Organizations (service role manages, users can read their org)
CREATE POLICY "Service role full access orgs" ON organizations
  FOR ALL USING (true);

-- Organization Members (service role manages via admin client)
CREATE POLICY "Service role full access org_members" ON organization_members
  FOR ALL USING (true);

-- Invitations (service role manages via admin client)
CREATE POLICY "Service role full access invitations" ON invitations
  FOR ALL USING (true);

-- Admin Notes (service role only)
CREATE POLICY "Service role full access admin_notes" ON admin_notes
  FOR ALL USING (true) WITH CHECK (true);
```

> **Important RLS Note**: The policies above for organization tables use `FOR ALL USING (true)` which is permissive. **Access is controlled server-side** by using the Supabase admin client (service role) in API routes, not by RLS. This means:
> - Client-side queries to these tables may fail or return empty results
> - All team operations go through server API endpoints that use the admin client
> - For stricter RLS, add policies that check `auth.uid()` membership in organization_members

---

## SocioScheduler Extension Tables

If you're using the SocioScheduler extension, run this SQL **after** the core tables. These tables are specific to SocioScheduler and would NOT exist in other Muse clones.

The migration files are located in `migrations/extensions/`.

```sql
-- SocioScheduler Extension Tables
-- Run AFTER core social tables (migrations/core/001_social_tables.sql)

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Extend social_posts with SocioScheduler-specific columns
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS trend_source TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS niche_triggered TEXT;

-- Expanded status values: 'queued' (BullMQ), 'approved' (user approved AI), 'ignored' (user rejected)
-- Composite index for fast queue views
CREATE INDEX IF NOT EXISTS idx_social_posts_user_status ON social_posts(user_id, status);

-- 2. Brand Preferences table
CREATE TABLE IF NOT EXISTS brand_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  niche TEXT NOT NULL DEFAULT 'other',
  location TEXT,
  sample_urls TEXT[] DEFAULT '{}',
  target_audience TEXT,
  posting_goals TEXT,
  preferred_platforms TEXT[] DEFAULT '{}',
  post_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_preferences_user_id ON brand_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_preferences_org_id ON brand_preferences(org_id);

-- 3. Alert Logs table
CREATE TABLE IF NOT EXISTS alert_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NULL,
  trend_text TEXT NOT NULL,
  suggested_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  action_taken TEXT,
  platform TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_logs_user_created ON alert_logs(user_id, created_at DESC);

-- 4. Triggers (reuses update_updated_at_column() from core migration)
DROP TRIGGER IF EXISTS brand_preferences_updated_at ON brand_preferences;
CREATE TRIGGER brand_preferences_updated_at
  BEFORE UPDATE ON brand_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Supabase Configuration

### Authentication Settings
1. Go to **Authentication > URL Configuration**
2. Set Site URL to your Vercel URL
3. Add Redirect URLs:
   - `https://your-app.vercel.app/*`
   - `http://localhost:3000/*`

### Storage Bucket
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
4. Enable the provider toggle in Admin Dashboard > Setup > Features tab

**Admin Controls:**
- Login/signup pages only show OAuth buttons that are enabled in Features settings
- Toggle providers on/off without code changes
- Changes take effect immediately (no caching delay)

---

## Stripe Configuration

### Products & Prices
Create in Stripe Dashboard:
- **Pro Plan**: $29/month
- **Team Plan**: $99/month

### SocioScheduler Tiers (Optional)

If using SocioScheduler, create additional products with these metadata values:

| Product | Metadata Key | Metadata Value | Description |
|---------|-------------|----------------|-------------|
| Socio Starter | `muse_tier` | `tier_1` | 5 posts/day, 3 AI gen/day |
| Socio Basic | `muse_tier` | `tier_2` | 20 posts/day, 15 AI gen/day |
| Socio Premium | `muse_tier` | `tier_3` | 100 posts/day, 50 AI gen/day |

The `getUserSocialTier` function in `src/lib/social/user-tier.ts` maps these metadata values to rate limits. Tier definitions (display names, metadata values, and rate limits) are admin-configurable from the SocioScheduler setup page (`/admin/setup/socioscheduler`). Admins can add or remove tiers as needed.

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
| `npx playwright test` | Run E2E tests (92 tests across 7 files) |
| `git push` | Deploy to Vercel (auto-deploy) |

---

## Important URLs

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)
- [Resend Dashboard](https://resend.com)
- [Plausible Dashboard](https://plausible.io)
- [Upstash Console](https://console.upstash.com)

---

## What's Included (Full Feature Set)

| Feature | Status |
|---------|--------|
| Email/Password Auth | Complete |
| 5 OAuth Providers (Google, GitHub, Apple, X, Magic Link) | Complete |
| OAuth Admin Controls (enable/disable from dashboard) | Complete |
| Profile with Avatar + Connected Providers | Complete |
| Admin Dashboard with Metrics | Complete |
| Metrics Dashboard (10 KPIs + NPS + Alerts) | Complete |
| User Management | Complete |
| User Impersonation | Complete |
| Setup Dashboard (11 Sub-Pages: Branding, Compliance, Content, Features, Integrations, SocioScheduler, Pages, Pricing, Security, Social, Support) | Complete |
| Onboarding Wizard (4-step guided setup) | Complete |
| Stripe Billing + Feature Gating | Complete |
| Customer Portal | Complete |
| Team Collaboration (Owner/Manager/Member/Viewer) | Complete |
| Email Invitations | Complete |
| Email Template Editor + Test Sending | Complete |
| Blog/Changelog System (Markdown) | Complete |
| Waitlist Mode + CSV Export | Complete |
| Feedback Widget + NPS Rating | Complete |
| Help Widget (AI Support Chatbot) | Complete |
| In-App Notifications | Complete |
| Audit Log Viewer | Complete |
| AI Integration (xAI Grok, OpenAI, Anthropic) | Complete |
| Webhook/n8n Automation (8 events, HMAC signing) | Complete |
| Sentry Error Tracking (Server + Browser) | Complete |
| Plausible Analytics | Complete |
| E2E Testing (92 Playwright Tests, 7 Files) | Complete |
| SEO/Sitemap | Complete |
| Row Level Security (RLS) | Complete |
| Rate Limiting + Security Headers | Complete |
| Structured Logging | Complete |
| Dark/Light Mode | Complete |
| Custom Pages System | Complete |
| Announcement Bar | Complete |
| SSO/SAML Enterprise Auth | Complete |
| Queue Infrastructure (BullMQ + Upstash, 10 Job Types) | Complete |
| Rate Limiting (Upstash Redis) | Complete |
| Customer Service Tools | Complete |
| Admin Setup UX (11 Sub-Pages) | Complete |
| Legal & Compliance Pages (9 pages + cookie consent) | Complete |
| Scheduled Metrics Reports | Complete |
| Metrics Alerts (Churn Rate + User Growth) | Complete |
| Database Backup Configuration | Complete |
| API Token Rotation | Complete |
| SocioScheduler Module (10 platforms, 2 tiers) | Complete |
| Centralized API Keys & Integrations | Complete |
| SocioScheduler Extension (OAuth, Tiers, Analytics, Calendar, Brand Prefs, Quick Generate) | Complete |

---

*Last Updated: February 9, 2026*
